using Microsoft.AspNetCore.Mvc;
using RescueGuideDB.Core.Entities;
using RescueGuideDB.Persistence;
using Microsoft.EntityFrameworkCore;

namespace WebApplication1.Controllers;

[ApiController]
[Route("api/[controller]")]
public class InstructionCategoryController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    public InstructionCategoryController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<InstructionCategory>>> GetAll()
    {
        return await _context.InstructionCategories.ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<InstructionCategory>> GetById(int id)
    {
        var category = await _context.InstructionCategories.FindAsync(id);
        if (category == null) return NotFound();
        return category;
    }

    [HttpPost]
    public async Task<ActionResult<InstructionCategory>> Create(InstructionCategory category)
    {
        _context.InstructionCategories.Add(category);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = category.Id }, category);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, InstructionCategory category)
    {
        if (id != category.Id) return BadRequest();
        _context.Entry(category).State = EntityState.Modified;
        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!_context.InstructionCategories.Any(e => e.Id == id)) return NotFound();
            throw;
        }
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var category = await _context.InstructionCategories.FindAsync(id);
        if (category == null) return NotFound();
        _context.InstructionCategories.Remove(category);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
