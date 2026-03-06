using CsvHelper;
using System.Globalization;
using RescueGuideDB.Core.Entities;
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
}