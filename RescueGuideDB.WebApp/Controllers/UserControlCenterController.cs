using Microsoft.AspNetCore.Mvc;
using RescueGuideDB.Core.Entities;
using RescueGuideDB.Persistence;
using Microsoft.EntityFrameworkCore;

namespace WebApplication1.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UserControlCenterController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    public UserControlCenterController(ApplicationDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<UserControlCenter>>> GetAll()
    {
        return await _context.UserControlCenters.ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<UserControlCenter>> GetById(int id)
    {
        var user = await _context.UserControlCenters.FindAsync(id);
        if (user == null) return NotFound();
        return user;
    }

    [HttpPost]
    public async Task<ActionResult<UserControlCenter>> Create(UserControlCenter user)
    {
        _context.UserControlCenters.Add(user);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetById), new { id = user.Id }, user);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, UserControlCenter user)
    {
        if (id != user.Id) return BadRequest();
        _context.Entry(user).State = EntityState.Modified;
        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            if (!_context.UserControlCenters.Any(e => e.Id == id)) return NotFound();
            throw;
        }
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var user = await _context.UserControlCenters.FindAsync(id);
        if (user == null) return NotFound();
        _context.UserControlCenters.Remove(user);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}
