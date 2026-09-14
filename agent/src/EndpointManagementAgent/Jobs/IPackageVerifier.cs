namespace EndpointManagementAgent.Jobs;

public interface IPackageVerifier
{
    Task<bool> VerifyPackageIntegrityAsync(string filePath, string expectedSha256, CancellationToken cancellationToken = default);
}
