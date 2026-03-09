using RescueGuideDB.Core.Enums;
namespace RescueGuideDB.Core.Entities;

public class Emergency
{
    public int Id { get; set; }

    public int UserId { get; set; }
    public required UserControlCenter UserControlCenter { get; set; }
    
    public int ClientId { get; set; }
    public required Client Client { get; set; }
    
    public DateTime StartedAt { get; set; }
    public DateTime? EndedAt { get; set; }

    public EmergencyStatus Status { get; set; }

    public int LocationId { get; set; }
    public required Location Location { get; set; }
    
}