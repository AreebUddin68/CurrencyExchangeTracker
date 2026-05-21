using ConvertService.Models;
using ConvertService.Services;
using ConvertService.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Shared.Encryption;
using System.Text;

namespace ConvertService.Controllers;

[ApiController]
[Route("api/convert")]
[Authorize]
public class ConvertController : ControllerBase
{
    private readonly ConversionService _conversionService;
    private readonly ConvertDbContext _db;
    private readonly ILogger<ConvertController> _logger;

    public ConvertController(ConversionService conversionService,
        ConvertDbContext db, ILogger<ConvertController> logger)
    {
        _conversionService = conversionService;
        _db = db;
        _logger = logger;
    }

    // POST /api/convert/single
    // Convert one currency to another
    [HttpPost("single")]
    public async Task<IActionResult> ConvertSingle([FromBody] ConversionRequest req)
    {
        try
        {
            var userId = int.Parse(User.FindFirst("userId")!.Value);
            var username = User.Identity!.Name!;
            var correlationId = HttpContext.Items["CorrelationId"]?.ToString() ?? "";
            var accessToken = HttpContext.Request.Headers.Authorization
                .ToString()
                .Replace("Bearer ", "", StringComparison.OrdinalIgnoreCase)
                .Trim();

            var result = await _conversionService.ConvertAsync(
                req, userId, username, correlationId, accessToken);

            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogError(ex, "RateService authorization error during single conversion");
            return StatusCode(502, new { message = ex.Message });
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "RateService unavailable during single conversion");
            return StatusCode(503, new { message = "RateService is unavailable. Please try again." });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Single conversion error");
            return StatusCode(500, new { message = ex.Message });
        }
    }

    // POST /api/convert/multi
    // Convert to MULTIPLE currencies simultaneously (parallel)
    [HttpPost("multi")]
    public async Task<IActionResult> ConvertMultiple(
        [FromBody] MultiConversionRequest req)
    {
        try
        {
            if (req.ToCurrencies == null || req.ToCurrencies.Count == 0)
                return BadRequest(new { message = "Provide at least one target currency." });

            var userId = int.Parse(User.FindFirst("userId")!.Value);
            var username = User.Identity!.Name!;
            var correlationId = HttpContext.Items["CorrelationId"]?.ToString() ?? "";
            var accessToken = HttpContext.Request.Headers.Authorization
                .ToString()
                .Replace("Bearer ", "", StringComparison.OrdinalIgnoreCase)
                .Trim();

            var results = await _conversionService.ConvertMultipleAsync(
                req, userId, username, correlationId, accessToken);

            return Ok(new
            {
                from = req.From.ToUpper(),
                originalAmount = req.Amount,
                totalConversions = results.Count,
                results,
                processedWith = "Task.WhenAll — parallel async"
            });
        }
        catch (InvalidOperationException ex)
        {
            _logger.LogError(ex, "RateService authorization error during multi conversion");
            return StatusCode(502, new { message = ex.Message });
        }
        catch (HttpRequestException ex)
        {
            _logger.LogError(ex, "RateService unavailable during multi conversion");
            return StatusCode(503, new { message = "RateService is unavailable. Please try again." });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Multi conversion error");
            return StatusCode(500, new { message = ex.Message });
        }
    }

    // GET /api/convert/history
    // Get YOUR OWN conversion history (decrypted)
    [HttpGet("history")]
    public async Task<IActionResult> GetMyHistory()
    {
        var userId = int.Parse(User.FindFirst("userId")!.Value);

        var records = await _db.ConversionHistories
            .Where(c => c.UserId == userId)
            .OrderByDescending(c => c.ConvertedAt)
            .Take(50)
            .ToListAsync();

        // Decrypt before sending to client
        var decrypted = records.Select(r => new
        {
            r.Id,
            r.FromCurrency,
            r.ToCurrency,
            r.OriginalAmount,
            convertedAmount = AesEncryptionHelper.Decrypt(r.EncryptedConvertedAmount),
            rate = AesEncryptionHelper.Decrypt(r.EncryptedRate),
            r.ConvertedAt,
            r.CorrelationId
        });

        return Ok(decrypted);
    }

    // GET /api/convert/history/all  -- Admin only
    [HttpGet("history/all")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAllHistory()
    {
        var records = await _db.ConversionHistories
            .OrderByDescending(c => c.ConvertedAt)
            .Take(100)
            .ToListAsync();

        var decrypted = records.Select(r => new
        {
            r.Id,
            r.UserId,
            r.Username,
            r.FromCurrency,
            r.ToCurrency,
            r.OriginalAmount,
            convertedAmount = AesEncryptionHelper.Decrypt(r.EncryptedConvertedAmount),
            rate = AesEncryptionHelper.Decrypt(r.EncryptedRate),
            r.IsFavoritePair,
            r.ConvertedAt,
            r.CorrelationId
        });

        return Ok(decrypted);
    }

    // POST /api/convert/favorites  -- User, PremiumUser, Admin
    [HttpPost("favorites")]
    [Authorize(Roles = "User,PremiumUser,Admin")]
    public async Task<IActionResult> SaveFavoritePair([FromBody] FavoritePairRequest req)
    {
        var userId = int.Parse(User.FindFirst("userId")!.Value);
        var username = User.Identity!.Name!;

        var from = req.From.ToUpper();
        var to = req.To.ToUpper();

        var existing = await _db.ConversionHistories
            .Where(c => c.UserId == userId && c.FromCurrency == from && c.ToCurrency == to && c.IsFavoritePair)
            .OrderByDescending(c => c.ConvertedAt)
            .FirstOrDefaultAsync();

        if (existing != null)
            return Ok(new { message = "Favorite pair already exists." });

        var favorite = new ConversionHistory
        {
            UserId = userId,
            Username = username,
            FromCurrency = from,
            ToCurrency = to,
            OriginalAmount = 0,
            EncryptedConvertedAmount = AesEncryptionHelper.Encrypt("0"),
            EncryptedRate = AesEncryptionHelper.Encrypt("0"),
            IsFavoritePair = true,
            CorrelationId = HttpContext.Items["CorrelationId"]?.ToString() ?? string.Empty,
            ConvertedAt = DateTime.UtcNow
        };

        _db.ConversionHistories.Add(favorite);
        await _db.SaveChangesAsync();

        return Ok(new { message = "Favorite pair saved." });
    }

    // GET /api/convert/favorites  -- User, PremiumUser, Admin
    [HttpGet("favorites")]
    [Authorize(Roles = "User,PremiumUser,Admin")]
    public async Task<IActionResult> GetFavoritePairs()
    {
        var userId = int.Parse(User.FindFirst("userId")!.Value);

        var favorites = await _db.ConversionHistories
            .Where(c => c.UserId == userId && c.IsFavoritePair)
            .OrderByDescending(c => c.ConvertedAt)
            .Select(c => new
            {
                c.FromCurrency,
                c.ToCurrency,
                c.ConvertedAt
            })
            .Distinct()
            .ToListAsync();

        return Ok(favorites);
    }

    // GET /api/convert/history/export  -- PremiumUser, Admin
    [HttpGet("history/export")]
    [Authorize(Roles = "PremiumUser,Admin")]
    public async Task<IActionResult> ExportMyHistoryCsv()
    {
        var userId = int.Parse(User.FindFirst("userId")!.Value);

        var records = await _db.ConversionHistories
            .Where(c => c.UserId == userId && !c.IsFavoritePair)
            .OrderByDescending(c => c.ConvertedAt)
            .Take(500)
            .ToListAsync();

        var sb = new StringBuilder();
        sb.AppendLine("Id,From,To,OriginalAmount,ConvertedAmount,Rate,ConvertedAt,CorrelationId");

        foreach (var r in records)
        {
            var convertedAmount = AesEncryptionHelper.Decrypt(r.EncryptedConvertedAmount);
            var rate = AesEncryptionHelper.Decrypt(r.EncryptedRate);
            sb.AppendLine($"{r.Id},{r.FromCurrency},{r.ToCurrency},{r.OriginalAmount},{convertedAmount},{rate},{r.ConvertedAt:O},{r.CorrelationId}");
        }

        var bytes = Encoding.UTF8.GetBytes(sb.ToString());
        return File(bytes, "text/csv", $"conversion-history-{DateTime.UtcNow:yyyyMMddHHmmss}.csv");
    }
}
