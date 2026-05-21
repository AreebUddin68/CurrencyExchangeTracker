using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RateService.Migrations
{
    /// <inheritdoc />
    public partial class FixAlertSystemSettingIdentity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AlertSystemSettings");

            migrationBuilder.CreateTable(
                name: "AlertSystemSettings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false),
                    MaxAlertsPerUser = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AlertSystemSettings", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AlertSystemSettings");

            migrationBuilder.CreateTable(
                name: "AlertSystemSettings",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    MaxAlertsPerUser = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AlertSystemSettings", x => x.Id);
                });
        }
    }
}
