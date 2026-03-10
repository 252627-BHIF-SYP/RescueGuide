using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RescueGuideDB.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class Requiredfieldsdeleted : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Emergencies_UserControlCenters_UserControlCenterId",
                table: "Emergencies");

            migrationBuilder.AlterColumn<int>(
                name: "UserControlCenterId",
                table: "Emergencies",
                type: "integer",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AddForeignKey(
                name: "FK_Emergencies_UserControlCenters_UserControlCenterId",
                table: "Emergencies",
                column: "UserControlCenterId",
                principalTable: "UserControlCenters",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Emergencies_UserControlCenters_UserControlCenterId",
                table: "Emergencies");

            migrationBuilder.AlterColumn<int>(
                name: "UserControlCenterId",
                table: "Emergencies",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Emergencies_UserControlCenters_UserControlCenterId",
                table: "Emergencies",
                column: "UserControlCenterId",
                principalTable: "UserControlCenters",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
