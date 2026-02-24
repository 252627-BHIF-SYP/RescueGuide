using RescueGuideDB.Core.Enums;
namespace RescueGuideDB.Core.Entities;

public class Emergency
{
    public int Id { get; set; }

    public int UserId { get; set; }
    public User User { get; set; }

    public DateTime StartedAt { get; set; }
    public DateTime? EndedAt { get; set; }

    public EmergencyStatus Status { get; set; }

    public Location Location { get; set; }

    public ICollection<Measure> Measures { get; set; }
    public ICollection<Plan> Plans { get; set; }
}