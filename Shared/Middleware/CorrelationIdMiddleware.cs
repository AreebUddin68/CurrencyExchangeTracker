using Microsoft.AspNetCore.Http;

namespace Shared.Middleware;

public class CorrelationIdMiddleware
{
    private readonly RequestDelegate _next;

    public CorrelationIdMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Check if request already has a Correlation ID (from gateway)
        // If not, generate a new unique one
        var correlationId = context.Request.Headers["X-Correlation-ID"].FirstOrDefault()
                            ?? Guid.NewGuid().ToString();

        // Store it so controllers can access it
        context.Items["CorrelationId"] = correlationId;

        // Add it to the response so client can track it
        context.Response.Headers["X-Correlation-ID"] = correlationId;

        // Continue to the next middleware / controller
        await _next(context);
    }
}