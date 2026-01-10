using LeitstellenBackend.Models;
using Microsoft.AspNetCore.Mvc;

namespace LeitstellenBackend.Controllers;

[ApiController]
[Route("api/leitstelle")]
public class LeitstelleController : ControllerBase
{
    private static List<LocationUpdate> _locations = new();

    [HttpPost("receive")]
    public IActionResult Receive([FromBody] LocationUpdate update)
    {
        _locations.Add(update);
        Console.WriteLine($"LEITSTELLE - Koordinaten empfangen: {update.Latitude}, {update.Longitude}");
        return Ok(new { message = "Daten erfolgreich empfangen" });
    }

    [HttpGet("all")]
    public IActionResult GetAll() => Ok(_locations);
}