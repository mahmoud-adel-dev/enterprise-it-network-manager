using EndpointManagementAgent.Domain;

namespace EndpointManagementAgent.Security;

public interface ICredentialStore
{
    Task<AgentCredential?> LoadAsync(CancellationToken cancellationToken = default);
    Task SaveAsync(AgentCredential credential, CancellationToken cancellationToken = default);
    Task ClearAsync(CancellationToken cancellationToken = default);
    bool Exists();
}
