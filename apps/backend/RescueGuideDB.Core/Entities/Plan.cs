namespace RescueGuideDB.Core.Entities;

public class Plan
{
    public int Id { get; set; }
    public required string Name { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string? Author { get; set; }

    public ICollection<Measure> Measures { get; set; } = [];
}
