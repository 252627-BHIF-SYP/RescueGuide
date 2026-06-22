namespace RescueGuideDB.Core.Entities;

public class PlanMeasure
{
    public int PlanId { get; set; }
    public Plan Plan { get; set; } = null!;

    public int MeasureId { get; set; }
    public Measure Measure { get; set; } = null!;

    public int Order { get; set; }
}
