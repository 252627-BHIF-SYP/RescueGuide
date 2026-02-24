using Microsoft.EntityFrameworkCore;
using RescueGuideDB.Core.Entities;

namespace RescueGuideDB.Persistence;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users { get; set; }
    public DbSet<Emergency> Emergencies { get; set; }
    public DbSet<Measure> Measures { get; set; }
    public DbSet<Plan> Plans { get; set; }
    public DbSet<Location> Locations { get; set; }
    public DbSet<InstructionCategory> InstructionCategories { get; set; }
    public DbSet<InstructionStep> InstructionSteps { get; set; }
    public DbSet<Quiz> Quizzes { get; set; }
    public DbSet<Question> Questions { get; set; }
    public DbSet<AnswerOption> AnswerOptions { get; set; }
   
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);
    }
}