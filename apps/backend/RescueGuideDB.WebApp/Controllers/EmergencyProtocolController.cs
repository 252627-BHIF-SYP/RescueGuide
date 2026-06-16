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
        if (!string.IsNullOrWhiteSpace(protocol.Type))
        {
            emergency.Einsatzart = protocol.Type;
        }
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

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, EmergencyProtocolUpdateDto protocol)
    {
        var existingProtocol = await _context.EmergencyProtocols.FindAsync(id);
        if (existingProtocol == null)
        {
            return NotFound();
        }

        existingProtocol.Type = protocol.Type;
        existingProtocol.CallerName = protocol.CallerName;
        existingProtocol.CallerType = protocol.CallerType;
        existingProtocol.CallbackNumber = protocol.CallbackNumber;
        existingProtocol.Address = protocol.Address;
        existingProtocol.InjuredCount = protocol.InjuredCount?.ToString();
        existingProtocol.Description = protocol.Description;
        existingProtocol.DispatcherName = protocol.DispatcherName;
        existingProtocol.Date = protocol.Date;
        existingProtocol.Time = protocol.Time;
        existingProtocol.AlarmedRD = protocol.AlarmedRD;
        existingProtocol.AlarmedNA = protocol.AlarmedNA;
        existingProtocol.AlarmedPol = protocol.AlarmedPol;
        existingProtocol.AlarmedFW = protocol.AlarmedFW;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!EmergencyProtocolExists(id)) return NotFound();
            throw;
        }

        return NoContent();
    }

    private bool EmergencyProtocolExists(int id)
    {
        return _context.EmergencyProtocols.Any(e => e.Id == id);
    }

    public class EmergencyProtocolUpdateDto
    {
        public string? Type { get; set; }
        public string? CallerName { get; set; }
        public string? CallerType { get; set; }
        public string? CallbackNumber { get; set; }
        public string? Address { get; set; }
        public object? InjuredCount { get; set; }
        public string? Description { get; set; }
        public string? DispatcherName { get; set; }
        public string? Date { get; set; }
        public string? Time { get; set; }
        public bool AlarmedRD { get; set; }
        public bool AlarmedNA { get; set; }
        public bool AlarmedPol { get; set; }
        public bool AlarmedFW { get; set; }
    }
}
