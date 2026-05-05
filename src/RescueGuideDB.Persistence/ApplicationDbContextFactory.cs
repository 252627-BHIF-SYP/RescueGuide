using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using static Microsoft.EntityFrameworkCore.DbContext;

namespace RescueGuideDB.Persistence;

public class ApplicationDbContextFactory 
    : IDesignTimeDbContextFactory<ApplicationDbContext>
{
    public ApplicationDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<ApplicationDbContext>();

        optionsBuilder.UseNpgsql("Host=192.168.6.10;Port=5432;Database=RescueGuideDB;Username=postgres;Password=postgres")
        ;

        return new ApplicationDbContext(optionsBuilder.Options);
    }
}