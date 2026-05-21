namespace ConvertService.Models;

public class ConversionHistory
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string Username { get; set; } = string.Empty;
    public string FromCurrency { get; set; } = string.Empty;
    public string ToCurrency { get; set; } = string.Empty;
    public decimal OriginalAmount { get; set; }
    public string EncryptedConvertedAmount { get; set; } = string.Empty;
    public string EncryptedRate { get; set; } = string.Empty;
    public bool IsFavoritePair { get; set; }
    public DateTime ConvertedAt { get; set; } = DateTime.UtcNow;
    public string CorrelationId { get; set; } = string.Empty;
}
