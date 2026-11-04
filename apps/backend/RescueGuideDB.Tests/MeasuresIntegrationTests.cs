using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using RescueGuideDB.Core.Entities;
using RescueGuideDB.Persistence;
using Xunit;

namespace RescueGuideDB.Tests;

public class MeasuresIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public MeasuresIntegrationTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory.WithWebHostBuilder(builder =>
        {
            builder.UseEnvironment("Testing");
        });
    }

    [Fact]
    public async Task Get_EndpointsReturnSuccessAndCorrectContentType()
    {
        // Arrange
        var client = _factory.CreateClient();

        // Act
        var response = await client.GetAsync("/api/measures");

        // Assert
        response.EnsureSuccessStatusCode();
        Assert.Equal("application/json; charset=utf-8", response.Content.Headers.ContentType?.ToString());
    }

    [Fact]
    public async Task Post_CreatesNewMeasureAndReturnsIt()
    {
        // Arrange
        var client = _factory.CreateClient();
        var newMeasure = new Measure
        {
            Name = "Integration Test Measure",
            Description = "Test Desc"
        };

        // Act
        var response = await client.PostAsJsonAsync("/api/measures", newMeasure);

        // Assert
        response.EnsureSuccessStatusCode();
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        
        var created = await response.Content.ReadFromJsonAsync<Measure>();
        Assert.NotNull(created);
        Assert.Equal("Integration Test Measure", created.Name);
        Assert.True(created.Id > 0);
    }

    [Fact]
    public async Task Post_WithTags_NormalizesToTitleCaseAndDeduplicates()
    {
        // Arrange
        var client = _factory.CreateClient();
        var newMeasure = new Measure
        {
            Name = "Measure With Tags",
            Description = "Description",
            Tags = new List<string> { "  reanimation ", "atmung", "REANIMATION", "herz" }
        };

        // Act
        var response = await client.PostAsJsonAsync("/api/measures", newMeasure);

        // Assert
        response.EnsureSuccessStatusCode();
        var created = await response.Content.ReadFromJsonAsync<Measure>();
        Assert.NotNull(created);
        Assert.NotNull(created.Tags);
        Assert.Equal(3, created.Tags.Count);
        Assert.Contains("Reanimation", created.Tags);
        Assert.Contains("Atmung", created.Tags);
        Assert.Contains("Herz", created.Tags);

        // Verify GET persistence
        var getResponse = await client.GetAsync($"/api/measures/{created.Id}");
        getResponse.EnsureSuccessStatusCode();
        var fetched = await getResponse.Content.ReadFromJsonAsync<Measure>();
        Assert.NotNull(fetched);
        Assert.Equal(created.Tags, fetched.Tags);
    }

    [Fact]
    public async Task Post_WithInvalidTagSpecialCharacters_ReturnsBadRequest()
    {
        // Arrange
        var client = _factory.CreateClient();
        var newMeasure = new Measure
        {
            Name = "Invalid Tag Measure",
            Description = "Description",
            Tags = new List<string> { "Reanimation123", "ValidTag" }
        };

        // Act
        var response = await client.PostAsJsonAsync("/api/measures", newMeasure);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var error = await response.Content.ReadAsStringAsync();
        Assert.Contains("Reanimation123", error);
    }

    [Fact]
    public async Task Put_UpdatesTagsOnExistingMeasure()
    {
        // Arrange: Create first
        var client = _factory.CreateClient();
        var newMeasure = new Measure
        {
            Name = "Measure To Update",
            Description = "Desc",
            Tags = new List<string> { "InitialTag" }
        };
        var createResponse = await client.PostAsJsonAsync("/api/measures", newMeasure);
        var created = await createResponse.Content.ReadFromJsonAsync<Measure>();
        Assert.NotNull(created);

        // Act: Update tags
        created.Tags = new List<string> { "UpdatedTag", "newtag" };
        var putResponse = await client.PutAsJsonAsync($"/api/measures/{created.Id}", created);

        // Assert
        Assert.Equal(HttpStatusCode.NoContent, putResponse.StatusCode);

        // Verify GET has updated tags in TitleCase
        var getResponse = await client.GetAsync($"/api/measures/{created.Id}");
        var updated = await getResponse.Content.ReadFromJsonAsync<Measure>();
        Assert.NotNull(updated);
        Assert.Equal(2, updated.Tags.Count);
        Assert.Contains("Updatedtag", updated.Tags);
        Assert.Contains("Newtag", updated.Tags);
    }
}
