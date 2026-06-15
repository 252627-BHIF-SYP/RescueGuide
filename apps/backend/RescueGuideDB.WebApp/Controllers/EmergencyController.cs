using Microsoft.AspNetCore.Mvc;
using RescueGuideDB.Core.Entities;
using RescueGuideDB.Core.Entities.DTOs;
using RescueGuideDB.Core.Enums;
using RescueGuideDB.Persistence;
using Microsoft.EntityFrameworkCore;

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
    public async Task<ActionResult<IEnumerable<EmergencyDashboardDto>>> GetDashboard()
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
                Address = emergency.Protocol != null ? emergency.Protocol.Address : null
            })
            .ToListAsync();

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
