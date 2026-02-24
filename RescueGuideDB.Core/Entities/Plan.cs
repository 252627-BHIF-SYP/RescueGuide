namespace RescueGuideDB.Core.Entities;

public class Plan
{
    public int Id { get; set; }

    public Guid EmergencyId { get; set; }
    public Emergency Emergency { get; set; }

    public string Name { get; set; }
    public string Description { get; set; }
}