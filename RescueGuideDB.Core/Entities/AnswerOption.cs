namespace RescueGuideDB.Core.Entities;

public class AnswerOption
{
    public int Id { get; set; }
    public required string Text { get; set; }
    public ICollection<Question> Questions { get; set; } = [];
}