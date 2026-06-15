using Microsoft.AspNetCore.Mvc;
using RescueGuideDB.Core.Entities;
using RescueGuideDB.Core.Entities.DTOs;
using RescueGuideDB.Core.Enums;
using RescueGuideDB.Persistence;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace WebApplication1.Controllers;

[ApiController]
[Route("api/[controller]")]
public class EmergencyController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public EmergencyController(ApplicationDbContext context)
    {
        _context = context;
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
                HandlerName = emergency.Protocol != null ? emergency.Protocol.DispatcherName : null,
                Address = emergency.Protocol != null ? emergency.Protocol.Address : null
            })
            .ToListAsync(cancellationToken);

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
        var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (int.TryParse(userIdValue, out var userId))
        {
            var handler = await _context.UserControlCenters.FindAsync(userId);
            if (handler != null)
            {
                emergency.UserId = handler.Id;
                emergency.UserControlCenter = handler;
            }
        }

        emergency.Protocol = new EmergencyProtocol
        {
            Date = DateTime.Now.ToString("yyyy-MM-dd"),
            Time = DateTime.Now.ToString("HH:mm")
        };

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

    [HttpPut("{id}/close")]
    public async Task<IActionResult> Close(int id)
    {
        var emergency = await _context.Emergencies.FindAsync(id);
        if (emergency == null) return NotFound();

        emergency.EndedAt = DateTime.UtcNow;
        emergency.Status = EmergencyStatus.Completed;

        // Optionally, update Einsatzart from protocol if needed, but since protocol is auto-saving, we can just leave it as is or handle it.
        var protocol = await _context.EmergencyProtocols.FirstOrDefaultAsync(p => p.EmergencyId == id);
        if (protocol != null && !string.IsNullOrWhiteSpace(protocol.Type))
        {
            emergency.Einsatzart = protocol.Type;
        }

        await _context.SaveChangesAsync();
        return NoContent();
    }
}
