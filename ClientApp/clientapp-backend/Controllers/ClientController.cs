using Microsoft.AspNetCore.Mvc;
using UserBackend.Models;

namespace UserBackend.Controllers;

[ApiController]
[Route("api/user")]
public class UserController : ControllerBase
{
    private readonly IHttpClientFactory _httpClientFactory;

    public UserController(IHttpClientFactory httpClientFactory)
    {
        _httpClientFactory = httpClientFactory;
    }

    [HttpPost("send-location")]
    public async Task<IActionResult> SendLocation([FromBody] LocationUpdate update)
    {
        var client = _httpClientFactory.CreateClient();
        var leitstelleUrl = "http://localhost:5062/api/leitstelle/receive"; 
        //var leitstelleUrl = "http://cc-backend:8080/api/leitstelle/receive";

        var response = await client.PostAsJsonAsync(leitstelleUrl, update);

        if (response.IsSuccessStatusCode)
            return Ok("Weiterleitung zur Leitstelle erfolgreich");
        
        return StatusCode(500, "Leitstelle konnte nicht erreicht werden");
    }
}