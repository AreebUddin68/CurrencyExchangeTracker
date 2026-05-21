using ConvertService.Data;
using ConvertService.Models;
using Shared.Encryption;

namespace ConvertService.Services;

public class ConversionService
{
    private readonly ConvertDbContext _db;
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _config;
    private readonly ILogger<ConversionService> _logger;

    public ConversionService(ConvertDbContext db, HttpClient httpClient,
        IConfiguration config, ILogger<ConversionService> logger)
    {
        _db = db;
        _httpClient = httpClient;
        _config = config;
        _logger = logger;
    }

    // ── Single conversion ──────────────────────────────────
    public async Task<ConversionResult> ConvertAsync(
        ConversionRequest req, int userId, string username,
        string correlationId, string accessToken)
    {
        var rates = await FetchRatesFromRateServiceAsync(req.From, accessToken, correlationId);

        if (!rates.TryGetValue(req.To.ToUpper(), out var rate))
            throw new Exception($"Currency '{req.To}' not found.");

        var convertedAmount = Math.Round(req.Amount * rate, 4);

        await SaveToHistoryAsync(
            userId, username,
            req.From, req.To,
            req.Amount, convertedAmount, rate,
            correlationId);

        return new ConversionResult
        {
            From = req.From.ToUpper(),
            To = req.To.ToUpper(),
            OriginalAmount = req.Amount,
            ConvertedAmount = convertedAmount,
            Rate = rate,
            ConvertedAt = DateTime.UtcNow
        };
    }

    // ── Multiple conversions in PARALLEL ──────────────────
    public async Task<List<ConversionResult>> ConvertMultipleAsync(
        MultiConversionRequest req, int userId, string username,
        string correlationId, string accessToken)
    {
        var rates = await FetchRatesFromRateServiceAsync(req.From, accessToken, correlationId);

        _logger.LogInformation(
            "Starting parallel conversion of {Amount} {From} to {Count} currencies",
            req.Amount, req.From, req.ToCurrencies.Count);

        var conversionTasks = req.ToCurrencies
            .Distinct()
            .Select(toCurrency => Task.Run(() =>
            {
                var target = toCurrency.ToUpper();

                if (!rates.TryGetValue(target, out var rate))
                {
                    return new ConversionResult
                    {
                        From = req.From.ToUpper(),
                        To = target,
                        OriginalAmount = req.Amount,
                        Error = $"Currency '{target}' not found"
                    };
                }

                var convertedAmount = Math.Round(req.Amount * rate, 4);

                return new ConversionResult
                {
                    From = req.From.ToUpper(),
                    To = target,
                    OriginalAmount = req.Amount,
                    ConvertedAmount = convertedAmount,
                    Rate = rate,
                    ConvertedAt = DateTime.UtcNow
                };
            }))
            .ToList();

        var results = (await Task.WhenAll(conversionTasks)).ToList();

        foreach (var result in results.Where(r => string.IsNullOrWhiteSpace(r.Error)))
        {
            await SaveToHistoryAsync(
                userId, username,
                result.From, result.To,
                result.OriginalAmount, result.ConvertedAmount,
                result.Rate, correlationId);
        }

        _logger.LogInformation(
            "Parallel conversion complete. {Count} results | CorrelationId: {Id}",
            results.Count, correlationId);

        return results;
    }

    // ── Fetch rates from RateService (microservice call) ──
    private async Task<Dictionary<string, decimal>> FetchRatesFromRateServiceAsync(
        string baseCurrency, string accessToken, string correlationId)
    {
        var rateServiceBaseUrl = _config["Services:RateServiceBaseUrl"] ?? "http://localhost:5002";
        var url = $"{rateServiceBaseUrl.TrimEnd('/')}/api/rates/{baseCurrency.ToUpper()}";

        using var request = new HttpRequestMessage(HttpMethod.Get, url);

        if (!string.IsNullOrWhiteSpace(accessToken))
            request.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", accessToken);

        if (!string.IsNullOrWhiteSpace(correlationId))
            request.Headers.TryAddWithoutValidation("X-Correlation-ID", correlationId);

        _logger.LogInformation("Calling RateService at {Url}", url);

        using var response = await _httpClient.SendAsync(request);

        if (response.StatusCode == System.Net.HttpStatusCode.Unauthorized ||
            response.StatusCode == System.Net.HttpStatusCode.Forbidden)
            throw new InvalidOperationException("RateService rejected the request. Ensure JWT token is forwarded from ConvertService.");

        if (!response.IsSuccessStatusCode)
            throw new HttpRequestException($"RateService returned {(int)response.StatusCode} ({response.ReasonPhrase}).");

        var payload = await response.Content.ReadFromJsonAsync<RateServiceResponse>();

        if (payload?.Rates == null)
            throw new Exception("Could not fetch rates from RateService.");

        return payload.Rates;
    }

    // ── Save one record to DB with encrypted amounts ───────
    private async Task SaveToHistoryAsync(
        int userId, string username,
        string from, string to,
        decimal originalAmount, decimal convertedAmount,
        decimal rate, string correlationId)
    {
        var record = new ConversionHistory
        {
            UserId = userId,
            Username = username,
            FromCurrency = from.ToUpper(),
            ToCurrency = to.ToUpper(),
            OriginalAmount = originalAmount,
            EncryptedConvertedAmount = AesEncryptionHelper.Encrypt(convertedAmount.ToString()),
            EncryptedRate = AesEncryptionHelper.Encrypt(rate.ToString()),
            ConvertedAt = DateTime.UtcNow,
            CorrelationId = correlationId
        };

        _db.ConversionHistories.Add(record);
        await _db.SaveChangesAsync();
    }
}

public class RateServiceResponse
{
    public string BaseCurrency { get; set; } = string.Empty;
    public Dictionary<string, decimal> Rates { get; set; } = new();
}
