using System.Text.Json;
using EndpointManagementAgent.Api;
using EndpointManagementAgent.Domain;
using EndpointManagementAgent.Inventory;
using EndpointManagementAgent.Security;
using EndpointManagementAgent.Software;
using Microsoft.Extensions.Logging;

namespace EndpointManagementAgent.Jobs;

public sealed class JobExecutor(
    IAgentApiClient apiClient,
    IPackageDownloadManager downloadManager,
    IPackageVerifier verifier,
    IInstallerEngine installerEngine,
    IDetectionRuleEvaluator detectionEvaluator,
    IHardwareInventoryProvider inventoryProvider,
    ISoftwareInventoryProvider softwareProvider,
    ICredentialStore credentialStore,
    ILogger<JobExecutor> logger) : IJobExecutor
{
    public async Task ExecuteJobAsync(AgentJob job, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(job);

        logger.LogInformation("Processing job {JobId} (Type: {Type}, LeaseExpires: {LeaseExpires})...",
            job.Id, job.Type, job.LeaseExpiresAt);

        switch (job.Type)
        {
            case AgentJobType.INSTALL_APPLICATION:
                await ExecuteInstallJobAsync(job, cancellationToken).ConfigureAwait(false);
                break;

            case AgentJobType.COLLECT_INVENTORY:
                await ExecuteCollectInventoryJobAsync(job, cancellationToken).ConfigureAwait(false);
                break;

            case AgentJobType.REFRESH_SOFTWARE_INVENTORY:
                await ExecuteRefreshSoftwareInventoryJobAsync(job, cancellationToken).ConfigureAwait(false);
                break;

            case AgentJobType.ROTATE_CREDENTIAL:
                await ExecuteRotateCredentialJobAsync(job, cancellationToken).ConfigureAwait(false);
                break;

            default:
                logger.LogWarning("Unsupported job type: {Type} for job {JobId}.", job.Type, job.Id);
                await apiClient.ReportJobStatusAsync(job.Id, new JobStatusRequest(
                    LeaseToken: job.LeaseToken,
                    Status: AgentJobStatus.FAILED,
                    ObservedAt: DateTimeOffset.UtcNow,
                    ErrorCode: "UNSUPPORTED_JOB_TYPE",
                    ErrorMessage: $"Agent does not support job type {job.Type}."), cancellationToken).ConfigureAwait(false);
                break;
        }
    }

    private async Task ExecuteInstallJobAsync(AgentJob job, CancellationToken cancellationToken)
    {
        InstallApplicationPayload? payload;
        try
        {
            payload = job.Payload.Deserialize<InstallApplicationPayload>(AgentApiClient.SerializerOptions);
            if (payload == null)
            {
                throw new InvalidOperationException("Payload deserialization resulted in null.");
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to deserialize installation payload for job {JobId}", job.Id);
            await apiClient.ReportJobStatusAsync(job.Id, new JobStatusRequest(
                LeaseToken: job.LeaseToken,
                Status: AgentJobStatus.FAILED,
                ObservedAt: DateTimeOffset.UtcNow,
                ErrorCode: "INVALID_PAYLOAD",
                ErrorMessage: "Could not parse installation payload: " + ex.Message), cancellationToken).ConfigureAwait(false);
            return;
        }

        // 1. Report DOWNLOADING
        await apiClient.ReportJobStatusAsync(job.Id, new JobStatusRequest(
            LeaseToken: job.LeaseToken,
            Status: AgentJobStatus.DOWNLOADING,
            ObservedAt: DateTimeOffset.UtcNow), cancellationToken).ConfigureAwait(false);

        // 2. Download package
        PackageDownloadResult downloadResult;
        try
        {
            downloadResult = await downloadManager.DownloadPackageAsync(
                payload.PackageId,
                payload.FileName,
                payload.Sha256,
                payload.FileSize,
                cancellationToken).ConfigureAwait(false);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to download package for job {JobId}", job.Id);
            await apiClient.ReportJobStatusAsync(job.Id, new JobStatusRequest(
                LeaseToken: job.LeaseToken,
                Status: AgentJobStatus.FAILED,
                ObservedAt: DateTimeOffset.UtcNow,
                ErrorCode: "DOWNLOAD_FAILED",
                ErrorMessage: "Package download failed: " + ex.Message), cancellationToken).ConfigureAwait(false);
            return;
        }

        try
        {
            // 3. Report VERIFYING_PACKAGE
            await apiClient.ReportJobStatusAsync(job.Id, new JobStatusRequest(
                LeaseToken: job.LeaseToken,
                Status: AgentJobStatus.VERIFYING_PACKAGE,
                ObservedAt: DateTimeOffset.UtcNow), cancellationToken).ConfigureAwait(false);

            // 4. Verify package checksum
            var isIntegrityValid = await verifier.VerifyPackageIntegrityAsync(downloadResult.FilePath, payload.Sha256, cancellationToken).ConfigureAwait(false);
            if (!isIntegrityValid)
            {
                logger.LogError("Checksum mismatch for package in job {JobId}.", job.Id);
                await apiClient.ReportJobStatusAsync(job.Id, new JobStatusRequest(
                    LeaseToken: job.LeaseToken,
                    Status: AgentJobStatus.FAILED,
                    ObservedAt: DateTimeOffset.UtcNow,
                    ErrorCode: "PACKAGE_HASH_MISMATCH",
                    ErrorMessage: "Downloaded package SHA-256 hash did not match server package metadata."), cancellationToken).ConfigureAwait(false);
                return;
            }

            // 5. Report INSTALLING
            await apiClient.ReportJobStatusAsync(job.Id, new JobStatusRequest(
                LeaseToken: job.LeaseToken,
                Status: AgentJobStatus.INSTALLING,
                ObservedAt: DateTimeOffset.UtcNow), cancellationToken).ConfigureAwait(false);

            // 6. Execute installer
            var execResult = await installerEngine.ExecuteAsync(
                downloadResult.FilePath,
                payload.InstallerType,
                payload.InstallerArguments,
                payload.SuccessExitCodes,
                payload.TimeoutMinutes ?? 120,
                payload.AllowKillOnTimeout,
                cancellationToken).ConfigureAwait(false);

            if (!execResult.Started || execResult.TimedOut || !string.IsNullOrEmpty(execResult.ErrorCode))
            {
                logger.LogError("Installer execution failed for job {JobId}. ExitCode: {ExitCode}, ErrorCode: {ErrorCode}",
                    job.Id, execResult.ExitCode, execResult.ErrorCode);

                await apiClient.ReportJobStatusAsync(job.Id, new JobStatusRequest(
                    LeaseToken: job.LeaseToken,
                    Status: AgentJobStatus.FAILED,
                    ObservedAt: DateTimeOffset.UtcNow,
                    ExitCode: execResult.ExitCode,
                    ErrorCode: execResult.ErrorCode ?? "INSTALLER_FAILED",
                    ErrorMessage: execResult.ErrorMessage ?? "Installer returned an unsuccessful exit code.",
                    Diagnostics: execResult.Diagnostics), cancellationToken).ConfigureAwait(false);
                return;
            }

            // 7. Post-Installation Detection Verification
            if (payload.DetectionRule != null)
            {
                await apiClient.ReportJobStatusAsync(job.Id, new JobStatusRequest(
                    LeaseToken: job.LeaseToken,
                    Status: AgentJobStatus.VERIFYING_INSTALLATION,
                    ObservedAt: DateTimeOffset.UtcNow), cancellationToken).ConfigureAwait(false);

                var detection = await detectionEvaluator.EvaluateAsync(payload.DetectionRule, cancellationToken).ConfigureAwait(false);
                if (!detection.IsDetected)
                {
                    logger.LogWarning("Post-installation detection failed for job {JobId}: {Evidence}", job.Id, detection.Evidence);
                    await apiClient.ReportJobStatusAsync(job.Id, new JobStatusRequest(
                        LeaseToken: job.LeaseToken,
                        Status: AgentJobStatus.FAILED,
                        ObservedAt: DateTimeOffset.UtcNow,
                        ExitCode: execResult.ExitCode,
                        ErrorCode: "DETECTION_FAILED",
                        ErrorMessage: "Application installation completed, but post-installation detection rule was not satisfied: " + detection.Evidence,
                        Diagnostics: execResult.Diagnostics), cancellationToken).ConfigureAwait(false);
                    return;
                }
            }

            // 8. Final Status: SUCCESS or REBOOT_REQUIRED
            var finalStatus = execResult.RebootRequired ? AgentJobStatus.REBOOT_REQUIRED : AgentJobStatus.SUCCESS;
            logger.LogInformation("Job {JobId} successfully completed with status {Status}.", job.Id, finalStatus);

            await apiClient.ReportJobStatusAsync(job.Id, new JobStatusRequest(
                LeaseToken: job.LeaseToken,
                Status: finalStatus,
                ObservedAt: DateTimeOffset.UtcNow,
                ExitCode: execResult.ExitCode,
                RebootRequired: execResult.RebootRequired,
                Diagnostics: execResult.Diagnostics), cancellationToken).ConfigureAwait(false);
        }
        finally
        {
            downloadManager.CleanupPackage(downloadResult.FilePath);
        }
    }

    private async Task ExecuteCollectInventoryJobAsync(AgentJob job, CancellationToken cancellationToken)
    {
        var cred = await credentialStore.LoadAsync(cancellationToken).ConfigureAwait(false);
        if (cred == null) return;

        var inventory = await inventoryProvider.CollectInventoryAsync(cancellationToken).ConfigureAwait(false);
        await apiClient.SendHardwareInventoryAsync(new HardwareInventoryRequest(cred.DeviceId, Worker.AgentVersion, inventory), cancellationToken).ConfigureAwait(false);

        await apiClient.ReportJobStatusAsync(job.Id, new JobStatusRequest(
            LeaseToken: job.LeaseToken,
            Status: AgentJobStatus.SUCCESS,
            ObservedAt: DateTimeOffset.UtcNow), cancellationToken).ConfigureAwait(false);
    }

    private async Task ExecuteRefreshSoftwareInventoryJobAsync(AgentJob job, CancellationToken cancellationToken)
    {
        var cred = await credentialStore.LoadAsync(cancellationToken).ConfigureAwait(false);
        if (cred == null) return;

        var apps = await softwareProvider.CollectInstalledSoftwareAsync(cancellationToken).ConfigureAwait(false);
        await apiClient.SendSoftwareInventoryAsync(new SoftwareInventoryRequest(cred.DeviceId, Worker.AgentVersion, apps, DateTimeOffset.UtcNow), cancellationToken).ConfigureAwait(false);

        await apiClient.ReportJobStatusAsync(job.Id, new JobStatusRequest(
            LeaseToken: job.LeaseToken,
            Status: AgentJobStatus.SUCCESS,
            ObservedAt: DateTimeOffset.UtcNow), cancellationToken).ConfigureAwait(false);
    }

    private async Task ExecuteRotateCredentialJobAsync(AgentJob job, CancellationToken cancellationToken)
    {
        var currentCred = await credentialStore.LoadAsync(cancellationToken).ConfigureAwait(false);
        if (currentCred == null) return;

        var rotation = await apiClient.RotateCredentialAsync(cancellationToken).ConfigureAwait(false);
        var updatedCred = currentCred with
        {
            AccessToken = rotation.AccessToken,
            IssuedAt = DateTimeOffset.UtcNow,
            ExpiresAt = rotation.ExpiresAt,
        };

        await credentialStore.SaveAsync(updatedCred, cancellationToken).ConfigureAwait(false);

        await apiClient.ReportJobStatusAsync(job.Id, new JobStatusRequest(
            LeaseToken: job.LeaseToken,
            Status: AgentJobStatus.SUCCESS,
            ObservedAt: DateTimeOffset.UtcNow), cancellationToken).ConfigureAwait(false);
    }
}
