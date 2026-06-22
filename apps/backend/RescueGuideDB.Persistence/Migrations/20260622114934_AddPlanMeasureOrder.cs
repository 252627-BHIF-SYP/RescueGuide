using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RescueGuideDB.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddPlanMeasureOrder : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "MeasurePlan");

            migrationBuilder.CreateTable(
                name: "PlanMeasures",
                columns: table => new
                {
                    PlanId = table.Column<int>(type: "integer", nullable: false),
                    MeasureId = table.Column<int>(type: "integer", nullable: false),
                    Order = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PlanMeasures", x => new { x.PlanId, x.MeasureId });
                    table.ForeignKey(
                        name: "FK_PlanMeasures_Measures_MeasureId",
                        column: x => x.MeasureId,
                        principalTable: "Measures",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PlanMeasures_Plans_PlanId",
                        column: x => x.PlanId,
                        principalTable: "Plans",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PlanMeasures_MeasureId",
                table: "PlanMeasures",
                column: "MeasureId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PlanMeasures");

            migrationBuilder.CreateTable(
                name: "MeasurePlan",
                columns: table => new
                {
                    MeasuresId = table.Column<int>(type: "integer", nullable: false),
                    PlansId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MeasurePlan", x => new { x.MeasuresId, x.PlansId });
                    table.ForeignKey(
                        name: "FK_MeasurePlan_Measures_MeasuresId",
                        column: x => x.MeasuresId,
                        principalTable: "Measures",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MeasurePlan_Plans_PlansId",
                        column: x => x.PlansId,
                        principalTable: "Plans",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_MeasurePlan_PlansId",
                table: "MeasurePlan",
                column: "PlansId");
        }
    }
}
