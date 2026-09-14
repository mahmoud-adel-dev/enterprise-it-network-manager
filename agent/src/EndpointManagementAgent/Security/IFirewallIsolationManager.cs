namespace EndpointManagementAgent.Security;

public interface IFirewallIsolationManager
{
    bool IsQuarantined { get; }
    Task ApplyIsolationAsync(CancellationToken cancellationToken = default);
    Task RestoreNetworkAsync(CancellationToken cancellationToken = default);
}
