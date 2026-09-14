using System.Net.Http.Headers;
using EndpointManagementAgent.Security;
using Microsoft.Extensions.Logging;

namespace EndpointManagementAgent.Api;

public sealed class AgentAuthenticationHandler(
    ICredentialStore credentialStore,
    ILogger<AgentAuthenticationHandler> logger) : DelegatingHandler
{
    private readonly object _lock = new();
    private string? _cachedToken;
    private Guid? _cachedDeviceId;

    public void UpdateCachedToken(string token, Guid deviceId)
    {
        lock (_lock)
        {
            _cachedToken = token;
            _cachedDeviceId = deviceId;
        }
    }

    public void ClearCachedToken()
    {
        lock (_lock)
        {
            _cachedToken = null;
            _cachedDeviceId = null;
        }
    }

    protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        // Enrollment endpoint does not use Bearer token
        if (request.RequestUri?.AbsolutePath.Contains("/agent/enroll", StringComparison.OrdinalIgnoreCase) == true)
        {
            return await base.SendAsync(request, cancellationToken).ConfigureAwait(false);
        }

        string? token;
        lock (_lock)
        {
            token = _cachedToken;
        }

        if (string.IsNullOrEmpty(token))
        {
            var cred = await credentialStore.LoadAsync(cancellationToken).ConfigureAwait(false);
            if (cred != null)
            {
                lock (_lock)
                {
                    _cachedToken = cred.AccessToken;
                    _cachedDeviceId = cred.DeviceId;
                    token = cred.AccessToken;
                }
            }
        }

        if (!string.IsNullOrEmpty(token))
        {
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        }

        var response = await base.SendAsync(request, cancellationToken).ConfigureAwait(false);

        if (response.StatusCode == System.Net.HttpStatusCode.Unauthorized)
        {
            logger.LogWarning("Management server returned 401 Unauthorized. Device token may be revoked or expired.");
        }
        else if (response.StatusCode == System.Net.HttpStatusCode.Forbidden)
        {
            logger.LogWarning("Management server returned 403 Forbidden. Device may be pending approval or blocked.");
        }

        return response;
    }
}
