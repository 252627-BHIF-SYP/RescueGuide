namespace RescueGuideDB.Core.Entities;

public class Measure
{
    public int Id { get; set; }
    public required string Name { get; set; }
    public required string Description { get; set; }
    public bool IsUserCreated { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string? Author { get; set; }
    public string? ImageUrl { get; set; }

    public ICollection<Plan> Plans { get; set; } = [];
}
