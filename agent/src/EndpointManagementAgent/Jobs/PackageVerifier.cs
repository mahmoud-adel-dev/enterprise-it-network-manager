using System.Security.Cryptography;
using Microsoft.Extensions.Logging;

namespace EndpointManagementAgent.Jobs;

public sealed class PackageVerifier(ILogger<PackageVerifier> logger) : IPackageVerifier
{
    public async Task<bool> VerifyPackageIntegrityAsync(string filePath, string expectedSha256, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(filePath);
        ArgumentException.ThrowIfNullOrWhiteSpace(expectedSha256);

        if (!File.Exists(filePath))
        {
            logger.LogError("Verification target file does not exist: {Path}", filePath);
            return false;
        }

        byte[] expectedBytes;
        try
        {
            expectedBytes = Convert.FromHexString(expectedSha256.Trim());
        }
        catch (FormatException)
        {
            logger.LogError("Expected checksum is not a valid hexadecimal string: {Expected}", expectedSha256);
            DeleteCorruptedFile(filePath);
            return false;
        }

        try
        {
            await using var stream = new FileStream(filePath, FileMode.Open, FileAccess.Read, FileShare.Read, 64 * 1024, useAsync: true);
            var computedBytes = await SHA256.HashDataAsync(stream, cancellationToken).ConfigureAwait(false);

            if (!CryptographicOperations.FixedTimeEquals(computedBytes, expectedBytes))
            {
                var computedHex = Convert.ToHexString(computedBytes).ToLowerInvariant();
                logger.LogError("SHA-256 package verification FAILED for {Path}. Expected: {Expected}, Computed: {Computed}. Deleting corrupt file.",
                    filePath, expectedSha256, computedHex);

                DeleteCorruptedFile(filePath);
                return false;
            }

            logger.LogInformation("SHA-256 package verification SUCCEEDED for {Path}.", filePath);
            return true;
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogError(ex, "Error occurred during package integrity verification for {Path}.", filePath);
            DeleteCorruptedFile(filePath);
            return false;
        }
    }

    private void DeleteCorruptedFile(string filePath)
    {
        try
        {
            if (File.Exists(filePath))
            {
                File.Delete(filePath);
                logger.LogWarning("Corrupt/unverified file deleted: {Path}", filePath);
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to delete unverified file {Path}", filePath);
        }
    }
}
