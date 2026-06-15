namespace RescueGuideDB.Core.Entities.DTOs;

public class EmergencyDashboardDto
{
    public int Id { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime StartedAt { get; set; }
    public DateTime? EndedAt { get; set; }
    public string? EmergencyType { get; set; }
    public string? CallerName { get; set; }
    public string? Address { get; set; }
    public double? Latitude { get; set; }
    public double? Longitude { get; set; }
}
