using EndpointManagementAgent.Domain;

namespace EndpointManagementAgent.Software;

public interface ISoftwareInventoryProvider
{
    Task<IReadOnlyList<SoftwareInventoryItem>> CollectInstalledSoftwareAsync(CancellationToken cancellationToken = default);
}
