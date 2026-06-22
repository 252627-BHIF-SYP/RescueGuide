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
        var plans = await _context.Plans
            .Include(p => p.PlanMeasures.OrderBy(pm => pm.Order))
            .ThenInclude(pm => pm.Measure)
            .ToListAsync();
            
        // Map PlanMeasures back to Measures for the response
        foreach (var plan in plans)
        {
            plan.Measures = plan.PlanMeasures.Select(pm => pm.Measure).ToList();
        }
        
        return plans;
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Plan>> GetPlan(int id)
    {
        var plan = await _context.Plans
            .Include(p => p.PlanMeasures.OrderBy(pm => pm.Order))
            .ThenInclude(pm => pm.Measure)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (plan == null)
        {
            return NotFound();
        }

        plan.Measures = plan.PlanMeasures.Select(pm => pm.Measure).ToList();

        return plan;
    }

    [HttpPost]
    public async Task<ActionResult<Plan>> PostPlan(Plan plan)
    {
        var existingMeasureIds = plan.Measures.Select(m => m.Id).ToList();
        plan.Measures.Clear(); // Clear the measures list as we use PlanMeasures now

        // Create explicit PlanMeasure entities with Order
        if (existingMeasureIds.Any())
        {
            var existingMeasures = await _context.Measures.Where(m => existingMeasureIds.Contains(m.Id)).ToListAsync();
            
            // Re-order based on the input array order
            for (int i = 0; i < existingMeasureIds.Count; i++)
            {
                var measureId = existingMeasureIds[i];
                var measure = existingMeasures.FirstOrDefault(m => m.Id == measureId);
                if (measure != null)
                {
                    plan.PlanMeasures.Add(new PlanMeasure 
                    { 
                        Plan = plan, 
                        Measure = measure, 
                        Order = i 
                    });
                }
            }
        }

        _context.Plans.Add(plan);
        await _context.SaveChangesAsync();

        // Populate Measures for response
        plan.Measures = plan.PlanMeasures.Select(pm => pm.Measure).ToList();

        return CreatedAtAction(nameof(GetPlan), new { id = plan.Id }, plan);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> PutPlan(int id, Plan plan)
    {
        if (id != plan.Id)
        {
            return BadRequest();
        }

        var existingPlan = await _context.Plans
            .Include(p => p.PlanMeasures)
            .FirstOrDefaultAsync(p => p.Id == id);
            
        if (existingPlan == null)
        {
            return NotFound();
        }

        existingPlan.Name = plan.Name;
        existingPlan.Author = plan.Author;
        
        var newMeasureIds = plan.Measures.Select(m => m.Id).ToList();
        
        // Remove existing PlanMeasures
        _context.PlanMeasures.RemoveRange(existingPlan.PlanMeasures);
        existingPlan.PlanMeasures.Clear();

        if (newMeasureIds.Any())
        {
            var newMeasures = await _context.Measures.Where(m => newMeasureIds.Contains(m.Id)).ToListAsync();
            
            for (int i = 0; i < newMeasureIds.Count; i++)
            {
                var measureId = newMeasureIds[i];
                var measure = newMeasures.FirstOrDefault(m => m.Id == measureId);
                if (measure != null)
                {
                    existingPlan.PlanMeasures.Add(new PlanMeasure 
                    { 
                        Plan = existingPlan, 
                        Measure = measure, 
                        Order = i 
                    });
                }
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
