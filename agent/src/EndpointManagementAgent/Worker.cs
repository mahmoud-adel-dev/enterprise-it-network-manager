using System.Reflection;
using EndpointManagementAgent.Api;
using EndpointManagementAgent.Configuration;
using EndpointManagementAgent.Domain;
using EndpointManagementAgent.Inventory;
using EndpointManagementAgent.Jobs;
using EndpointManagementAgent.Security;
using EndpointManagementAgent.Software;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace EndpointManagementAgent;

public sealed class Worker(
    IAgentApiClient apiClient,
    AgentAuthenticationHandler authHandler,
    ICredentialStore credentialStore,
    IHardwareInventoryProvider inventoryProvider,
    ISoftwareInventoryProvider softwareProvider,
    IJobExecutor jobExecutor,
    IFirewallIsolationManager isolationManager,
    IOptions<AgentOptions> options,
    ILogger<Worker> logger) : BackgroundService
{
    private readonly AgentOptions _options = options.Value;
    private AgentCredential? _credential;

    private DateTimeOffset _lastHeartbeat = DateTimeOffset.MinValue;
    private DateTimeOffset _lastHardwareInventory = DateTimeOffset.MinValue;
    private DateTimeOffset _lastSoftwareInventory = DateTimeOffset.MinValue;
    private DateTimeOffset _lastJobPoll = DateTimeOffset.MinValue;

    private int _consecutiveFailures;

    public static string AgentVersion =>
        Assembly.GetExecutingAssembly().GetName().Version?.ToString(3) ?? "1.0.0";

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("=================================================");
        logger.LogInformation("Endpoint Management Agent v{Version} starting...", AgentVersion);
        logger.LogInformation("Management Server: {ServerUrl}", _options.Server.BaseUrl);
        logger.LogInformation("State Directory:   {StateDir}", _options.GetStateDirectory());
        logger.LogInformation("Package Directory: {PkgDir}", _options.GetPackageCacheDirectory());
        logger.LogInformation("=================================================");

        // 1. Initial Credential Resolution or Enrollment
        await EnsureEnrolledAsync(stoppingToken).ConfigureAwait(false);

        // 2. Perform initial inventories right after startup
        _lastHeartbeat = DateTimeOffset.MinValue;
        _lastHardwareInventory = DateTimeOffset.MinValue;
        _lastSoftwareInventory = DateTimeOffset.MinValue;

        logger.LogInformation("Agent successfully initialized. Entering main operational loop.");

        // 3. Main Periodic Loop
        while (!stoppingToken.IsCancellationRequested)
        {
            var now = DateTimeOffset.UtcNow;

            try
            {
                // Ensure we have active credentials
                if (_credential == null)
                {
                    await EnsureEnrolledAsync(stoppingToken).ConfigureAwait(false);
                    if (_credential == null)
                    {
                        await Task.Delay(TimeSpan.FromSeconds(_options.EnrollmentRetrySeconds), stoppingToken).ConfigureAwait(false);
                        continue;
                    }
                }

                // Heartbeat check
                if (now - _lastHeartbeat >= TimeSpan.FromSeconds(_options.HeartbeatIntervalSeconds))
                {
                    await ExecuteHeartbeatAsync(stoppingToken).ConfigureAwait(false);
                    _lastHeartbeat = DateTimeOffset.UtcNow;
                }

                // Hardware Inventory check
                if (now - _lastHardwareInventory >= TimeSpan.FromMinutes(_options.InventoryIntervalMinutes))
                {
                    await ExecuteHardwareInventoryAsync(stoppingToken).ConfigureAwait(false);
                    _lastHardwareInventory = DateTimeOffset.UtcNow;
                }

                // Software Inventory check
                if (now - _lastSoftwareInventory >= TimeSpan.FromMinutes(_options.SoftwareInventoryIntervalMinutes))
                {
                    await ExecuteSoftwareInventoryAsync(stoppingToken).ConfigureAwait(false);
                    _lastSoftwareInventory = DateTimeOffset.UtcNow;
                }

                // Job Polling check
                if (now - _lastJobPoll >= TimeSpan.FromSeconds(_options.JobPollIntervalSeconds))
                {
                    await PollAndExecuteJobsAsync(stoppingToken).ConfigureAwait(false);
                    _lastJobPoll = DateTimeOffset.UtcNow;
                }

                _consecutiveFailures = 0;
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (ManagementApiException ex) when (ex.StatusCode == System.Net.HttpStatusCode.Unauthorized)
            {
                logger.LogWarning("Management server rejected credentials (401). Invalidating stored credential for re-enrollment.");
                _credential = null;
                authHandler.ClearCachedToken();
                await Task.Delay(TimeSpan.FromSeconds(_options.EnrollmentRetrySeconds), stoppingToken).ConfigureAwait(false);
            }
            catch (ManagementApiException ex) when (ex.StatusCode == System.Net.HttpStatusCode.Forbidden)
            {
                logger.LogWarning("Endpoint is currently blocked or pending approval on server (403). Pausing requests for 60s.");
                await Task.Delay(TimeSpan.FromSeconds(60), stoppingToken).ConfigureAwait(false);
            }
            catch (Exception ex)
            {
                _consecutiveFailures++;
                var backoffSeconds = Math.Min(300, Math.Max(5, _consecutiveFailures * 5));
                logger.LogWarning(ex, "Transient operational failure (#{Count}). Backing off for {Seconds}s.",
                    _consecutiveFailures, backoffSeconds);

                await Task.Delay(TimeSpan.FromSeconds(backoffSeconds), stoppingToken).ConfigureAwait(false);
            }

            // Short tick to check cancellation and schedules
            try
            {
                await Task.Delay(1000, stoppingToken).ConfigureAwait(false);
            }
            catch (OperationCanceledException)
            {
                break;
            }
        }

        logger.LogInformation("Endpoint Management Agent worker loop stopped gracefully.");
    }

    private async Task EnsureEnrolledAsync(CancellationToken cancellationToken)
    {
        _credential = await credentialStore.LoadAsync(cancellationToken).ConfigureAwait(false);
        if (_credential != null)
        {
            logger.LogInformation("Existing device enrollment detected. Device ID: {DeviceId}, Agent ID: {AgentId}",
                _credential.DeviceId, _credential.AgentId);
            authHandler.UpdateCachedToken(_credential.AccessToken, _credential.DeviceId);
            return;
        }

        logger.LogInformation("No stored credentials found. Initiating bootstrap enrollment...");

        var enrollmentToken = ResolveEnrollmentToken();
        if (string.IsNullOrWhiteSpace(enrollmentToken))
        {
            logger.LogWarning("Enrollment token is missing. Please configure Agent:EnrollmentToken, an enrollment.token file, or the AGENT_ENROLLMENT_TOKEN environment variable.");
            return;
        }

        var deviceUuid = MachineIdentity.GetOrCreateDeviceUuid(_options.GetStateDirectory());
        var inv = await inventoryProvider.CollectInventoryAsync(cancellationToken).ConfigureAwait(false);

        var request = new EnrollmentRequest(
            DeviceUuid: deviceUuid,
            Hostname: inv.Hostname,
            Fqdn: inv.Fqdn,
            AgentVersion: AgentVersion,
            OperatingSystem: inv.OperatingSystem,
            OsBuild: inv.OsBuild,
            Architecture: inv.Architecture,
            SerialNumber: inv.SerialNumber,
            NetworkInterfaces: inv.NetworkInterfaces);

        try
        {
            logger.LogInformation("Sending enrollment request for DeviceUuid: {Uuid}, Hostname: {Hostname}...",
                deviceUuid, inv.Hostname);

            var response = await apiClient.EnrollAsync(enrollmentToken, request, cancellationToken).ConfigureAwait(false);

            var credential = new AgentCredential(
                AgentId: response.AgentId,
                DeviceId: response.DeviceId,
                AccessToken: response.AccessToken,
                ServerUri: new Uri(_options.Server.BaseUrl),
                IssuedAt: DateTimeOffset.UtcNow,
                ExpiresAt: response.ExpiresAt);

            await credentialStore.SaveAsync(credential, cancellationToken).ConfigureAwait(false);
            _credential = credential;
            authHandler.UpdateCachedToken(credential.AccessToken, credential.DeviceId);

            logger.LogInformation("Enrollment SUCCESS! Registered as DeviceId: {DeviceId}, AgentId: {AgentId}",
                credential.DeviceId, credential.AgentId);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to complete device enrollment with management server.");
            throw;
        }
    }

    private string? ResolveEnrollmentToken()
    {
        if (!string.IsNullOrWhiteSpace(_options.EnrollmentToken))
        {
            return _options.EnrollmentToken.Trim();
        }

        var envToken = Environment.GetEnvironmentVariable("AGENT_ENROLLMENT_TOKEN");
        if (!string.IsNullOrWhiteSpace(envToken))
        {
            return envToken.Trim();
        }

        var tokenFile = _options.GetEnrollmentTokenFile();
        if (File.Exists(tokenFile))
        {
            try
            {
                var content = File.ReadAllText(tokenFile).Trim();
                if (!string.IsNullOrWhiteSpace(content))
                {
                    return content;
                }
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Failed to read enrollment token from file: {Path}", tokenFile);
            }
        }

        return null;
    }

    private async Task ExecuteHeartbeatAsync(CancellationToken cancellationToken)
    {
        if (_credential == null) return;

        var heartbeat = await inventoryProvider.CollectHeartbeatTelemetryAsync(_credential.DeviceId, AgentVersion, cancellationToken).ConfigureAwait(false);
        var response = await apiClient.SendHeartbeatAsync(heartbeat, cancellationToken).ConfigureAwait(false);

        // Handle network isolation / quarantine commanded by server
        if (response.Quarantined && !isolationManager.IsQuarantined)
        {
            logger.LogWarning("Server requested network isolation for this device.");
            await isolationManager.ApplyIsolationAsync(cancellationToken).ConfigureAwait(false);
        }
        else if (!response.Quarantined && isolationManager.IsQuarantined)
        {
            logger.LogInformation("Server removed network isolation. Restoring normal network.");
            await isolationManager.RestoreNetworkAsync(cancellationToken).ConfigureAwait(false);
        }
    }

    private async Task ExecuteHardwareInventoryAsync(CancellationToken cancellationToken)
    {
        if (_credential == null) return;

        logger.LogInformation("Collecting and uploading complete hardware inventory...");
        var inv = await inventoryProvider.CollectInventoryAsync(cancellationToken).ConfigureAwait(false);
        await apiClient.SendHardwareInventoryAsync(new HardwareInventoryRequest(_credential.DeviceId, AgentVersion, inv), cancellationToken).ConfigureAwait(false);
        logger.LogInformation("Hardware inventory successfully uploaded.");
    }

    private async Task ExecuteSoftwareInventoryAsync(CancellationToken cancellationToken)
    {
        if (_credential == null) return;

        logger.LogInformation("Collecting and uploading installed software catalog...");
        var apps = await softwareProvider.CollectInstalledSoftwareAsync(cancellationToken).ConfigureAwait(false);
        await apiClient.SendSoftwareInventoryAsync(new SoftwareInventoryRequest(_credential.DeviceId, AgentVersion, apps, DateTimeOffset.UtcNow), cancellationToken).ConfigureAwait(false);
        logger.LogInformation("Software inventory successfully uploaded ({Count} applications).", apps.Count);
    }

    private async Task PollAndExecuteJobsAsync(CancellationToken cancellationToken)
    {
        if (_credential == null) return;

        var jobs = await apiClient.PollJobsAsync(maximumJobs: 5, cancellationToken).ConfigureAwait(false);
        if (jobs.Count == 0)
        {
            return;
        }

        logger.LogInformation("Received {Count} assigned job(s) from server.", jobs.Count);
        foreach (var job in jobs)
        {
            await jobExecutor.ExecuteJobAsync(job, cancellationToken).ConfigureAwait(false);
        }
    }
}
