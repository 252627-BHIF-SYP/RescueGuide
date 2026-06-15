namespace RescueGuideDB.Core.Entities.DTOs;

public class EmergencyDashboardDto
{
    public int Id { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime StartedAt { get; set; }
    public DateTime? EndedAt { get; set; }
    public string? EmergencyType { get; set; }
    public string? HandlerName { get; set; }
    public string? Address { get; set; }
}
