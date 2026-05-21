using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RateService.Models;
using RateService.Services;

namespace RateService.Controllers;

[ApiController]
[Route("api/rates")]
[Authorize] // All endpoints require a valid JWT token
public class RateController : ControllerBase
{
    private readonly ExchangeRateService _rateService;
    private readonly ILogger<RateController> _logger;

    public RateController(ExchangeRateService rateService,
        ILogger<RateController> logger)
    {
        _rateService = rateService;
        _logger = logger;
    }

    // GET /api/rates/USD
    // Returns all exchange rates for one base currency
    [HttpGet("{baseCurrency}")]
    public async Task<IActionResult> GetRates(string baseCurrency)
    {
        try
        {
            var correlationId = HttpContext.Items["CorrelationId"]?.ToString();
            _logger.LogInformation(
                "GetRates called for {Currency} | CorrelationId: {CorrelationId}",
                baseCurrency, correlationId);

            var result = await _rateService.GetRatesAsync(baseCurrency);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching rates for {Currency}", baseCurrency);
            return StatusCode(500, new { message = ex.Message });
        }
    }

    // GET /api/rates/multi?currencies=USD,EUR,GBP,PKR,JPY
    // Fetches all currencies IN PARALLEL — demonstrates concurrency
    [HttpGet("multi")]
    public async Task<IActionResult> GetMultipleRates([FromQuery] string currencies)
    {
        try
        {
            var currencyList = currencies
                .Split(',', StringSplitOptions.RemoveEmptyEntries)
                .Select(c => c.Trim().ToUpper())
                .ToList();

            if (currencyList.Count == 0)
                return BadRequest(new { message = "Provide at least one currency." });

            if (currencyList.Count > 10)
                return BadRequest(new { message = "Maximum 10 currencies at once." });

            var correlationId = HttpContext.Items["CorrelationId"]?.ToString();
            _logger.LogInformation(
                "Parallel fetch for {Count} currencies | CorrelationId: {CorrelationId}",
                currencyList.Count, correlationId);

            var result = await _rateService.GetMultipleRatesAsync(currencyList);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in multi-currency fetch");
            return StatusCode(500, new { message = ex.Message });
        }
    }

    // GET /api/rates/convert?from=USD&to=PKR&amount=100
    // Converts an amount from one currency to another
    [HttpGet("convert")]
    public async Task<IActionResult> Convert(
        [FromQuery] string from,
        [FromQuery] string to,
        [FromQuery] decimal amount)
    {
        try
        {
            var result = await _rateService.ConvertAsync(from, to, amount);
            return Ok(result);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Conversion error {From} to {To}", from, to);
            return StatusCode(500, new { message = ex.Message });
        }
    }

    // GET /api/rates/health-check — Admin only
    [HttpGet("health-check")]
    [Authorize(Roles = "Admin")]
    public IActionResult HealthCheck()
    {
        return Ok(new
        {
            status = "RateService is running",
            time = DateTime.UtcNow,
            cacheInfo = "Rates cached for 5 minutes"
        });
    }

    // POST /api/rates/alerts
    [HttpPost("alerts")]
    [Authorize(Roles = "PremiumUser,Admin")]
    public async Task<IActionResult> CreateAlert([FromBody] CreateRateAlertRequest req)
    {
        var userId = int.Parse(User.FindFirst("userId")!.Value);
        var username = User.Identity?.Name ?? "unknown";

        var result = await _rateService.CreateAlertAsync(userId, username, req);
        if (!result.success)
            return BadRequest(new { message = result.message });

        return Ok(new { message = result.message, alert = result.alert });
    }

    // GET /api/rates/alerts
    [HttpGet("alerts")]
    [Authorize(Roles = "PremiumUser,Admin")]
    public IActionResult GetMyAlerts()
    {
        var userId = int.Parse(User.FindFirst("userId")!.Value);
        var alerts = _rateService.GetAlertsForUser(userId);
        return Ok(alerts);
    }

    // DELETE /api/rates/alerts/{alertId}
    [HttpDelete("alerts/{alertId}")]
    [Authorize(Roles = "PremiumUser,Admin")]
    public IActionResult DeleteAlert(Guid alertId)
    {
        var userId = int.Parse(User.FindFirst("userId")!.Value);
        var removed = _rateService.DeleteAlert(userId, alertId);
        if (!removed)
            return NotFound(new { message = "Alert not found." });

        return Ok(new { message = "Alert removed." });
    }

    // POST /api/rates/alerts/check
    [HttpPost("alerts/check")]
    [Authorize(Roles = "PremiumUser,Admin")]
    public async Task<IActionResult> CheckMyAlerts()
    {
        var userId = int.Parse(User.FindFirst("userId")!.Value);
        var triggered = await _rateService.CheckAlertsAsync(userId);
        return Ok(new
        {
            totalTriggered = triggered.Count,
            alerts = triggered
        });
    }

    // PUT /api/rates/alerts/threshold
    [HttpPut("alerts/threshold")]
    [Authorize(Roles = "Admin")]
    public IActionResult UpdateAlertThreshold([FromBody] UpdateThresholdRequest req)
    {
        var applied = _rateService.UpdateAlertThreshold(req.MaxAlertsPerUser);
        return Ok(new
        {
            message = "Alert threshold updated.",
            maxAlertsPerUser = applied
        });
    }

    // GET /api/rates/alerts/threshold
    [HttpGet("alerts/threshold")]
    [Authorize(Roles = "Admin")]
    public IActionResult GetAlertThreshold()
    {
        return Ok(new
        {
            maxAlertsPerUser = _rateService.GetAlertThreshold()
        });
    }
}
