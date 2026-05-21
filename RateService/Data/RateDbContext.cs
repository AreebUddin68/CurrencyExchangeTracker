using Microsoft.EntityFrameworkCore;
using RateService.Models;

namespace RateService.Data;

public class RateDbContext : DbContext
{
    public RateDbContext(DbContextOptions<RateDbContext> options)
        : base(options)
    {
    }

    public DbSet<RateAlert> RateAlerts { get; set; }
    public DbSet<AlertSystemSetting> AlertSystemSettings { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<RateAlert>()
            .HasKey(a => a.Id);

        modelBuilder.Entity<RateAlert>()
            .HasIndex(a => new { a.UserId, a.IsTriggered });

        modelBuilder.Entity<RateAlert>()
            .HasIndex(a => new { a.FromCurrency, a.ToCurrency });

        modelBuilder.Entity<RateAlert>()
            .Property(a => a.TargetRate)
            .HasPrecision(18, 6);

        modelBuilder.Entity<AlertSystemSetting>()
            .HasKey(s => s.Id);
    }
}
