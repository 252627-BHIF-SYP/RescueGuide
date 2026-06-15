using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RescueGuideDB.Core.Entities;
using RescueGuideDB.Persistence;

namespace RescueGuideDB.WebApp.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MeasuresController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public MeasuresController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Measure>>> GetMeasures()
    {
        return await _context.Measures.ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Measure>> GetMeasure(int id)
    {
        var measure = await _context.Measures.FindAsync(id);

        if (measure == null)
        {
            return NotFound();
        }

        return measure;
    }

    [HttpPost]
    public async Task<ActionResult<Measure>> PostMeasure(Measure measure)
    {
        _context.Measures.Add(measure);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetMeasure), new { id = measure.Id }, measure);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> PutMeasure(int id, Measure measure)
    {
        if (id != measure.Id)
        {
            return BadRequest();
        }

        _context.Entry(measure).State = EntityState.Modified;

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!MeasureExists(id))
            {
                return NotFound();
            }
            else
            {
                throw;
            }
        }

        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteMeasure(int id)
    {
        var measure = await _context.Measures.FindAsync(id);
        if (measure == null)
        {
            return NotFound();
        }

        _context.Measures.Remove(measure);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private bool MeasureExists(int id)
    {
        return _context.Measures.Any(e => e.Id == id);
    }
}
