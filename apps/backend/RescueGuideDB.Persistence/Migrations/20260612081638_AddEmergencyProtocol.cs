using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace RescueGuideDB.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddEmergencyProtocol : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Emergencies_Clients_ClientId",
                table: "Emergencies");

            migrationBuilder.DropForeignKey(
                name: "FK_Emergencies_Locations_LocationId",
                table: "Emergencies");

            migrationBuilder.AlterColumn<int>(
                name: "UserId",
                table: "Emergencies",
                type: "integer",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AlterColumn<int>(
                name: "LocationId",
                table: "Emergencies",
                type: "integer",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AlterColumn<int>(
                name: "ClientId",
                table: "Emergencies",
                type: "integer",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.CreateTable(
                name: "EmergencyProtocols",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    EmergencyId = table.Column<int>(type: "integer", nullable: false),
                    Type = table.Column<string>(type: "text", nullable: true),
                    CallerName = table.Column<string>(type: "text", nullable: true),
                    CallerType = table.Column<string>(type: "text", nullable: true),
                    CallbackNumber = table.Column<string>(type: "text", nullable: true),
                    Address = table.Column<string>(type: "text", nullable: true),
                    InjuredCount = table.Column<string>(type: "text", nullable: true),
                    Description = table.Column<string>(type: "text", nullable: true),
                    DispatcherName = table.Column<string>(type: "text", nullable: true),
                    Date = table.Column<string>(type: "text", nullable: true),
                    Time = table.Column<string>(type: "text", nullable: true),
                    AlarmedRD = table.Column<bool>(type: "boolean", nullable: false),
                    AlarmedNA = table.Column<bool>(type: "boolean", nullable: false),
                    AlarmedPol = table.Column<bool>(type: "boolean", nullable: false),
                    AlarmedFW = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EmergencyProtocols", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EmergencyProtocols_Emergencies_EmergencyId",
                        column: x => x.EmergencyId,
                        principalTable: "Emergencies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_EmergencyProtocols_EmergencyId",
                table: "EmergencyProtocols",
                column: "EmergencyId",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Emergencies_Clients_ClientId",
                table: "Emergencies",
                column: "ClientId",
                principalTable: "Clients",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Emergencies_Locations_LocationId",
                table: "Emergencies",
                column: "LocationId",
                principalTable: "Locations",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Emergencies_Clients_ClientId",
                table: "Emergencies");

            migrationBuilder.DropForeignKey(
                name: "FK_Emergencies_Locations_LocationId",
                table: "Emergencies");

            migrationBuilder.DropTable(
                name: "EmergencyProtocols");

            migrationBuilder.AlterColumn<int>(
                name: "UserId",
                table: "Emergencies",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.AlterColumn<int>(
                name: "LocationId",
                table: "Emergencies",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.AlterColumn<int>(
                name: "ClientId",
                table: "Emergencies",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Emergencies_Clients_ClientId",
                table: "Emergencies",
                column: "ClientId",
                principalTable: "Clients",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Emergencies_Locations_LocationId",
                table: "Emergencies",
                column: "LocationId",
                principalTable: "Locations",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
