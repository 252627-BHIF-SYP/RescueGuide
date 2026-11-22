using Microsoft.EntityFrameworkCore;
using RescueGuideDB.Core;
using RescueGuideDB.Core.Entities;
using RescueGuideDB.Persistence;
using RescueGuideDB.Persistence.Seed;
using Xunit;

namespace RescueGuideDB.Tests;

public class DefaultInstructionSeederTests
{
    private static ApplicationDbContext GetDbContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new ApplicationDbContext(options);
    }

    [Fact]
    public async Task Seed_EmptyDatabase_CreatesAllMeasuresAndPlans()
    {
        var db = GetDbContext();

        var result = await DefaultInstructionSeeder.SeedAsync(db);

        Assert.Equal(DefaultInstructionData.Measures.Count, result.MeasuresAdded);
        Assert.Equal(DefaultInstructionData.Plans.Count, result.PlansAdded);
        Assert.Equal(DefaultInstructionData.Measures.Count, await db.Measures.CountAsync());
        Assert.Equal(DefaultInstructionData.Plans.Count, await db.Plans.CountAsync());
        Assert.True(await db.Measures.AllAsync(m => !m.IsUserCreated && m.Author == DefaultInstructionData.Author));
    }

    [Fact]
    public async Task Seed_RunTwice_DoesNotCreateDuplicates()
    {
        var db = GetDbContext();

        await DefaultInstructionSeeder.SeedAsync(db);
        var second = await DefaultInstructionSeeder.SeedAsync(db);

        Assert.Equal(0, second.MeasuresAdded);
        Assert.Equal(0, second.PlansAdded);
        Assert.Equal(DefaultInstructionData.Measures.Count, await db.Measures.CountAsync());
        Assert.Equal(DefaultInstructionData.Plans.Count, await db.Plans.CountAsync());
    }

    [Fact]
    public async Task Seed_PlansKeepDefinedMeasureOrder()
    {
        var db = GetDbContext();
        await DefaultInstructionSeeder.SeedAsync(db);

        foreach (var seedPlan in DefaultInstructionData.Plans)
        {
            var plan = await db.Plans
                .Include(p => p.PlanMeasures).ThenInclude(pm => pm.Measure)
                .SingleAsync(p => p.Name == seedPlan.Name);

            var orderedNames = plan.PlanMeasures.OrderBy(pm => pm.Order).Select(pm => pm.Measure.Name).ToArray();
            Assert.Equal(seedPlan.MeasureNames, orderedNames);
        }
    }

    [Fact]
    public async Task Seed_DoesNotOverwriteExistingMeasureWithSameName()
    {
        var db = GetDbContext();
        db.Measures.Add(new Measure
        {
            Name = DefaultInstructionData.StabileSeitenlage,
            Description = "Eigene Beschreibung",
            IsUserCreated = true,
        });
        await db.SaveChangesAsync();

        var result = await DefaultInstructionSeeder.SeedAsync(db);

        Assert.Equal(DefaultInstructionData.Measures.Count - 1, result.MeasuresAdded);
        var measure = await db.Measures.SingleAsync(m => m.Name == DefaultInstructionData.StabileSeitenlage);
        Assert.Equal("Eigene Beschreibung", measure.Description);
    }

    [Fact]
    public void SeedData_IsConsistent()
    {
        var measureNames = DefaultInstructionData.Measures.Select(m => m.Name).ToList();
        Assert.Equal(measureNames.Count, measureNames.Distinct(StringComparer.OrdinalIgnoreCase).Count());

        foreach (var measure in DefaultInstructionData.Measures)
        {
            Assert.False(string.IsNullOrWhiteSpace(measure.Description));
            Assert.True(TagValidator.ValidateTags(measure.Tags).IsValid, $"Ungültige Tags bei '{measure.Name}'");
        }

        foreach (var plan in DefaultInstructionData.Plans)
        {
            Assert.True(TagValidator.ValidateTags(plan.Tags).IsValid, $"Ungültige Tags bei '{plan.Name}'");
            Assert.All(plan.MeasureNames, n => Assert.Contains(n, measureNames));
            // PlanMeasure-Schlüssel ist (PlanId, MeasureId) → keine Maßnahme doppelt pro Plan
            Assert.Equal(plan.MeasureNames.Length, plan.MeasureNames.Distinct().Count());
        }
    }
}
