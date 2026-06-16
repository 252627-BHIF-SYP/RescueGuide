using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using RescueGuideDB.Persistence;

#nullable disable

namespace RescueGuideDB.Persistence.Migrations;

[DbContext(typeof(ApplicationDbContext))]
[Migration("20260615170000_AddEmergencyType")]
public class AddEmergencyType : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "Einsatzart",
            table: "Emergencies",
            type: "text",
            nullable: false,
            defaultValue: "Sonstiges");

        migrationBuilder.Sql("""
            UPDATE "Emergencies"
            SET "Einsatzart" = CASE
                WHEN "Id" = 1 THEN 'Brand'
                WHEN "Id" = 2 THEN 'Unfall'
                ELSE 'Sonstiges'
            END;
            """);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(
            name: "Einsatzart",
            table: "Emergencies");
    }
}
