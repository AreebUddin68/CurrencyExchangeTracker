using System.Security.Cryptography;
using System.Text;

namespace Shared.Encryption;

public static class AesEncryptionHelper
{
    // 32 characters = 256-bit AES key
    // In a real app this would come from environment variables
    private const string Key = "CurrencyApp_SecretKey_32Chars!!X";

    public static string Encrypt(string plainText)
    {
        if (string.IsNullOrEmpty(plainText)) return plainText;

        using var aes = Aes.Create();
        aes.Key = Encoding.UTF8.GetBytes(Key);
        aes.GenerateIV(); // Random IV every time for security

        using var encryptor = aes.CreateEncryptor(aes.Key, aes.IV);

        var plainBytes = Encoding.UTF8.GetBytes(plainText);
        var encryptedBytes = encryptor.TransformFinalBlock(plainBytes, 0, plainBytes.Length);

        // Store IV + encrypted data together so we can decrypt later
        var result = new byte[aes.IV.Length + encryptedBytes.Length];
        aes.IV.CopyTo(result, 0);                          // first 16 bytes = IV
        encryptedBytes.CopyTo(result, aes.IV.Length);     // rest = encrypted data

        return Convert.ToBase64String(result);
    }

    public static string Decrypt(string cipherText)
    {
        if (string.IsNullOrEmpty(cipherText)) return cipherText;

        var fullBytes = Convert.FromBase64String(cipherText);

        using var aes = Aes.Create();
        aes.Key = Encoding.UTF8.GetBytes(Key);

        // Extract IV from the first 16 bytes
        var iv = new byte[16];
        var encryptedBytes = new byte[fullBytes.Length - 16];

        Array.Copy(fullBytes, 0, iv, 0, 16);
        Array.Copy(fullBytes, 16, encryptedBytes, 0, encryptedBytes.Length);

        aes.IV = iv;

        using var decryptor = aes.CreateDecryptor(aes.Key, aes.IV);
        var decryptedBytes = decryptor.TransformFinalBlock(encryptedBytes, 0, encryptedBytes.Length);

        return Encoding.UTF8.GetString(decryptedBytes);
    }
}