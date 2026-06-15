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
}
