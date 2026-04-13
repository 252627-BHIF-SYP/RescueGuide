namespace RescueGuideDB.Core.Entities;

public class InstructionStep
{
    public int Id { get; set; }

    public int InstructionCategoryId { get; set; }
    public InstructionCategory? InstructionCategory { get; set; }

    public int Order { get; set; }
    public required string Title { get; set; } 
    public required string Description { get; set; }
    
    public string? ImageUrl { get; set; }
}