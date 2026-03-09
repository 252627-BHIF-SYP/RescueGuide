using Microsoft.AspNetCore.Mvc;
using RescueGuideDB.Core.Entities;
using RescueGuideDB.Persistence;
using Microsoft.EntityFrameworkCore;

namespace WebApplication1.Controllers;

[ApiController]
[Route("api/[controller]")]
public class QuestionController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    public QuestionController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Question>>> GetAll()
    {
        return await _context.Set<Question>().ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Question>> GetById(int id)
    {
        var question = await _context.Set<Question>().FindAsync(id);
        if (question == null) return NotFound();
        return question;
    }

    [HttpPost]
    public async Task<ActionResult<Question>> Create(Question question)
    {
        _context.Set<Question>().Add(question);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = question.Id }, question);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, Question question)
    {
        if (id != question.Id) return BadRequest();
        _context.Entry(question).State = EntityState.Modified;
        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!_context.Set<Question>().Any(e => e.Id == id)) return NotFound();
            throw;
        }
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var question = await _context.Set<Question>().FindAsync(id);
        if (question == null) return NotFound();
        _context.Set<Question>().Remove(question);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
