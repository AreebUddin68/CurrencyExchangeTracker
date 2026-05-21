using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ConvertService.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ConversionHistories",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    Username = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FromCurrency = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ToCurrency = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    OriginalAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    EncryptedConvertedAmount = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    EncryptedRate = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ConvertedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CorrelationId = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ConversionHistories", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ConversionHistories_ConvertedAt",
                table: "ConversionHistories",
                column: "ConvertedAt");

            migrationBuilder.CreateIndex(
                name: "IX_ConversionHistories_UserId",
                table: "ConversionHistories",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ConversionHistories");
        }
    }
}
