namespace RescueGuideDB.Core.Entities;

public class Client
{
    public int Id { get; set; }
    
    public required string FirstName { get; set; }
    public required string LastName { get; set; }
    public string? Email { get; set; }
    public required string DateOfBirth { get; set; }
    public string? Address { get; set; }
    public string? Allergies { get; set; }
    public string? PreExistingConditions { get; set; }
    public string? Medikaments { get; set; }
    public required string BloodGroup { get; set; }

    public ICollection<Emergency> Emergencies { get; set; } = [];
}