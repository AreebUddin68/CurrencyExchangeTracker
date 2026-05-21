using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ConvertService.Migrations
{
    /// <inheritdoc />
    public partial class AddFavoritePairSupport : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "ToCurrency",
                table: "ConversionHistories",
                type: "nvarchar(450)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AlterColumn<string>(
                name: "FromCurrency",
                table: "ConversionHistories",
                type: "nvarchar(450)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AddColumn<bool>(
                name: "IsFavoritePair",
                table: "ConversionHistories",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateIndex(
                name: "IX_ConversionHistories_UserId_FromCurrency_ToCurrency",
                table: "ConversionHistories",
                columns: new[] { "UserId", "FromCurrency", "ToCurrency" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_ConversionHistories_UserId_FromCurrency_ToCurrency",
                table: "ConversionHistories");

            migrationBuilder.DropColumn(
                name: "IsFavoritePair",
                table: "ConversionHistories");

            migrationBuilder.AlterColumn<string>(
                name: "ToCurrency",
                table: "ConversionHistories",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(450)");

            migrationBuilder.AlterColumn<string>(
                name: "FromCurrency",
                table: "ConversionHistories",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(450)");
        }
    }
}
