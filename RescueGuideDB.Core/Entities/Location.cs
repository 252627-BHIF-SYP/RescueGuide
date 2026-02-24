namespace RescueGuideDB.Core.Entities;

public class Location
{
    public int Id { get; set; }

    public Guid EmergencyId { get; set; }

    public double Latitude { get; set; }
    public double Longitude { get; set; }
}