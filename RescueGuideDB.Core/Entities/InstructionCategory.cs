namespace RescueGuideDB.Core.Entities;

public class InstructionCategory
{
    public int Id { get; set; }

    public string Name { get; set; }

    public ICollection<InstructionStep> Steps { get; set; }
}