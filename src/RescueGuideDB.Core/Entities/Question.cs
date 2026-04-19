namespace RescueGuideDB.Core.Entities;

public class Question
{
    public int Id { get; set; }
    public required string Text { get; set; }
    
    public ICollection<AnswerOption> AnswerOptions { get; set; }
}