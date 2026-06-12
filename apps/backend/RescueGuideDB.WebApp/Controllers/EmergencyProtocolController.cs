using Microsoft.AspNetCore.Mvc;
using RescueGuideDB.Core.Entities;
using RescueGuideDB.Persistence;
using Microsoft.EntityFrameworkCore;

namespace RescueGuideDB.WebApp.Controllers;

[ApiController]
[Route("api/[controller]")]
public class EmergencyProtocolController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    
    public EmergencyProtocolController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpPost]
    public async Task<ActionResult<EmergencyProtocol>> Create(EmergencyProtocol protocol)
    {
        var emergency = await _context.Emergencies.FindAsync(protocol.EmergencyId);
        if (emergency == null)
        {
            return BadRequest("Emergency not found.");
        }

        // Also mark the emergency as ended
        emergency.EndedAt = DateTime.UtcNow;
        emergency.Status = RescueGuideDB.Core.Enums.EmergencyStatus.Completed; 
        _context.Entry(emergency).State = EntityState.Modified;

        _context.EmergencyProtocols.Add(protocol);
        await _context.SaveChangesAsync();
        
        return CreatedAtAction(nameof(GetById), new { id = protocol.Id }, protocol);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<EmergencyProtocol>> GetById(int id)
    {
        var protocol = await _context.EmergencyProtocols.FindAsync(id);
        if (protocol == null) return NotFound();
        return protocol;
    }

    [HttpGet("ByEmergency/{emergencyId}")]
    public async Task<ActionResult<EmergencyProtocol>> GetByEmergencyId(int emergencyId)
    {
        var protocol = await _context.EmergencyProtocols
            .FirstOrDefaultAsync(p => p.EmergencyId == emergencyId);
            
        if (protocol == null) return NotFound();
        return protocol;
    }
}
