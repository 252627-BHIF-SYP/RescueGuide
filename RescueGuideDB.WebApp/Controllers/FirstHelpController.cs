using Microsoft.AspNetCore.Mvc;
using RescueGuideDB.Core.Entities;
using RescueGuideDB.Persistence;
using Microsoft.EntityFrameworkCore;

namespace WebApplication1.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FirstHelpController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    public FirstHelpController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<FirstHelp>>> GetAll()
    {
        return await _context.FirstHelps.ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<FirstHelp>> GetById(int id)
    {
        var help = await _context.FirstHelps.FindAsync(id);
        if (help == null) return NotFound();
        return help;
    }

    [HttpPost]
    public async Task<ActionResult<FirstHelp>> Create(FirstHelp help)
    {
        _context.FirstHelps.Add(help);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = help.Id }, help);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, FirstHelp help)
    {
        if (id != help.Id) return BadRequest();
        _context.Entry(help).State = EntityState.Modified;
        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!_context.FirstHelps.Any(e => e.Id == id)) return NotFound();
            throw;
        }
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var help = await _context.FirstHelps.FindAsync(id);
        if (help == null) return NotFound();
        _context.FirstHelps.Remove(help);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
