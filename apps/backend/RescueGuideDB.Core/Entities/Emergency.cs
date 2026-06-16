using RescueGuideDB.Core.Enums;
namespace RescueGuideDB.Core.Entities;

public class Emergency
{
    public int Id { get; set; }

    public int? UserId { get; set; }
    public UserControlCenter? UserControlCenter { get; set; }
    
    public int? ClientId { get; set; }
    public Client? Client { get; set; }
    
    public DateTime StartedAt { get; set; }
    public DateTime? EndedAt { get; set; }

    public EmergencyStatus Status { get; set; }
    public string Einsatzart { get; set; } = "Sonstiges";

    public int? LocationId { get; set; }
    public Location? Location { get; set; }
    
    public EmergencyProtocol? Protocol { get; set; }
}
