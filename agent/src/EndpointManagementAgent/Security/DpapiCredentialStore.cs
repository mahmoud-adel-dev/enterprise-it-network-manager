using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using EndpointManagementAgent.Configuration;
using EndpointManagementAgent.Domain;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace EndpointManagementAgent.Security;

public sealed class DpapiCredentialStore(
    IOptions<AgentOptions> options,
    ILogger<DpapiCredentialStore> logger) : ICredentialStore
{
    private static readonly byte[] Entropy = "EndpointManagementAgent.CredentialProtection.v1"u8.ToArray();
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    private readonly string _filePath = Path.Combine(options.Value.GetStateDirectory(), "credentials.dat");
    private readonly SemaphoreSlim _fileLock = new(1, 1);

    public bool Exists() => File.Exists(_filePath);

    public async Task<AgentCredential?> LoadAsync(CancellationToken cancellationToken = default)
    {
        await _fileLock.WaitAsync(cancellationToken).ConfigureAwait(false);
        try
        {
            if (!File.Exists(_filePath))
            {
                return null;
            }

            var encryptedBytes = await File.ReadAllBytesAsync(_filePath, cancellationToken).ConfigureAwait(false);
            if (encryptedBytes.Length == 0)
            {
                logger.LogWarning("Credential store file exists but is empty.");
                return null;
            }

            byte[] decryptedBytes;
            try
            {
                decryptedBytes = ProtectedData.Unprotect(encryptedBytes, Entropy, DataProtectionScope.LocalMachine);
            }
            catch (CryptographicException)
            {
                // Fallback attempt for test or current-user scope
                try
                {
                    decryptedBytes = ProtectedData.Unprotect(encryptedBytes, Entropy, DataProtectionScope.CurrentUser);
                }
                catch (CryptographicException ex)
                {
                    logger.LogError(ex, "Failed to unprotect local credentials using Windows DPAPI.");
                    return null;
                }
            }

            var credential = JsonSerializer.Deserialize<AgentCredential>(decryptedBytes, JsonOptions);
            if (credential is not null)
            {
                logger.LogInformation("Agent credentials loaded successfully from secure storage (AgentId: {AgentId}, DeviceId: {DeviceId}).",
                    credential.AgentId, credential.DeviceId);
            }

            return credential;
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogError(ex, "Unexpected error reading secure credentials.");
            return null;
        }
        finally
        {
            _fileLock.Release();
        }
    }

    public async Task SaveAsync(AgentCredential credential, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(credential);

        await _fileLock.WaitAsync(cancellationToken).ConfigureAwait(false);
        try
        {
            var directory = Path.GetDirectoryName(_filePath);
            if (!string.IsNullOrEmpty(directory) && !Directory.Exists(directory))
            {
                Directory.CreateDirectory(directory);
            }

            var jsonBytes = JsonSerializer.SerializeToUtf8Bytes(credential, JsonOptions);
            byte[] encryptedBytes;
            try
            {
                encryptedBytes = ProtectedData.Protect(jsonBytes, Entropy, DataProtectionScope.LocalMachine);
            }
            catch (CryptographicException)
            {
                encryptedBytes = ProtectedData.Protect(jsonBytes, Entropy, DataProtectionScope.CurrentUser);
            }

            // Write atomically to temporary file then replace
            var tempPath = _filePath + "." + Guid.NewGuid().ToString("N") + ".tmp";
            await File.WriteAllBytesAsync(tempPath, encryptedBytes, cancellationToken).ConfigureAwait(false);

            // Attempt to hide and secure the file attributes
            try
            {
                File.SetAttributes(tempPath, FileAttributes.Hidden | FileAttributes.NotContentIndexed);
            }
            catch
            {
                // Non-fatal if filesystem does not support attributes
            }

            File.Move(tempPath, _filePath, overwrite: true);

            logger.LogInformation("Agent credentials securely persisted via Windows DPAPI (AgentId: {AgentId}, DeviceId: {DeviceId}).",
                credential.AgentId, credential.DeviceId);
        }
        finally
        {
            _fileLock.Release();
        }
    }

    public async Task ClearAsync(CancellationToken cancellationToken = default)
    {
        await _fileLock.WaitAsync(cancellationToken).ConfigureAwait(false);
        try
        {
            if (File.Exists(_filePath))
            {
                File.Delete(_filePath);
                logger.LogInformation("Secure credentials file cleared.");
            }
        }
        finally
        {
            _fileLock.Release();
        }
    }
}
