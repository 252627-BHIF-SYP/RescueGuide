using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RescueGuideDB.Core.Entities;
using RescueGuideDB.Persistence;
using RescueGuideDB.WebApp.Controllers;
using Xunit;

namespace RescueGuideDB.Tests;

public class MeasuresControllerTests
{
    private ApplicationDbContext GetDbContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new ApplicationDbContext(options);
    }

    [Fact]
    public async Task GetMeasures_ReturnsAllMeasures()
    {
        // Arrange
        var context = GetDbContext();
        context.Measures.Add(new Measure { Name = "M1", Description = "D1" });
        context.Measures.Add(new Measure { Name = "M2", Description = "D2" });
        await context.SaveChangesAsync();
        var controller = new MeasuresController(context);

        // Act
        var result = await controller.GetMeasures();

        // Assert
        var measures = Assert.IsAssignableFrom<IEnumerable<Measure>>(result.Value);
        Assert.Equal(2, measures.Count());
    }

    [Fact]
    public async Task GetMeasure_ReturnsMeasure_WhenMeasureExists()
    {
        // Arrange
        var context = GetDbContext();
        context.Measures.Add(new Measure { Id = 1, Name = "M1", Description = "D1" });
        await context.SaveChangesAsync();
        var controller = new MeasuresController(context);

        // Act
        var result = await controller.GetMeasure(1);

        // Assert
        Assert.NotNull(result.Value);
        Assert.Equal("M1", result.Value.Name);
    }

    [Fact]
    public async Task PostMeasure_CreatesMeasure()
    {
        // Arrange
        var context = GetDbContext();
        var controller = new MeasuresController(context);
        var measure = new Measure { Name = "M1", Description = "D1" };

        // Act
        var result = await controller.PostMeasure(measure);

        // Assert
        var actionResult = Assert.IsType<CreatedAtActionResult>(result.Result);
        var createdMeasure = Assert.IsType<Measure>(actionResult.Value);
        Assert.Equal("M1", createdMeasure.Name);
        Assert.Equal(1, context.Measures.Count());
    }

    [Fact]
    public async Task PutMeasure_UpdatesMeasure()
    {
        // Arrange
        var context = GetDbContext();
        var measure = new Measure { Id = 1, Name = "M1", Description = "D1" };
        context.Measures.Add(measure);
        await context.SaveChangesAsync();
        var controller = new MeasuresController(context);

        // Act
        var updatedMeasure = new Measure { Id = 1, Name = "M1_Updated", Description = "D1" };
        
        context.Entry(measure).State = EntityState.Detached;
        
        var result = await controller.PutMeasure(1, updatedMeasure);

        // Assert
        Assert.IsType<NoContentResult>(result);
        var dbMeasure = await context.Measures.FindAsync(1);
        Assert.Equal("M1_Updated", dbMeasure!.Name);
    }

    [Fact]
    public async Task DeleteMeasure_RemovesMeasure()
    {
        // Arrange
        var context = GetDbContext();
        var measure = new Measure { Id = 1, Name = "M1", Description = "D1" };
        context.Measures.Add(measure);
        await context.SaveChangesAsync();
        var controller = new MeasuresController(context);

        // Act
        var result = await controller.DeleteMeasure(1);

        // Assert
        Assert.IsType<NoContentResult>(result);
        Assert.Empty(context.Measures);
    }
}
