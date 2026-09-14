using System.Diagnostics;
using System.Text;
using EndpointManagementAgent.Configuration;
using EndpointManagementAgent.Domain;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace EndpointManagementAgent.Jobs;

public sealed class InstallerEngine(
    IOptions<AgentOptions> options,
    ILogger<InstallerEngine> logger) : IInstallerEngine
{
    private static readonly HashSet<int> DefaultSuccessCodes = [0, 3010, 1641];
    private static readonly HashSet<int> RebootCodes = [3010, 1641];

    public async Task<InstallerExecutionResult> ExecuteAsync(
        string installerFilePath,
        InstallerType installerType,
        IReadOnlyList<string> customArguments,
        IReadOnlyList<int>? successExitCodes,
        int timeoutMinutes,
        bool allowKillOnTimeout,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(installerFilePath);

        if (!File.Exists(installerFilePath))
        {
            return new InstallerExecutionResult(
                Started: false,
                TimedOut: false,
                ExitCode: null,
                RebootRequired: false,
                Diagnostics: "Installer binary file not found on disk.",
                ErrorCode: "FILE_NOT_FOUND",
                ErrorMessage: $"The installer file '{installerFilePath}' does not exist.");
        }

        var effectiveSuccessCodes = successExitCodes != null && successExitCodes.Count > 0
            ? new HashSet<int>(successExitCodes)
            : DefaultSuccessCodes;

        var startInfo = new ProcessStartInfo
        {
            UseShellExecute = false,
            CreateNoWindow = true,
            RedirectStandardOutput = true,
            RedirectStandardError = true,
            WorkingDirectory = Path.GetDirectoryName(installerFilePath) ?? "C:\\",
        };

        if (installerType == InstallerType.MSI)
        {
            startInfo.FileName = "msiexec.exe";
            startInfo.ArgumentList.Add("/i");
            startInfo.ArgumentList.Add(installerFilePath);
            startInfo.ArgumentList.Add("/qn");
            startInfo.ArgumentList.Add("/norestart");

            foreach (var arg in customArguments)
            {
                if (!string.IsNullOrWhiteSpace(arg))
                {
                    startInfo.ArgumentList.Add(arg);
                }
            }
        }
        else
        {
            startInfo.FileName = installerFilePath;
            foreach (var arg in customArguments)
            {
                if (!string.IsNullOrWhiteSpace(arg))
                {
                    startInfo.ArgumentList.Add(arg);
                }
            }
        }

        logger.LogInformation("Launching installer process {FileName} (Type: {Type}, Timeout: {Timeout}m)...",
            startInfo.FileName, installerType, timeoutMinutes);

        var outputBuilder = new StringBuilder();
        var errorBuilder = new StringBuilder();
        var maxDiag = options.Value.Installer.MaximumDiagnosticCharacters;

        using var process = new Process { StartInfo = startInfo };

        process.OutputDataReceived += (_, e) =>
        {
            if (e.Data != null && outputBuilder.Length < maxDiag)
            {
                outputBuilder.AppendLine(e.Data);
            }
        };

        process.ErrorDataReceived += (_, e) =>
        {
            if (e.Data != null && errorBuilder.Length < maxDiag)
            {
                errorBuilder.AppendLine(e.Data);
            }
        };

        try
        {
            if (!process.Start())
            {
                return new InstallerExecutionResult(
                    Started: false,
                    TimedOut: false,
                    ExitCode: null,
                    RebootRequired: false,
                    Diagnostics: "Failed to initiate installer process.",
                    ErrorCode: "PROCESS_START_FAILED",
                    ErrorMessage: "System was unable to start the installer process.");
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to launch installer process: {FileName}", startInfo.FileName);
            return new InstallerExecutionResult(
                Started: false,
                TimedOut: false,
                ExitCode: null,
                RebootRequired: false,
                Diagnostics: ex.ToString(),
                ErrorCode: "PROCESS_START_EXCEPTION",
                ErrorMessage: ex.Message);
        }

        process.BeginOutputReadLine();
        process.BeginErrorReadLine();

        using var timeoutCts = new CancellationTokenSource(TimeSpan.FromMinutes(timeoutMinutes));
        using var linkedCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken, timeoutCts.Token);

        try
        {
            await process.WaitForExitAsync(linkedCts.Token).ConfigureAwait(false);
        }
        catch (OperationCanceledException)
        {
            if (timeoutCts.IsCancellationRequested)
            {
                logger.LogWarning("Installer process timed out after {Minutes} minutes. Terminating process tree.", timeoutMinutes);
                try
                {
                    process.Kill(entireProcessTree: true);
                }
                catch (Exception ex)
                {
                    logger.LogError(ex, "Failed to terminate timed-out installer process.");
                }

                var diag = BuildDiagnostics(outputBuilder, errorBuilder);
                return new InstallerExecutionResult(
                    Started: true,
                    TimedOut: true,
                    ExitCode: null,
                    RebootRequired: false,
                    Diagnostics: diag,
                    ErrorCode: "INSTALLER_TIMEOUT",
                    ErrorMessage: $"The installer execution timed out after {timeoutMinutes} minutes.");
            }

            // Normal service shutdown cancellation
            try
            {
                process.Kill(entireProcessTree: true);
            }
            catch
            {
                // ignore
            }
            throw;
        }

        var exitCode = process.ExitCode;
        var rebootRequired = RebootCodes.Contains(exitCode);
        var isSuccess = effectiveSuccessCodes.Contains(exitCode);
        var combinedDiagnostics = BuildDiagnostics(outputBuilder, errorBuilder);

        logger.LogInformation("Installer finished with exit code {ExitCode} (Success: {Success}, RebootRequired: {Reboot})",
            exitCode, isSuccess, rebootRequired);

        string? errorCode = null;
        string? errorMessage = null;

        if (!isSuccess)
        {
            (errorCode, errorMessage) = MapInstallerExitCode(exitCode, installerType);
        }

        return new InstallerExecutionResult(
            Started: true,
            TimedOut: false,
            ExitCode: exitCode,
            RebootRequired: rebootRequired,
            Diagnostics: combinedDiagnostics,
            ErrorCode: errorCode,
            ErrorMessage: errorMessage);
    }

    private static string BuildDiagnostics(StringBuilder stdout, StringBuilder stderr)
    {
        var sb = new StringBuilder();
        if (stdout.Length > 0)
        {
            sb.AppendLine("=== STDOUT ===");
            sb.AppendLine(stdout.ToString());
        }

        if (stderr.Length > 0)
        {
            sb.AppendLine("=== STDERR ===");
            sb.AppendLine(stderr.ToString());
        }

        return sb.ToString().Trim();
    }

    private static (string Code, string Message) MapInstallerExitCode(int exitCode, InstallerType type) =>
        exitCode switch
        {
            1602 => ("INSTALLER_USER_CANCEL", "The installation was cancelled by the user or policy."),
            1603 => ("INSTALLER_FATAL_ERROR", "A fatal error occurred during installation (MSI 1603)."),
            1618 => ("INSTALLER_MUTEX_CONFLICT", "Another installation is already in progress. Wait for it to complete."),
            1619 => ("INSTALLER_PACKAGE_OPEN_ERROR", "The installation package could not be opened. Verify package integrity."),
            1620 => ("INSTALLER_PACKAGE_INVALID", "This installation package could not be opened. Contact application vendor."),
            1625 => ("INSTALLER_POLICY_FORBIDDEN", "This installation is forbidden by system policy. Contact your system administrator."),
            1638 => ("INSTALLER_VERSION_CONFLICT", "Another version of this product is already installed."),
            1642 => ("INSTALLER_UPGRADE_FAILED", "The upgrade patch cannot be installed because the program to be upgraded is missing."),
            _ => ($"EXIT_CODE_{exitCode}", $"The installer process exited with non-zero code {exitCode}."),
        };
}
