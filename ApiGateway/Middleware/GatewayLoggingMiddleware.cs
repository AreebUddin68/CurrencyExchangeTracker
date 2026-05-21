using System.Diagnostics;

namespace ApiGateway.Middleware;

public class GatewayLoggingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GatewayLoggingMiddleware> _logger;
    private readonly HttpClient _httpClient;

    public GatewayLoggingMiddleware(RequestDelegate next,
        ILogger<GatewayLoggingMiddleware> logger,
        IHttpClientFactory httpClientFactory)
    {
        _next = next;
        _logger = logger;
        _httpClient = httpClientFactory.CreateClient();
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Get or create correlation ID for this request
        var correlationId = context.Request.Headers["X-Correlation-ID"]
                                .FirstOrDefault()
                            ?? Guid.NewGuid().ToString();

        // Attach it to request and response
        context.Request.Headers["X-Correlation-ID"] = correlationId;
        context.Response.Headers["X-Correlation-ID"] = correlationId;
        context.Items["CorrelationId"] = correlationId;

        // Start timing the request
        var stopwatch = Stopwatch.StartNew();

        _logger.LogInformation(
            "→ GATEWAY [{Method}] {Path} | CorrelationId: {CorrelationId}",
            context.Request.Method,
            context.Request.Path,
            correlationId);

        await _next(context);

        stopwatch.Stop();

        _logger.LogInformation(
            "← GATEWAY [{Method}] {Path} → {StatusCode} ({Elapsed}ms) | CorrelationId: {CorrelationId}",
            context.Request.Method,
            context.Request.Path,
            context.Response.StatusCode,
            stopwatch.ElapsedMilliseconds,
            correlationId);

        // Send log to AuditService asynchronously
        // Fire and forget — don't slow down the response
        _ = SendAuditLogAsync(
            context.Request.Method,
            context.Request.Path,
            context.Response.StatusCode,
            stopwatch.ElapsedMilliseconds,
            correlationId);
    }

    private async Task SendAuditLogAsync(
        string method, string path,
        int statusCode, long latencyMs,
        string correlationId)
    {
        try
        {
            var log = new
            {
                serviceName = "ApiGateway",
                endpoint = path.ToString(),
                method = method,
                statusCode = statusCode,
                latencyMs = latencyMs,
                correlationId = correlationId,
                message = "Request passed through gateway"
            };

            using var request = new HttpRequestMessage(HttpMethod.Post, "http://localhost:5004/api/audit/log");
            request.Headers.TryAddWithoutValidation("X-Internal-ApiKey", "currency-internal-audit-key");
            request.Content = JsonContent.Create(log);
            await _httpClient.SendAsync(request);
        }
        catch
        {
            // Never crash the gateway if AuditService is down
        }
    }
}