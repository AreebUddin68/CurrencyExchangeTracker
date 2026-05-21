using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RateService.Migrations
{
    /// <inheritdoc />
    public partial class PersistRateAlerts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
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

            migrationBuilder.CreateTable(
                name: "RateAlerts",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    Username = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FromCurrency = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    ToCurrency = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    TargetRate = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Direction = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IsTriggered = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    TriggeredAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RateAlerts", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_RateAlerts_FromCurrency_ToCurrency",
                table: "RateAlerts",
                columns: new[] { "FromCurrency", "ToCurrency" });

            migrationBuilder.CreateIndex(
                name: "IX_RateAlerts_UserId_IsTriggered",
                table: "RateAlerts",
                columns: new[] { "UserId", "IsTriggered" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AlertSystemSettings");

            migrationBuilder.DropTable(
                name: "RateAlerts");
        }
    }
}
