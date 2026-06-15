using Microsoft.AspNetCore.Mvc;
using RescueGuideDB.Core.Entities;
using RescueGuideDB.Core.Entities.DTOs;
using RescueGuideDB.Core.Enums;
using RescueGuideDB.Persistence;
using Microsoft.EntityFrameworkCore;
using WebApplication1.Services;

namespace WebApplication1.Controllers;

[ApiController]
[Route("api/[controller]")]
public class EmergencyController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ReverseGeocodingService _reverseGeocodingService;

    public EmergencyController(
        ApplicationDbContext context,
        ReverseGeocodingService reverseGeocodingService)
    {
        _context = context;
        _reverseGeocodingService = reverseGeocodingService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Emergency>>> GetAll()
    {
        return await _context.Emergencies.ToListAsync();
    }

    [HttpGet("dashboard")]
    public async Task<ActionResult<IEnumerable<EmergencyDashboardDto>>> GetDashboard(
        CancellationToken cancellationToken)
    {
        var emergencies = await _context.Emergencies
            .AsNoTracking()
            .OrderByDescending(emergency => emergency.StartedAt)
            .Select(emergency => new EmergencyDashboardDto
            {
                Id = emergency.Id,
                Status = emergency.Status == EmergencyStatus.Active ? "Active" : "Completed",
                StartedAt = emergency.StartedAt,
                EndedAt = emergency.EndedAt,
                EmergencyType = emergency.Protocol != null ? emergency.Protocol.Type : null,
                CallerName = emergency.Protocol != null && emergency.Protocol.CallerName != null
                    ? emergency.Protocol.CallerName
                    : emergency.Client != null
                        ? emergency.Client.FirstName + " " + emergency.Client.LastName
                        : null,
                Address = null,
                Latitude = emergency.Location != null ? emergency.Location.Latitude : null,
                Longitude = emergency.Location != null ? emergency.Location.Longitude : null
            })
            .ToListAsync(cancellationToken);

        foreach (var emergency in emergencies)
        {
            if (emergency.Latitude.HasValue && emergency.Longitude.HasValue)
            {
                emergency.Address = await _reverseGeocodingService.GetAddressAsync(
                    emergency.Latitude.Value,
                    emergency.Longitude.Value,
                    cancellationToken);
            }
        }

        return Ok(emergencies);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Emergency>> GetById(int id)
    {
        var emergency = await _context.Emergencies.FindAsync(id);
        if (emergency == null) return NotFound();
        return emergency;
    }

    [HttpPost]
    public async Task<ActionResult<Emergency>> Create(Emergency emergency)
    {
        _context.Emergencies.Add(emergency);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = emergency.Id }, emergency);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, Emergency emergency)
    {
        if (id != emergency.Id) return BadRequest();
        _context.Entry(emergency).State = EntityState.Modified;
        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!_context.Emergencies.Any(e => e.Id == id)) return NotFound();
            throw;
        }
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var emergency = await _context.Emergencies.FindAsync(id);
        if (emergency == null) return NotFound();
        _context.Emergencies.Remove(emergency);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
