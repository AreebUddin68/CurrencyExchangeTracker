namespace AuditService.Models;

public class AuditLog
{
    public int Id { get; set; }

    // Which service sent this log (AuthService, RateService, etc.)
    public string ServiceName { get; set; } = string.Empty;

    // The API endpoint that was called
    public string Endpoint { get; set; } = string.Empty;

    // HTTP method: GET, POST, etc.
    public string Method { get; set; } = string.Empty;

    // Response status: 200, 401, 500, etc.
    public int StatusCode { get; set; }

    // How long the request took in milliseconds
    public long LatencyMs { get; set; }

    // The user who made the request (if logged in)
    public string? Username { get; set; }

    // Correlation ID — this is what links logs across ALL services
    // One request to ApiGateway creates ONE correlation ID
    // That same ID appears in AuthService, RateService, ConvertService logs
    public string CorrelationId { get; set; } = string.Empty;

    // Any extra info (error messages, notes)
    public string? Message { get; set; }

    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

// What other services POST to AuditService
public class CreateAuditLogRequest
{
    public string ServiceName { get; set; } = string.Empty;
    public string Endpoint { get; set; } = string.Empty;
    public string Method { get; set; } = string.Empty;
    public int StatusCode { get; set; }
    public long LatencyMs { get; set; }
    public string? Username { get; set; }
    public string CorrelationId { get; set; } = string.Empty;
    public string? Message { get; set; }
}