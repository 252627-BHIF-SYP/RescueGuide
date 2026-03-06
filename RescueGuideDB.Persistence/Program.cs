using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using RescueGuideDB.Persistence.Services;

namespace RescueGuideDB.Persistence;

public class Program
{
    public static async Task Main(string[] args)
    {
        var services = new ServiceCollection();

        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseNpgsql("Host=localhost; Port=5432; Database=RescueGuideDB; Username=postgres; Password=postgres"));

        services.AddScoped<CsvImportService>();

        var provider = services.BuildServiceProvider();

        using var scope = provider.CreateScope();

        var importer = scope.ServiceProvider.GetRequiredService<CsvImportService>();

        await importer.ImportClients("Data/clients.csv");
        await importer.ImportLocations("Data/locations.csv");
        await importer.ImportUsers("Data/usercontrolcenters.csv");

        Console.WriteLine("CSV Import abgeschlossen.");
    }
}