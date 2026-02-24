namespace RescueGuideDB.Core.Entities;

public class Quiz
{
    public int Id { get; set; }
    public string Title { get; set; }

    public ICollection<Question> Questions { get; set; }
}