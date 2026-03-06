namespace RescueGuideDB.Core.Entities;

public class UserControlCenter
{
    public int Id { get; set; }

    public string Name { get; set; }
    public string PasswordHash { get; set; }
    
    public ICollection<Emergency> Emergencies { get; set; }
}