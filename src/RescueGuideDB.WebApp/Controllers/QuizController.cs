using Microsoft.AspNetCore.Mvc;
using RescueGuideDB.Core.Entities;
using RescueGuideDB.Persistence;
using Microsoft.EntityFrameworkCore;

namespace WebApplication1.Controllers;

[ApiController]
[Route("api/[controller]")]
public class QuizController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    public QuizController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Quiz>>> GetAll()
    {
        return await _context.Set<Quiz>().ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Quiz>> GetById(int id)
    {
        var quiz = await _context.Set<Quiz>().FindAsync(id);
        if (quiz == null) return NotFound();
        return quiz;
    }

    [HttpPost]
    public async Task<ActionResult<Quiz>> Create(Quiz quiz)
    {
        _context.Set<Quiz>().Add(quiz);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = quiz.Id }, quiz);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, Quiz quiz)
    {
        if (id != quiz.Id) return BadRequest();
        _context.Entry(quiz).State = EntityState.Modified;
        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!_context.Set<Quiz>().Any(e => e.Id == id)) return NotFound();
            throw;
        }
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var quiz = await _context.Set<Quiz>().FindAsync(id);
        if (quiz == null) return NotFound();
        _context.Set<Quiz>().Remove(quiz);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
