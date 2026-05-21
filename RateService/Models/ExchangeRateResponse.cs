using System.Text.Json.Serialization;

namespace RateService.Models;

public class ExchangeRateResponse
{
    [JsonPropertyName("result")]
    public string Result { get; set; } = string.Empty;

    [JsonPropertyName("base_code")]
    public string BaseCode { get; set; } = string.Empty;

    [JsonPropertyName("conversion_rates")]
    public Dictionary<string, decimal> ConversionRates { get; set; } = new();
}

public class RateResult
{
    public string BaseCurrency { get; set; } = string.Empty;
    public Dictionary<string, decimal> Rates { get; set; } = new();
    public DateTime FetchedAt { get; set; }
    public bool FromCache { get; set; }
}

public class MultiRateResult
{
    public List<RateResult> Results { get; set; } = new();
    public int TotalCurrenciesFetched { get; set; }
    public string FetchMode { get; set; } = string.Empty;
}

public class CreateRateAlertRequest
{
    public string FromCurrency { get; set; } = string.Empty;
    public string ToCurrency { get; set; } = string.Empty;
    public decimal TargetRate { get; set; }
    public string Direction { get; set; } = "Above";
}

public class UpdateThresholdRequest
{
    public int MaxAlertsPerUser { get; set; }
}

public class RateAlert
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public int UserId { get; set; }
    public string Username { get; set; } = string.Empty;
    public string FromCurrency { get; set; } = string.Empty;
    public string ToCurrency { get; set; } = string.Empty;
    public decimal TargetRate { get; set; }
    public string Direction { get; set; } = "Above";
    public bool IsTriggered { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? TriggeredAt { get; set; }
}

public class AlertSystemSetting
{
    public int Id { get; set; }
    public int MaxAlertsPerUser { get; set; } = 10;
}
