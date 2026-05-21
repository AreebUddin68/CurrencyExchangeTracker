using AuditService.Models;
using AuditService.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AuditService.Controllers;

[ApiController]
[Route("api/audit")]
public class AuditController : ControllerBase
{
    private readonly AuditLogService _auditService;
    private readonly ILogger<AuditController> _logger;

    public AuditController(AuditLogService auditService,
        ILogger<AuditController> logger)
    {
        _auditService = auditService;
        _logger = logger;
    }

    // POST /api/audit/log
    // Internal service communication secured with API key
    [HttpPost("log")]
    public async Task<IActionResult> Log([FromBody] CreateAuditLogRequest req)
    {
        try
        {
            var internalApiKey = HttpContext.Request.Headers["X-Internal-ApiKey"].FirstOrDefault();
            var expectedKey = HttpContext.RequestServices.GetRequiredService<IConfiguration>()["InternalSecurity:AuditIngestionApiKey"];

            if (string.IsNullOrWhiteSpace(expectedKey) || !string.Equals(internalApiKey, expectedKey, StringComparison.Ordinal))
                return Unauthorized(new { message = "Invalid internal API key." });

            await _auditService.SaveLogAsync(req);
            return Ok(new { message = "Log saved." });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to save audit log");
            return StatusCode(500, new { message = ex.Message });
        }
    }

    // GET /api/audit/logs
    // Admin views recent logs from ALL services
    [HttpGet("logs")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetRecentLogs([FromQuery] int count = 100)
    {
        var logs = await _auditService.GetRecentLogsAsync(count);
        return Ok(logs);
    }

    // GET /api/audit/trace/{correlationId}
    // Trace ONE request across ALL services by its correlation ID
    // This is the distributed tracing feature
    [HttpGet("trace/{correlationId}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetTrace(string correlationId)
    {
        var logs = await _auditService.GetByCorrelationIdAsync(correlationId);

        if (!logs.Any())
            return NotFound(new { message = "No logs found for this correlation ID." });

        return Ok(new
        {
            correlationId,
            totalSteps = logs.Count,
            // Shows exactly which services handled this request
            journey = logs.Select(l => new
            {
                step = logs.IndexOf(l) + 1,
                service = l.ServiceName,
                endpoint = l.Endpoint,
                status = l.StatusCode,
                latencyMs = l.LatencyMs,
                time = l.Timestamp
            }),
            totalLatencyMs = logs.Sum(l => l.LatencyMs)
        });
    }

    // GET /api/audit/monitor
    // Real-time monitoring dashboard data
    [HttpGet("monitor")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetMonitoringSummary()
    {
        var summary = await _auditService.GetMonitoringSummaryAsync();
        return Ok(summary);
    }

    // GET /api/audit/errors
    // View all error logs across all services
    [HttpGet("errors")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetErrors()
    {
        var errors = await _auditService.GetErrorLogsAsync();
        return Ok(errors);
    }
}