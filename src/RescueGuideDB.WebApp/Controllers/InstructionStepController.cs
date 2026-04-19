using Microsoft.AspNetCore.Mvc;
using RescueGuideDB.Core.Entities;
using RescueGuideDB.Persistence;
using Microsoft.EntityFrameworkCore;

namespace WebApplication1.Controllers;

[ApiController]
[Route("api/[controller]")]
public class InstructionStepController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    public InstructionStepController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<InstructionStep>>> GetAll()
    {
        return await _context.InstructionSteps.ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<InstructionStep>> GetById(int id)
    {
        var step = await _context.InstructionSteps.FindAsync(id);
        if (step == null) return NotFound();
        return step;
    }

    [HttpPost]
    public async Task<ActionResult<InstructionStep>> Create(InstructionStep step)
    {
        _context.InstructionSteps.Add(step);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = step.Id }, step);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, InstructionStep step)
    {
        if (id != step.Id) return BadRequest();
        _context.Entry(step).State = EntityState.Modified;
        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!_context.InstructionSteps.Any(e => e.Id == id)) return NotFound();
            throw;
        }
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var step = await _context.InstructionSteps.FindAsync(id);
        if (step == null) return NotFound();
        _context.InstructionSteps.Remove(step);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
