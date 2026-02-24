namespace RescueGuideDB.Core.Entities;

public class Measure
{
    public int Id { get; set; }

    public Guid EmergencyId { get; set; }
    public Emergency Emergency { get; set; }

    public string Title { get; set; }
    public string Description { get; set; }
}