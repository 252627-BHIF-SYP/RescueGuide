namespace RescueGuideDB.Core.Entities;

public class Question
{
    public int Id { get; set; }

    public Guid QuizId { get; set; }
    public Quiz Quiz { get; set; }

    public string Text { get; set; }

    public ICollection<AnswerOption> AnswerOptions { get; set; }
}