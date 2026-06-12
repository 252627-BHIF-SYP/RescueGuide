using System;

namespace RescueGuideDB.Core.Entities;

public class EmergencyProtocol
{
    public int Id { get; set; }
    
    public int EmergencyId { get; set; }
    public Emergency? Emergency { get; set; }

    public string? Type { get; set; }
    public string? CallerName { get; set; }
    public string? CallerType { get; set; }
    public string? CallbackNumber { get; set; }
    public string? Address { get; set; }
    public string? InjuredCount { get; set; }
    public string? Description { get; set; }
    public string? DispatcherName { get; set; }
    public string? Date { get; set; }
    public string? Time { get; set; }

    public bool AlarmedRD { get; set; }
    public bool AlarmedNA { get; set; }
    public bool AlarmedPol { get; set; }
    public bool AlarmedFW { get; set; }
}
