using System.Net.Security;
using System.Security.Cryptography;
using System.Security.Cryptography.X509Certificates;
using EndpointManagementAgent.Configuration;

namespace EndpointManagementAgent.Security;

public static class TlsPolicy
{
    public static HttpMessageHandler CreatePrimaryHandler(ServerOptions options)
    {
        ArgumentNullException.ThrowIfNull(options);
        var expectedPin = ParsePin(options.PinnedCertificateSha256);
        var handler = new HttpClientHandler
        {
            AutomaticDecompression = System.Net.DecompressionMethods.GZip | System.Net.DecompressionMethods.Deflate,
            CheckCertificateRevocationList = true,
            UseCookies = false,
            AllowAutoRedirect = false,
        };

        if (expectedPin is not null)
        {
            handler.ServerCertificateCustomValidationCallback = (_, certificate, _, sslPolicyErrors) =>
                IsValidPinnedCertificate(certificate, sslPolicyErrors, expectedPin);
        }

        return handler;
    }

    internal static bool IsValidPinnedCertificate(X509Certificate2? certificate, SslPolicyErrors errors, ReadOnlySpan<byte> expectedPin)
    {
        if (certificate is null || errors != SslPolicyErrors.None || expectedPin.Length != SHA256.HashSizeInBytes)
        {
            return false;
        }

        var actual = certificate.GetCertHash(HashAlgorithmName.SHA256);
        return CryptographicOperations.FixedTimeEquals(actual, expectedPin);
    }

    private static byte[]? ParsePin(string? configuredPin)
    {
        if (string.IsNullOrWhiteSpace(configuredPin))
        {
            return null;
        }

        var bytes = Convert.FromHexString(AgentOptionsValidator.NormalizeHex(configuredPin));
        if (bytes.Length != SHA256.HashSizeInBytes)
        {
            throw new InvalidOperationException("The configured TLS certificate pin is not a SHA-256 fingerprint.");
        }

        return bytes;
    }
}
