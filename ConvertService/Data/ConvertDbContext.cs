using ConvertService.Models;
using Microsoft.EntityFrameworkCore;

namespace ConvertService.Data;

public class ConvertDbContext : DbContext
{
    public ConvertDbContext(DbContextOptions<ConvertDbContext> options)
        : base(options) { }

    // This creates the ConversionHistory table in SQL Server
    public DbSet<ConversionHistory> ConversionHistories { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<ConversionHistory>()
            .HasIndex(c => c.UserId);

        modelBuilder.Entity<ConversionHistory>()
            .HasIndex(c => c.ConvertedAt);

        modelBuilder.Entity<ConversionHistory>()
            .HasIndex(c => new { c.UserId, c.FromCurrency, c.ToCurrency });
    }
}
