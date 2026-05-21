using AuditService.Data;
using AuditService.Models;
using Microsoft.EntityFrameworkCore;

namespace AuditService.Services;

public class AuditLogService
{
    private readonly AuditDbContext _db;
    private readonly ILogger<AuditLogService> _logger;

    public AuditLogService(AuditDbContext db, ILogger<AuditLogService> logger)
    {
        _db = db;
        _logger = logger;
    }

    // Save a log entry sent by another service
    public async Task SaveLogAsync(CreateAuditLogRequest req)
    {
        var log = new AuditLog
        {
            ServiceName = req.ServiceName,
            Endpoint = req.Endpoint,
            Method = req.Method,
            StatusCode = req.StatusCode,
            LatencyMs = req.LatencyMs,
            Username = req.Username,
            CorrelationId = req.CorrelationId,
            Message = req.Message,
            Timestamp = DateTime.UtcNow
        };

        _db.AuditLogs.Add(log);
        await _db.SaveChangesAsync();

        _logger.LogInformation(
            "[{Service}] {Method} {Endpoint} → {Status} ({Latency}ms) | Trace: {CorrelationId}",
            req.ServiceName, req.Method, req.Endpoint,
            req.StatusCode, req.LatencyMs, req.CorrelationId);
    }

    // Get all logs for one correlation ID
    // This shows the full journey of ONE request across ALL services
    public async Task<List<AuditLog>> GetByCorrelationIdAsync(string correlationId)
    {
        return await _db.AuditLogs
            .Where(a => a.CorrelationId == correlationId)
            .OrderBy(a => a.Timestamp)
            .ToListAsync();
    }

    // Get recent logs — latest 100
    public async Task<List<AuditLog>> GetRecentLogsAsync(int count = 100)
    {
        return await _db.AuditLogs
            .OrderByDescending(a => a.Timestamp)
            .Take(count)
            .ToListAsync();
    }

    // Get monitoring summary — counts and average latency per service
    public async Task<object> GetMonitoringSummaryAsync()
    {
        var logs = await _db.AuditLogs
            .Where(a => a.Timestamp >= DateTime.UtcNow.AddHours(-24))
            .ToListAsync();

        var summary = logs
            .GroupBy(a => a.ServiceName)
            .Select(g => new
            {
                service = g.Key,
                totalRequests = g.Count(),
                successCount = g.Count(a => a.StatusCode >= 200 && a.StatusCode < 300),
                errorCount = g.Count(a => a.StatusCode >= 400),
                avgLatencyMs = g.Any() ? Math.Round(g.Average(a => a.LatencyMs), 2) : 0,
                maxLatencyMs = g.Any() ? g.Max(a => a.LatencyMs) : 0
            })
            .ToList();

        return new
        {
            period = "Last 24 hours",
            generatedAt = DateTime.UtcNow,
            totalRequests = logs.Count,
            services = summary
        };
    }

    // Get all error logs (status >= 400)
    public async Task<List<AuditLog>> GetErrorLogsAsync()
    {
        return await _db.AuditLogs
            .Where(a => a.StatusCode >= 400)
            .OrderByDescending(a => a.Timestamp)
            .Take(50)
            .ToListAsync();
    }
}