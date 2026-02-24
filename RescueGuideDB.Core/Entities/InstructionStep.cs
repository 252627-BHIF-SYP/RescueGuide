namespace RescueGuideDB.Core.Entities;

public class InstructionStep
{
    public int Id { get; set; }

    public Guid InstructionCategoryId { get; set; }
    public InstructionCategory InstructionCategory { get; set; }

    public int Order { get; set; }
    public string Title { get; set; }
    public string Description { get; set; }
    
    public string? ImageUrl { get; set; }
}