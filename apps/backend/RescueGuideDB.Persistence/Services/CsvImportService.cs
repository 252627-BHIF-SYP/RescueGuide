using CsvHelper;
using System.Globalization;
using RescueGuideDB.Core.Entities;
using RescueGuideDB.Core.Enums;
using RescueGuideDB.Persistence;

namespace RescueGuideDB.Persistence.Services;

public class CsvImportService
{
    private readonly ApplicationDbContext _context;

    public CsvImportService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task ImportClients(string path)
    {
        using var reader = new StreamReader(path);
        using var csv = new CsvReader(reader, CultureInfo.InvariantCulture);
        var records = csv.GetRecords<Client>().ToList();

        _context.Clients.AddRange(records);
        await _context.SaveChangesAsync();
    }

    public async Task ImportLocations(string path)
    {
        using var reader = new StreamReader(path);
        using var csv = new CsvReader(reader, CultureInfo.InvariantCulture);
        var records = csv.GetRecords<Location>().ToList();

        _context.Locations.AddRange(records);
        await _context.SaveChangesAsync();
    }

    public async Task ImportUsers(string path)
    {
        using var reader = new StreamReader(path);
        using var csv = new CsvReader(reader, CultureInfo.InvariantCulture);
        var records = csv.GetRecords<UserControlCenter>().ToList();

        _context.UserControlCenters.AddRange(records);
        await _context.SaveChangesAsync();
    }

    public async Task ImportInstructionCategories(string path)
    {
        using var reader = new StreamReader(path);
        using var csv = new CsvReader(reader, CultureInfo.InvariantCulture);
        var records = csv.GetRecords<InstructionCategory>().ToList();

        _context.InstructionCategories.AddRange(records);
        await _context.SaveChangesAsync();
    }

    public async Task ImportInstructions(string path)
    {
        var steps = new List<InstructionStep>();
        using (var reader = new StreamReader(path))
        {
            string? line;
            bool first = true;
            while ((line = reader.ReadLine()) != null)
            {
                if (first) { first = false; continue; } 
                if (string.IsNullOrWhiteSpace(line)) continue;
                var parts = line.Split(',');
                if (parts.Length < 6) continue;

                steps.Add(new InstructionStep
                {
                    Id = int.Parse(parts[0]),
                    InstructionCategoryId = int.Parse(parts[1]),
                    InstructionCategory = null!, 
                    Order = int.Parse(parts[2]),
                    Title = parts[3],
                    Description = parts[4],
                    ImageUrl = string.IsNullOrWhiteSpace(parts[5]) ? null : parts[5]
                });
            }
        }
        _context.InstructionSteps.AddRange(steps);
        await _context.SaveChangesAsync();
    }

    public async Task ImportEmergencies(string path)
    {
        var userControlCenters = _context.UserControlCenters.ToDictionary(u => u.Id);
        var clients = _context.Clients.ToDictionary(c => c.Id);
        var locations = _context.Locations.ToDictionary(l => l.Id);
        var emergencies = new List<Emergency>();
        using (var reader = new StreamReader(path))
        {
            string? line;
            bool first = true;
            while ((line = reader.ReadLine()) != null)
            {
                if (first) { first = false; continue; } 
                if (string.IsNullOrWhiteSpace(line)) continue;
                var parts = line.Split(',');
                if (parts.Length < 7) continue;

                emergencies.Add(new Emergency
                {
                    Id = int.Parse(parts[0]),
                    UserId = int.Parse(parts[1]),
                    UserControlCenter = userControlCenters[int.Parse(parts[1])],
                    ClientId = int.Parse(parts[2]),
                    Client = clients[int.Parse(parts[2])],
                    StartedAt = DateTime.SpecifyKind(DateTime.Parse(parts[3]), DateTimeKind.Utc),
                    EndedAt = string.IsNullOrWhiteSpace(parts[4]) ? null : DateTime.SpecifyKind(DateTime.Parse(parts[4]), DateTimeKind.Utc),
                    Status = Enum.Parse<EmergencyStatus>(parts[5]),
                    LocationId = int.Parse(parts[6]),
                    Location = locations[int.Parse(parts[6])]
                });
            }
        }
        _context.Emergencies.AddRange(emergencies);
        await _context.SaveChangesAsync();
    }

    public async Task ImportFirstHelps(string path)
    {
        using var reader = new StreamReader(path);
        using var csv = new CsvReader(reader, CultureInfo.InvariantCulture);
        var records = csv.GetRecords<FirstHelp>().ToList();
        _context.FirstHelps.AddRange(records);
        await _context.SaveChangesAsync();
    }
}