using Microsoft.EntityFrameworkCore;
using RescueGuideDB.Core.Entities;

namespace RescueGuideDB.Persistence;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<FirstHelp> FirstHelps { get; set; }
    public DbSet<Client> Clients { get; set; }
    public DbSet<Emergency> Emergencies { get; set; }
    public DbSet<EmergencyProtocol> EmergencyProtocols { get; set; }
    public DbSet<Location> Locations { get; set; }
    public DbSet<InstructionCategory> InstructionCategories { get; set; }
    public DbSet<InstructionStep> InstructionSteps { get; set; }
    public DbSet<UserControlCenter> UserControlCenters { get; set; }
    public DbSet<Measure> Measures { get; set; }
    public DbSet<Plan> Plans { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);
        
        modelBuilder.Entity<Emergency>()
            .HasOne(e => e.Protocol)
            .WithOne(p => p.Emergency)
            .HasForeignKey<EmergencyProtocol>(p => p.EmergencyId)
            .OnDelete(DeleteBehavior.Cascade);
    }
    
    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        if (!optionsBuilder.IsConfigured)  // nur als Fallback
        {
            optionsBuilder.UseNpgsql("...");
        }
    }
}