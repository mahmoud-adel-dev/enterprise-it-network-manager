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
    private DateTimeOffset? _tokenExpiresAt;

    public void UpdateCachedToken(string token, Guid deviceId, DateTimeOffset? expiresAt = null)
    {
        lock (_lock)
        {
            _cachedToken = token;
            _cachedDeviceId = deviceId;
            _tokenExpiresAt = expiresAt;
        }
    }

    public void ClearCachedToken()
    {
        lock (_lock)
        {
            _cachedToken = null;
            _cachedDeviceId = null;
            _tokenExpiresAt = null;
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
        Guid? deviceId;
        lock (_lock)
        {
            // Check if cached token has expired (with 60-second safety margin)
            if (_tokenExpiresAt.HasValue && _tokenExpiresAt.Value <= DateTimeOffset.UtcNow.AddSeconds(60))
            {
                logger.LogWarning("Cached access token is expired or expiring soon. Clearing cache to trigger re-enrollment.");
                _cachedToken = null;
                _cachedDeviceId = null;
                _tokenExpiresAt = null;
            }

            token = _cachedToken;
            deviceId = _cachedDeviceId;
        }

        if (string.IsNullOrEmpty(token))
        {
            var cred = await credentialStore.LoadAsync(cancellationToken).ConfigureAwait(false);
            if (cred != null)
            {
                // Also check loaded credential expiry
                if (cred.ExpiresAt.HasValue && cred.ExpiresAt.Value <= DateTimeOffset.UtcNow.AddSeconds(60))
                {
                    logger.LogWarning("Stored credential has expired. Device will need to re-enroll.");
                }
                else
                {
                    lock (_lock)
                    {
                        _cachedToken = cred.AccessToken;
                        _cachedDeviceId = cred.DeviceId;
                        _tokenExpiresAt = cred.ExpiresAt;
                        token = cred.AccessToken;
                        deviceId = cred.DeviceId;
                    }
                }
            }
        }

        if (!string.IsNullOrEmpty(token))
        {
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        }

        if (deviceId.HasValue)
        {
            request.Headers.TryAddWithoutValidation("X-Device-Id", deviceId.Value.ToString("D"));
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
