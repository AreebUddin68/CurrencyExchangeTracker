using AuditService.Models;
using Microsoft.EntityFrameworkCore;

namespace AuditService.Data;

public class AuditDbContext : DbContext
{
    public AuditDbContext(DbContextOptions<AuditDbContext> options)
        : base(options) { }

    public DbSet<AuditLog> AuditLogs { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Index on CorrelationId so we can quickly find
        // all logs belonging to the same request
        modelBuilder.Entity<AuditLog>()
            .HasIndex(a => a.CorrelationId);

        // Index on ServiceName for filtering by service
        modelBuilder.Entity<AuditLog>()
            .HasIndex(a => a.ServiceName);

        // Index on Timestamp for sorting
        modelBuilder.Entity<AuditLog>()
            .HasIndex(a => a.Timestamp);
    }
}