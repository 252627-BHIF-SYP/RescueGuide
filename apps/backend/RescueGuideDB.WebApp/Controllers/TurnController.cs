using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace RescueGuideDB.WebApp.Controllers;

/// <summary>Issues short-lived credentials for the configured TURN relay.</summary>
[ApiController]
[Route("api/[controller]")]
public sealed class TurnController(IConfiguration configuration) : ControllerBase
{
    private static readonly TimeSpan CredentialLifetime = TimeSpan.FromHours(1);

    /// <summary>Returns ICE server settings with temporary TURN credentials.</summary>
    [HttpGet("credentials")]
    [EnableRateLimiting("turn-credentials")]
    [ProducesResponseType<TurnCredentialsResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
    [ProducesResponseType(StatusCodes.Status503ServiceUnavailable)]
    public ActionResult<TurnCredentialsResponse> GetCredentials()
    {
        var sharedSecret = configuration["Turn:SharedSecret"];
        var urls = configuration.GetSection("Turn:Urls").Get<string[]>();
        if (string.IsNullOrWhiteSpace(sharedSecret) || sharedSecret.Length < 32 || urls is not { Length: > 0 })
        {
            return Problem(
                statusCode: StatusCodes.Status503ServiceUnavailable,
                title: "TURN credentials are not configured.");
        }

        var expiresAt = DateTimeOffset.UtcNow.Add(CredentialLifetime).ToUnixTimeSeconds();
        var username = $"{expiresAt}:{Guid.NewGuid():N}";
        using var hmac = new HMACSHA1(Encoding.UTF8.GetBytes(sharedSecret));
        var credential = Convert.ToBase64String(hmac.ComputeHash(Encoding.UTF8.GetBytes(username)));

        var iceServers = new[]
        {
            new TurnIceServerResponse(urls, username, credential)
        };

        return Ok(new TurnCredentialsResponse(iceServers, expiresAt));
    }
}

/// <summary>Contains ICE servers and the expiry time of their TURN credentials.</summary>
public sealed record TurnCredentialsResponse(
    IReadOnlyList<TurnIceServerResponse> IceServers,
    long ExpiresAtUnixSeconds);

/// <summary>Describes one ICE server and its temporary credentials.</summary>
public sealed record TurnIceServerResponse(
    IReadOnlyList<string> Urls,
    string Username,
    string Credential);