using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using RescueGuideDB.Persistence.Services;

namespace RescueGuideDB.Persistence;

public class Program
{
    public static async Task Main(string[] args)
    {
        try
        {
            var services = new ServiceCollection();

            services.AddDbContext<ApplicationDbContext>(options =>
                options.UseNpgsql("Host=localhost; Port=5432; Database=RescueGuideDB; Username=postgres; Password=postgres"));

            services.AddScoped<CsvImportService>();

            var provider = services.BuildServiceProvider();

            using var scope = provider.CreateScope();

            var importer = scope.ServiceProvider.GetRequiredService<CsvImportService>();

            //await importer.ImportClients("Data/clients.csv");
            //await importer.ImportLocations("Data/locations.csv");
            //await importer.ImportUsers("Data/usercontrolcenters.csv");
            //await importer.ImportInstructionCategories("Data/instructioncategories.csv");
            //await importer.ImportInstructions("Data/instructionsteps.csv");
            await importer.ImportEmergencies("Data/emergencies.csv");
            //await importer.ImportFirstHelps("Data/firsthelp.csv");

            Console.WriteLine("CSV Import abgeschlossen.");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Fehler: {ex.Message}");
            if (ex.InnerException != null)
            {
                Console.WriteLine($"Inner Exception: {ex.InnerException.Message}");
                if (ex.InnerException.InnerException != null)
                {
                    Console.WriteLine($"Inner Inner Exception: {ex.InnerException.InnerException.Message}");
                }
            }
            Console.WriteLine($"StackTrace: {ex.StackTrace}");
            throw;
        }
    }
}