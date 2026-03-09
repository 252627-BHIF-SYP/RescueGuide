using Microsoft.AspNetCore.Mvc;
using RescueGuideDB.Core.Entities;
using RescueGuideDB.Persistence;
using Microsoft.EntityFrameworkCore;

namespace WebApplication1.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AnswerOptionController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    public AnswerOptionController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<AnswerOption>>> GetAll()
    {
        return await _context.Set<AnswerOption>().ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<AnswerOption>> GetById(int id)
    {
        var option = await _context.Set<AnswerOption>().FindAsync(id);
        if (option == null) return NotFound();
        return option;
    }

    [HttpPost]
    public async Task<ActionResult<AnswerOption>> Create(AnswerOption option)
    {
        _context.Set<AnswerOption>().Add(option);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = option.Id }, option);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, AnswerOption option)
    {
        if (id != option.Id) return BadRequest();
        _context.Entry(option).State = EntityState.Modified;
        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!_context.Set<AnswerOption>().Any(e => e.Id == id)) return NotFound();
            throw;
        }
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var option = await _context.Set<AnswerOption>().FindAsync(id);
        if (option == null) return NotFound();
        _context.Set<AnswerOption>().Remove(option);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
