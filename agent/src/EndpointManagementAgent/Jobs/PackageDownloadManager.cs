using System.Security.Cryptography;
using EndpointManagementAgent.Api;
using EndpointManagementAgent.Configuration;
using EndpointManagementAgent.Domain;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace EndpointManagementAgent.Jobs;

public sealed class PackageDownloadManager(
    IHttpClientFactory httpClientFactory,
    IOptions<AgentOptions> options,
    ILogger<PackageDownloadManager> logger) : IPackageDownloadManager
{
    private const int BufferSize = 64 * 1024; // 64 KB streaming buffer

    public async Task<PackageDownloadResult> DownloadPackageAsync(
        Guid packageId,
        string fileName,
        string expectedSha256,
        long expectedSize,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(fileName);
        ArgumentException.ThrowIfNullOrWhiteSpace(expectedSha256);

        var cacheDir = options.Value.GetPackageCacheDirectory();
        if (!Directory.Exists(cacheDir))
        {
            Directory.CreateDirectory(cacheDir);
        }

        // Verify available disk space
        CheckDiskSpace(cacheDir, expectedSize);

        // Sanitize extension safely
        var extension = Path.GetExtension(fileName).ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(extension) || (!extension.Equals(".msi", StringComparison.Ordinal) && !extension.Equals(".exe", StringComparison.Ordinal)))
        {
            extension = ".bin";
        }

        // Safe deterministic filename — completely prevents path traversal
        var safeFileName = $"pkg_{packageId:N}_{DateTimeOffset.UtcNow.ToUnixTimeSeconds()}{extension}";
        var destinationPath = Path.Combine(cacheDir, safeFileName);

        // Guard against path traversal
        var normalizedDest = Path.GetFullPath(destinationPath);
        var normalizedCache = Path.GetFullPath(cacheDir);
        if (!normalizedDest.StartsWith(normalizedCache + Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("Package destination path resolution violated directory boundary.");
        }

        logger.LogInformation("Starting streamed download for package {PackageId} ({FileName}, ExpectedSize: {Size} bytes)...",
            packageId, fileName, expectedSize);

        var client = httpClientFactory.CreateClient(AgentApiClient.HttpClientName);
        using var request = new HttpRequestMessage(HttpMethod.Get, $"api/v1/agent/packages/{packageId:D}");

        try
        {
            using var response = await client.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, cancellationToken).ConfigureAwait(false);
            if (!response.IsSuccessStatusCode)
            {
                throw await AgentApiClient.CreateExceptionAsync(response, cancellationToken).ConfigureAwait(false);
            }

            using var incrementalHash = IncrementalHash.CreateHash(HashAlgorithmName.SHA256);
            await using (var networkStream = await response.Content.ReadAsStreamAsync(cancellationToken).ConfigureAwait(false))
            await using (var fileStream = new FileStream(destinationPath, FileMode.Create, FileAccess.Write, FileShare.None, BufferSize, useAsync: true))
            {
                var buffer = new byte[BufferSize];
                long totalBytes = 0;
                int bytesRead;
                int lastReportedPercent = -1;

                while ((bytesRead = await networkStream.ReadAsync(buffer, 0, buffer.Length, cancellationToken).ConfigureAwait(false)) > 0)
                {
                    await fileStream.WriteAsync(buffer.AsMemory(0, bytesRead), cancellationToken).ConfigureAwait(false);
                    incrementalHash.AppendData(buffer, 0, bytesRead);
                    totalBytes += bytesRead;

                    if (totalBytes > options.Value.MaxPackageBytes)
                    {
                        throw new InvalidOperationException($"Package exceeded maximum configured size ({options.Value.MaxPackageBytes} bytes).");
                    }

                    // Report download progress every 10%
                    if (expectedSize > 0)
                    {
                        var currentPercent = (int)(totalBytes * 100 / expectedSize);
                        var reportPercent = currentPercent / 10 * 10; // Round down to nearest 10
                        if (reportPercent > lastReportedPercent && reportPercent <= 100)
                        {
                            lastReportedPercent = reportPercent;
                            logger.LogInformation("Package {PackageId} download progress: {Percent}% ({Downloaded}/{Total} bytes)",
                                packageId, reportPercent, totalBytes, expectedSize);
                        }
                    }
                }

                await fileStream.FlushAsync(cancellationToken).ConfigureAwait(false);

                var computedHash = Convert.ToHexString(incrementalHash.GetHashAndReset()).ToLowerInvariant();
                logger.LogInformation("Downloaded package {PackageId}: {Bytes} bytes written. Computed SHA256: {Sha256}",
                    packageId, totalBytes, computedHash);

                return new PackageDownloadResult(destinationPath, totalBytes, computedHash);
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Download failed for package {PackageId}. Cleaning up partial file.", packageId);
            CleanupPackage(destinationPath);
            throw;
        }
    }

    public void CleanupPackage(string filePath)
    {
        if (string.IsNullOrWhiteSpace(filePath)) return;

        try
        {
            if (File.Exists(filePath))
            {
                File.Delete(filePath);
                logger.LogInformation("Cleaned up package file: {Path}", filePath);
            }
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to delete package file: {Path}", filePath);
        }
    }

    private void CheckDiskSpace(string directoryPath, long requiredBytes)
    {
        try
        {
            var driveInfo = new DriveInfo(Path.GetPathRoot(directoryPath) ?? "C:\\");
            if (driveInfo.IsReady)
            {
                // Safety buffer: required bytes + 256 MB
                var requiredWithBuffer = requiredBytes + (256L * 1024 * 1024);
                if (driveInfo.AvailableFreeSpace < requiredWithBuffer)
                {
                    throw new InvalidOperationException(
                        $"Insufficient free disk space on drive {driveInfo.Name}. Free: {driveInfo.AvailableFreeSpace} bytes, Required: {requiredWithBuffer} bytes.");
                }
            }
        }
        catch (Exception ex) when (ex is not InvalidOperationException)
        {
            logger.LogWarning(ex, "Could not verify drive free space for {Path}. Proceeding with download.", directoryPath);
        }
    }
}
