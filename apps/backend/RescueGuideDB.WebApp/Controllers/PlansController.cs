using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RescueGuideDB.Core.Entities;
using RescueGuideDB.Persistence;

namespace RescueGuideDB.WebApp.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PlansController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public PlansController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Plan>>> GetPlans()
    {
        return await _context.Plans.Include(p => p.Measures).ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Plan>> GetPlan(int id)
    {
        var plan = await _context.Plans.Include(p => p.Measures).FirstOrDefaultAsync(p => p.Id == id);

        if (plan == null)
        {
            return NotFound();
        }

        return plan;
    }

    [HttpPost]
    public async Task<ActionResult<Plan>> PostPlan(Plan plan)
    {
        var existingMeasureIds = plan.Measures.Select(m => m.Id).ToList();
        plan.Measures.Clear();

        if (existingMeasureIds.Any())
        {
            var existingMeasures = await _context.Measures.Where(m => existingMeasureIds.Contains(m.Id)).ToListAsync();
            foreach (var m in existingMeasures)
            {
                plan.Measures.Add(m);
            }
        }

        _context.Plans.Add(plan);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetPlan), new { id = plan.Id }, plan);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> PutPlan(int id, Plan plan)
    {
        if (id != plan.Id)
        {
            return BadRequest();
        }

        var existingPlan = await _context.Plans.Include(p => p.Measures).FirstOrDefaultAsync(p => p.Id == id);
        if (existingPlan == null)
        {
            return NotFound();
        }

        existingPlan.Name = plan.Name;
        existingPlan.Author = plan.Author;
        
        var newMeasureIds = plan.Measures.Select(m => m.Id).ToList();
        existingPlan.Measures.Clear();
        if (newMeasureIds.Any())
        {
            var newMeasures = await _context.Measures.Where(m => newMeasureIds.Contains(m.Id)).ToListAsync();
            foreach (var m in newMeasures)
            {
                existingPlan.Measures.Add(m);
            }
        }

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!PlanExists(id))
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
    public async Task<IActionResult> DeletePlan(int id)
    {
        var plan = await _context.Plans.FindAsync(id);
        if (plan == null)
        {
            return NotFound();
        }

        _context.Plans.Remove(plan);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private bool PlanExists(int id)
    {
        return _context.Plans.Any(e => e.Id == id);
    }
}
