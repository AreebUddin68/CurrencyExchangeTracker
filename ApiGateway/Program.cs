using ApiGateway.Middleware;
using Shared.Middleware;
using Serilog;

// ── Serilog setup ──────────────────────────────────────────
Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateLogger();

var builder = WebApplication.CreateBuilder(args);
builder.Host.UseSerilog();

// ── Services ───────────────────────────────────────────────

// YARP Reverse Proxy — reads routes from appsettings.json
builder.Services.AddReverseProxy()
    .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"));

// HttpClient for sending logs to AuditService
builder.Services.AddHttpClient();

// Health check for gateway itself
builder.Services.AddHealthChecks();

// For fronetnd-end CORS requests
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("http://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

app.UseCors();

// ── Middleware pipeline ────────────────────────────────────

// 1. Inject Correlation ID on EVERY request entering the system
app.UseMiddleware<CorrelationIdMiddleware>();

// 2. Log every request + send to AuditService
app.UseMiddleware<GatewayLoggingMiddleware>();

// 3. Route the request to the correct microservice
app.MapReverseProxy();

// 4. Health check endpoint
app.MapHealthChecks("/health");

app.Run();