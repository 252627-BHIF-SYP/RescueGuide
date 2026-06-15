using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RescueGuideDB.Core.Entities;
using RescueGuideDB.Persistence;
using RescueGuideDB.WebApp.Controllers;
using Xunit;

namespace RescueGuideDB.Tests;

public class PlansControllerTests
{
    private ApplicationDbContext GetDbContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new ApplicationDbContext(options);
    }

    [Fact]
    public async Task GetPlans_ReturnsAllPlans()
    {
        // Arrange
        var context = GetDbContext();
        var measure = new Measure { Name = "M1", Description = "D1" };
        var plan = new Plan { Name = "P1", Measures = new List<Measure> { measure } };
        context.Plans.Add(plan);
        await context.SaveChangesAsync();
        var controller = new PlansController(context);

        // Act
        var result = await controller.GetPlans();

        // Assert
        var plans = Assert.IsAssignableFrom<IEnumerable<Plan>>(result.Value);
        Assert.Single(plans);
        Assert.Single(plans.First().Measures);
    }

    [Fact]
    public async Task GetPlan_ReturnsPlanWithMeasures()
    {
        // Arrange
        var context = GetDbContext();
        var measure = new Measure { Name = "M1", Description = "D1" };
        var plan = new Plan { Id = 1, Name = "P1", Measures = new List<Measure> { measure } };
        context.Plans.Add(plan);
        await context.SaveChangesAsync();
        var controller = new PlansController(context);

        // Act
        var result = await controller.GetPlan(1);

        // Assert
        Assert.NotNull(result.Value);
        Assert.Equal("P1", result.Value.Name);
        Assert.Single(result.Value.Measures);
    }

    [Fact]
    public async Task PostPlan_CreatesPlan()
    {
        // Arrange
        var context = GetDbContext();
        var controller = new PlansController(context);
        var plan = new Plan { Name = "P1" };

        // Act
        var result = await controller.PostPlan(plan);

        // Assert
        var actionResult = Assert.IsType<CreatedAtActionResult>(result.Result);
        var createdPlan = Assert.IsType<Plan>(actionResult.Value);
        Assert.Equal("P1", createdPlan.Name);
        Assert.Equal(1, context.Plans.Count());
    }

    [Fact]
    public async Task PutPlan_UpdatesPlan()
    {
        // Arrange
        var context = GetDbContext();
        var plan = new Plan { Id = 1, Name = "P1" };
        context.Plans.Add(plan);
        await context.SaveChangesAsync();
        var controller = new PlansController(context);

        // Act
        var updatedPlan = new Plan { Id = 1, Name = "P1_Updated", Measures = new List<Measure>() };
        
        context.Entry(plan).State = EntityState.Detached;

        var result = await controller.PutPlan(1, updatedPlan);

        // Assert
        Assert.IsType<NoContentResult>(result);
        var dbPlan = await context.Plans.FindAsync(1);
        Assert.Equal("P1_Updated", dbPlan!.Name);
    }

    [Fact]
    public async Task DeletePlan_RemovesPlan()
    {
        // Arrange
        var context = GetDbContext();
        var plan = new Plan { Id = 1, Name = "P1" };
        context.Plans.Add(plan);
        await context.SaveChangesAsync();
        var controller = new PlansController(context);

        // Act
        var result = await controller.DeletePlan(1);

        // Assert
        Assert.IsType<NoContentResult>(result);
        Assert.Empty(context.Plans);
    }
}
