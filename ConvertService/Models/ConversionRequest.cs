namespace ConvertService.Models;

// What the client sends when requesting a conversion
public class ConversionRequest
{
    public string From { get; set; } = string.Empty;
    public decimal Amount { get; set; }

    // Single target currency: "PKR"
    public string To { get; set; } = string.Empty;
}

// For converting to MULTIPLE currencies at once (parallel)
public class MultiConversionRequest
{
    public string From { get; set; } = string.Empty;
    public decimal Amount { get; set; }

    // Multiple targets: ["PKR", "EUR", "GBP", "JPY"]
    public List<string> ToCurrencies { get; set; } = new();
}

public class FavoritePairRequest
{
    public string From { get; set; } = string.Empty;
    public string To { get; set; } = string.Empty;
}

// What we send back for each conversion result
public class ConversionResult
{
    public string From { get; set; } = string.Empty;
    public string To { get; set; } = string.Empty;
    public decimal OriginalAmount { get; set; }
    public decimal ConvertedAmount { get; set; }
    public decimal Rate { get; set; }
    public DateTime ConvertedAt { get; set; }
    public string? Error { get; set; }
}