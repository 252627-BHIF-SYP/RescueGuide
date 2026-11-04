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

public class PlansIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public PlansIntegrationTests(WebApplicationFactory<Program> factory)
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
        var response = await client.GetAsync("/api/plans");

        // Assert
        response.EnsureSuccessStatusCode();
        Assert.Equal("application/json; charset=utf-8", response.Content.Headers.ContentType?.ToString());
    }

    [Fact]
    public async Task Post_CreatesNewPlanAndReturnsIt()
    {
        // Arrange
        var client = _factory.CreateClient();
        var newPlan = new Plan
        {
            Name = "Integration Test Plan",
            Author = "Tester"
        };

        // Act
        var response = await client.PostAsJsonAsync("/api/plans", newPlan);

        // Assert
        response.EnsureSuccessStatusCode();
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        
        var created = await response.Content.ReadFromJsonAsync<Plan>();
        Assert.NotNull(created);
        Assert.Equal("Integration Test Plan", created.Name);
        Assert.True(created.Id > 0);
    }

    [Fact]
    public async Task Post_WithTags_NormalizesAndPersistsTags()
    {
        // Arrange
        var client = _factory.CreateClient();
        var newPlan = new Plan
        {
            Name = "Plan With Tags",
            Author = "Author",
            Tags = new List<string> { "notfall", "ERWACHSENE", "notfall", " trauma " }
        };

        // Act
        var response = await client.PostAsJsonAsync("/api/plans", newPlan);

        // Assert
        response.EnsureSuccessStatusCode();
        var created = await response.Content.ReadFromJsonAsync<Plan>();
        Assert.NotNull(created);
        Assert.Equal(3, created.Tags.Count);
        Assert.Contains("Notfall", created.Tags);
        Assert.Contains("Erwachsene", created.Tags);
        Assert.Contains("Trauma", created.Tags);

        // Verify GET persistence
        var getResponse = await client.GetAsync($"/api/plans/{created.Id}");
        getResponse.EnsureSuccessStatusCode();
        var fetched = await getResponse.Content.ReadFromJsonAsync<Plan>();
        Assert.NotNull(fetched);
        Assert.Equal(created.Tags, fetched.Tags);
    }

    [Fact]
    public async Task Post_WithInvalidTagSpecialCharacters_ReturnsBadRequest()
    {
        // Arrange
        var client = _factory.CreateClient();
        var newPlan = new Plan
        {
            Name = "Invalid Tag Plan",
            Tags = new List<string> { "Tag#1", "Valid" }
        };

        // Act
        var response = await client.PostAsJsonAsync("/api/plans", newPlan);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        var error = await response.Content.ReadAsStringAsync();
        Assert.Contains("Tag#1", error);
    }

    [Fact]
    public async Task Put_UpdatesTagsOnExistingPlan()
    {
        // Arrange: Create first
        var client = _factory.CreateClient();
        var newPlan = new Plan
        {
            Name = "Plan To Update",
            Author = "Tester",
            Tags = new List<string> { "InitialTag" }
        };
        var createResponse = await client.PostAsJsonAsync("/api/plans", newPlan);
        var created = await createResponse.Content.ReadFromJsonAsync<Plan>();
        Assert.NotNull(created);

        // Act: Update tags
        created.Tags = new List<string> { "UpdatedTag", "neuertag" };
        var putResponse = await client.PutAsJsonAsync($"/api/plans/{created.Id}", created);

        // Assert
        Assert.Equal(HttpStatusCode.NoContent, putResponse.StatusCode);

        // Verify GET has updated tags in TitleCase
        var getResponse = await client.GetAsync($"/api/plans/{created.Id}");
        var updated = await getResponse.Content.ReadFromJsonAsync<Plan>();
        Assert.NotNull(updated);
        Assert.Equal(2, updated.Tags.Count);
        Assert.Contains("Updatedtag", updated.Tags);
        Assert.Contains("Neuertag", updated.Tags);
    }
}
