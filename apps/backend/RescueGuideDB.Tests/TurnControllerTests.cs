using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using RescueGuideDB.WebApp.Controllers;

namespace RescueGuideDB.Tests;

public class TurnControllerTests
{
    [Fact]
    public void GetCredentials_ReturnsShortLivedCoturnCredentials()
    {
        const string secret = "0123456789abcdef0123456789abcdef";
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Turn:SharedSecret"] = secret,
                ["Turn:Urls:0"] = "turn:192.168.6.10:3478?transport=udp",
                ["Turn:Urls:1"] = "turn:192.168.6.10:3478?transport=tcp"
            })
            .Build();
        var controller = new TurnController(configuration);

        var result = controller.GetCredentials();

        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var response = Assert.IsType<TurnCredentialsResponse>(okResult.Value);
        var iceServer = Assert.Single(response.IceServers);
        Assert.Equal(
            [
                "turn:192.168.6.10:3478?transport=udp",
                "turn:192.168.6.10:3478?transport=tcp"
            ],
            iceServer.Urls);
        var usernameParts = iceServer.Username.Split(':');
        Assert.Equal(2, usernameParts.Length);
        Assert.False(string.IsNullOrWhiteSpace(usernameParts[1]));
        var expiresAt = long.Parse(usernameParts[0]);
        Assert.InRange(
            expiresAt,
            DateTimeOffset.UtcNow.AddMinutes(59).ToUnixTimeSeconds(),
            DateTimeOffset.UtcNow.AddHours(1).ToUnixTimeSeconds());

        using var hmac = new HMACSHA1(Encoding.UTF8.GetBytes(secret));
        var expectedCredential = Convert.ToBase64String(
            hmac.ComputeHash(Encoding.UTF8.GetBytes(iceServer.Username)));
        Assert.Equal(expectedCredential, iceServer.Credential);
    }

    [Fact]
    public void GetCredentials_ReturnsServiceUnavailable_WhenNotConfigured()
    {
        var controller = new TurnController(new ConfigurationBuilder().Build());

        var result = controller.GetCredentials();

        var problem = Assert.IsType<ObjectResult>(result.Result);
        Assert.Equal(StatusCodes.Status503ServiceUnavailable, problem.StatusCode);
    }
}