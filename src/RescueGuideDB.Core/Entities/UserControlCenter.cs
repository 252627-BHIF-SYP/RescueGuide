namespace RescueGuideDB.Core.Entities;

public class UserControlCenter
{
    public int Id { get; set; }

    public required string Name { get; set; }
    public required string PasswordHash { get; set; }

    public ICollection<Emergency> Emergencies { get; set; } = [];

}