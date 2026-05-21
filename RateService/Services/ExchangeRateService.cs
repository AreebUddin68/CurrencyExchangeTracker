using RateService.Models;
using System.Collections.Concurrent;

namespace RateService.Services;

public class ExchangeRateService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _config;
    private readonly ILogger<ExchangeRateService> _logger;

    private static readonly Dictionary<string, (DateTime FetchedAt, RateResult Data)> _cache = new();
    private static readonly TimeSpan CacheDuration = TimeSpan.FromMinutes(5);

    private static readonly ConcurrentDictionary<Guid, RateAlert> _alerts = new();
    private static int _maxAlertsPerUser = 10;

    public ExchangeRateService(HttpClient httpClient, IConfiguration config,
        ILogger<ExchangeRateService> logger)
    {
        _httpClient = httpClient;
        _config = config;
        _logger = logger;
    }

    public async Task<RateResult> GetRatesAsync(string baseCurrency)
    {
        baseCurrency = baseCurrency.ToUpper();

        if (_cache.TryGetValue(baseCurrency, out var cached) &&
            DateTime.UtcNow - cached.FetchedAt < CacheDuration)
        {
            _logger.LogInformation("Cache hit for {Currency}", baseCurrency);
            cached.Data.FromCache = true;
            return cached.Data;
        }

        var apiKey = _config["ExchangeRateApi:Key"];
        var url = $"https://v6.exchangerate-api.com/v6/{apiKey}/latest/{baseCurrency}";

        _logger.LogInformation("Fetching live rates for {Currency} from API", baseCurrency);

        var response = await _httpClient.GetFromJsonAsync<ExchangeRateResponse>(url);

        if (response == null || response.Result != "success")
            throw new Exception($"Failed to fetch rates for {baseCurrency}");

        var result = new RateResult
        {
            BaseCurrency = baseCurrency,
            Rates = response.ConversionRates,
            FetchedAt = DateTime.UtcNow,
            FromCache = false
        };

        _cache[baseCurrency] = (DateTime.UtcNow, result);

        return result;
    }

    public async Task<MultiRateResult> GetMultipleRatesAsync(List<string> baseCurrencies)
    {
        _logger.LogInformation(
            "Starting PARALLEL fetch for {Count} currencies: {Currencies}",
            baseCurrencies.Count,
            string.Join(", ", baseCurrencies));

        var tasks = baseCurrencies
            .Distinct()
            .Select(currency => GetRatesAsync(currency))
            .ToList();

        var results = await Task.WhenAll(tasks);

        _logger.LogInformation("Parallel fetch completed for {Count} currencies", results.Length);

        return new MultiRateResult
        {
            Results = results.ToList(),
            TotalCurrenciesFetched = results.Length,
            FetchMode = "parallel — Task.WhenAll"
        };
    }

    public async Task<object> ConvertAsync(string from, string to, decimal amount)
    {
        var rateData = await GetRatesAsync(from);

        if (!rateData.Rates.TryGetValue(to.ToUpper(), out var rate))
            throw new Exception($"Currency {to} not found.");

        var converted = Math.Round(amount * rate, 4);

        return new
        {
            from = from.ToUpper(),
            to = to.ToUpper(),
            amount,
            convertedAmount = converted,
            rate,
            fetchedAt = rateData.FetchedAt
        };
    }

    public async Task<(bool success, string message, RateAlert? alert)> CreateAlertAsync(
        int userId, string username, CreateRateAlertRequest req)
    {
        var userAlertCount = _alerts.Values.Count(a => a.UserId == userId && !a.IsTriggered);
        if (userAlertCount >= _maxAlertsPerUser)
            return (false, $"Maximum {_maxAlertsPerUser} active alerts allowed per user.", null);

        var from = req.FromCurrency.ToUpper();
        var to = req.ToCurrency.ToUpper();

        var rates = await GetRatesAsync(from);
        if (!rates.Rates.ContainsKey(to))
            return (false, $"Currency pair {from}/{to} not found.", null);

        var alert = new RateAlert
        {
            UserId = userId,
            Username = username,
            FromCurrency = from,
            ToCurrency = to,
            TargetRate = req.TargetRate,
            Direction = req.Direction.Equals("Below", StringComparison.OrdinalIgnoreCase) ? "Below" : "Above"
        };

        _alerts[alert.Id] = alert;
        return (true, "Alert created.", alert);
    }

    public List<RateAlert> GetAlertsForUser(int userId)
    {
        return _alerts.Values
            .Where(a => a.UserId == userId)
            .OrderByDescending(a => a.CreatedAt)
            .ToList();
    }

    public bool DeleteAlert(int userId, Guid alertId)
    {
        if (_alerts.TryGetValue(alertId, out var alert) && alert.UserId == userId)
            return _alerts.TryRemove(alertId, out _);

        return false;
    }

    public int UpdateAlertThreshold(int maxAlertsPerUser)
    {
        _maxAlertsPerUser = Math.Max(1, maxAlertsPerUser);
        return _maxAlertsPerUser;
    }

    public int GetAlertThreshold() => _maxAlertsPerUser;

    public async Task<List<object>> CheckAlertsAsync(int userId)
    {
        var userAlerts = _alerts.Values
            .Where(a => a.UserId == userId && !a.IsTriggered)
            .ToList();

        var checks = userAlerts.Select(async alert =>
        {
            var rateData = await GetRatesAsync(alert.FromCurrency);
            if (!rateData.Rates.TryGetValue(alert.ToCurrency, out var currentRate))
                return null;

            var triggered = alert.Direction == "Above"
                ? currentRate >= alert.TargetRate
                : currentRate <= alert.TargetRate;

            if (!triggered)
                return null;

            alert.IsTriggered = true;
            alert.TriggeredAt = DateTime.UtcNow;

            return new
            {
                alertId = alert.Id,
                alert.FromCurrency,
                alert.ToCurrency,
                alert.TargetRate,
                alert.Direction,
                currentRate,
                alert.TriggeredAt,
                message = $"Alert triggered for {alert.FromCurrency}/{alert.ToCurrency} at {currentRate}."
            } as object;
        }).ToList();

        var results = await Task.WhenAll(checks);
        return results.Where(r => r != null).ToList()!;
    }
}
