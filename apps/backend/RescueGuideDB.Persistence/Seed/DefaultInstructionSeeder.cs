using Microsoft.EntityFrameworkCore;
using RescueGuideDB.Core.Entities;

namespace RescueGuideDB.Persistence.Seed;

/// <summary>
/// Legt die Standard-Maßnahmen und -Pläne aus <see cref="DefaultInstructionData"/> an.
/// Idempotent: Abgleich per Name – bereits vorhandene Einträge (auch vom Benutzer
/// bearbeitete oder gelöschte-und-neu-angelegte) werden nicht verändert.
/// </summary>
public static class DefaultInstructionSeeder
{
    public sealed record Result(int MeasuresAdded, int PlansAdded);

    public static async Task<Result> SeedAsync(ApplicationDbContext db, CancellationToken ct = default)
    {
        var measuresByName = await db.Measures
            .ToDictionaryAsync(m => m.Name, StringComparer.OrdinalIgnoreCase, ct);

        var measuresAdded = 0;
        foreach (var seed in DefaultInstructionData.Measures)
        {
            if (measuresByName.ContainsKey(seed.Name)) continue;

            var measure = new Measure
            {
                Name = seed.Name,
                Description = seed.Description,
                Tags = [.. seed.Tags],
                IsUserCreated = false,
                Author = DefaultInstructionData.Author,
                CreatedAt = DateTime.UtcNow,
            };
            db.Measures.Add(measure);
            measuresByName[seed.Name] = measure;
            measuresAdded++;
        }

        var existingPlanNames = (await db.Plans.Select(p => p.Name).ToListAsync(ct))
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        var plansAdded = 0;
        foreach (var seed in DefaultInstructionData.Plans)
        {
            if (existingPlanNames.Contains(seed.Name)) continue;

            var plan = new Plan
            {
                Name = seed.Name,
                Tags = [.. seed.Tags],
                Author = DefaultInstructionData.Author,
                CreatedAt = DateTime.UtcNow,
            };

            var order = 0;
            foreach (var measureName in seed.MeasureNames)
            {
                if (!measuresByName.TryGetValue(measureName, out var measure))
                {
                    throw new InvalidOperationException(
                        $"Seed-Plan '{seed.Name}' verweist auf unbekannte Maßnahme '{measureName}'.");
                }

                plan.PlanMeasures.Add(new PlanMeasure { Plan = plan, Measure = measure, Order = order++ });
            }

            db.Plans.Add(plan);
            plansAdded++;
        }

        if (measuresAdded > 0 || plansAdded > 0)
        {
            await db.SaveChangesAsync(ct);
        }

        return new Result(measuresAdded, plansAdded);
    }
}
