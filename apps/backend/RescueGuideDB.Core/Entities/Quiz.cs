namespace RescueGuideDB.Core.Entities;

public class Quiz
{
    public int Id { get; set; }
    public required string Title { get; set; }

    public ICollection<Question> Questions { get; set; } = [];
}