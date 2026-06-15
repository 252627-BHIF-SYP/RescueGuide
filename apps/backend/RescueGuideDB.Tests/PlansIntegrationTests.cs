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
}
