using EndpointManagementAgent.Domain;

namespace EndpointManagementAgent.Jobs;

public interface IPackageDownloadManager
{
    Task<PackageDownloadResult> DownloadPackageAsync(
        Guid packageId,
        string fileName,
        string expectedSha256,
        long expectedSize,
        CancellationToken cancellationToken);

    void CleanupPackage(string filePath);
}
