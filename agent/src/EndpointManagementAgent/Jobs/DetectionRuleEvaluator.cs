using System.Diagnostics;
using System.ServiceProcess;
using EndpointManagementAgent.Domain;
using EndpointManagementAgent.Software;
using Microsoft.Extensions.Logging;
using Microsoft.Win32;

namespace EndpointManagementAgent.Jobs;

public sealed class DetectionRuleEvaluator(
    ISoftwareInventoryProvider softwareProvider,
    ILogger<DetectionRuleEvaluator> logger) : IDetectionRuleEvaluator
{
    public async Task<DetectionResult> EvaluateAsync(DetectionRule rule, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(rule);

        try
        {
            return rule.Type switch
            {
                DetectionType.MSI_PRODUCT_CODE => EvaluateMsiProductCode(rule),
                DetectionType.REGISTRY_VALUE => EvaluateRegistryValue(rule),
                DetectionType.INSTALLED_APPLICATION => await EvaluateInstalledApplicationAsync(rule, cancellationToken).ConfigureAwait(false),
                DetectionType.FILE_VERSION => EvaluateFileVersion(rule),
                DetectionType.WINDOWS_SERVICE => EvaluateWindowsService(rule),
                _ => new DetectionResult(false, null, $"Unsupported detection type: {rule.Type}"),
            };
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error evaluating detection rule of type {Type}", rule.Type);
            return new DetectionResult(false, null, $"Detection evaluation exception: {ex.Message}");
        }
    }

    private DetectionResult EvaluateMsiProductCode(DetectionRule rule)
    {
        if (string.IsNullOrWhiteSpace(rule.MsiProductCode))
        {
            return new DetectionResult(false, null, "Detection rule missing MsiProductCode.");
        }

        var normalizedCode = rule.MsiProductCode.Trim();
        const string uninstallPath = @"SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall";

        foreach (var view in new[] { RegistryView.Registry64, RegistryView.Registry32 })
        {
            try
            {
                using var baseKey = RegistryKey.OpenBaseKey(RegistryHive.LocalMachine, view);
                using var key = baseKey.OpenSubKey(Path.Combine(uninstallPath, normalizedCode));
                if (key != null)
                {
                    var version = key.GetValue("DisplayVersion")?.ToString();
                    var name = key.GetValue("DisplayName")?.ToString() ?? normalizedCode;
                    var versionMatches = CheckVersionMatch(version, rule.ExpectedVersion, rule.VersionMatch);

                    if (versionMatches)
                    {
                        return new DetectionResult(true, version, $"MSI Product Code {normalizedCode} found in {view} ({name} v{version}).");
                    }
                    else
                    {
                        return new DetectionResult(false, version, $"MSI Product Code found but version '{version}' does not satisfy {rule.VersionMatch} '{rule.ExpectedVersion}'.");
                    }
                }
            }
            catch (Exception ex)
            {
                logger.LogDebug(ex, "Error checking MSI product code in {View}", view);
            }
        }

        return new DetectionResult(false, null, $"MSI Product Code {normalizedCode} was not found in registry.");
    }

    private DetectionResult EvaluateRegistryValue(DetectionRule rule)
    {
        if (string.IsNullOrWhiteSpace(rule.RegistryPath))
        {
            return new DetectionResult(false, null, "Detection rule missing RegistryPath.");
        }

        var hive = ParseHive(rule.RegistryHive);
        var view = ParseView(rule.RegistryView);

        try
        {
            using var baseKey = RegistryKey.OpenBaseKey(hive, view);
            using var subKey = baseKey.OpenSubKey(rule.RegistryPath);
            if (subKey == null)
            {
                return new DetectionResult(false, null, $"Registry path '{rule.RegistryPath}' was not found.");
            }

            var value = subKey.GetValue(rule.RegistryValueName ?? string.Empty)?.ToString();
            if (value == null)
            {
                return new DetectionResult(false, null, $"Registry value '{rule.RegistryValueName}' not found in '{rule.RegistryPath}'.");
            }

            if (!string.IsNullOrWhiteSpace(rule.ExpectedValue))
            {
                var matches = string.Equals(value.Trim(), rule.ExpectedValue.Trim(), StringComparison.OrdinalIgnoreCase);
                return new DetectionResult(matches, value, matches
                    ? $"Registry value '{rule.RegistryValueName}' matches expected '{rule.ExpectedValue}'."
                    : $"Registry value '{value}' does not match expected '{rule.ExpectedValue}'.");
            }

            if (!string.IsNullOrWhiteSpace(rule.ExpectedVersion))
            {
                var matches = CheckVersionMatch(value, rule.ExpectedVersion, rule.VersionMatch);
                return new DetectionResult(matches, value, matches
                    ? $"Registry version '{value}' matches expected '{rule.ExpectedVersion}' ({rule.VersionMatch})."
                    : $"Registry version '{value}' does not match expected '{rule.ExpectedVersion}'.");
            }

            return new DetectionResult(true, value, $"Registry value exists with value '{value}'.");
        }
        catch (Exception ex)
        {
            return new DetectionResult(false, null, $"Registry evaluation error: {ex.Message}");
        }
    }

    private async Task<DetectionResult> EvaluateInstalledApplicationAsync(DetectionRule rule, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(rule.ApplicationName))
        {
            return new DetectionResult(false, null, "Detection rule missing ApplicationName.");
        }

        var apps = await softwareProvider.CollectInstalledSoftwareAsync(cancellationToken).ConfigureAwait(false);
        var matched = apps.FirstOrDefault(a =>
            a.Name.Contains(rule.ApplicationName, StringComparison.OrdinalIgnoreCase) &&
            (string.IsNullOrWhiteSpace(rule.ApplicationPublisher) || (a.Publisher?.Contains(rule.ApplicationPublisher, StringComparison.OrdinalIgnoreCase) ?? false)));

        if (matched == null)
        {
            return new DetectionResult(false, null, $"Installed application matching '{rule.ApplicationName}' not found.");
        }

        var versionMatches = CheckVersionMatch(matched.Version, rule.ExpectedVersion, rule.VersionMatch);
        return new DetectionResult(
            versionMatches,
            matched.Version,
            versionMatches
                ? $"Application '{matched.Name}' detected (Version: {matched.Version})."
                : $"Application '{matched.Name}' detected but version '{matched.Version}' failed condition {rule.VersionMatch} '{rule.ExpectedVersion}'.");
    }

    private static DetectionResult EvaluateFileVersion(DetectionRule rule)
    {
        if (string.IsNullOrWhiteSpace(rule.FilePath))
        {
            return new DetectionResult(false, null, "Detection rule missing FilePath.");
        }

        var expandedPath = Environment.ExpandEnvironmentVariables(rule.FilePath);
        if (!File.Exists(expandedPath))
        {
            return new DetectionResult(false, null, $"Target file '{expandedPath}' does not exist.");
        }

        var versionInfo = FileVersionInfo.GetVersionInfo(expandedPath);
        var fileVersion = versionInfo.FileVersion ?? versionInfo.ProductVersion;

        if (string.IsNullOrWhiteSpace(rule.ExpectedVersion))
        {
            return new DetectionResult(true, fileVersion, $"File exists at '{expandedPath}' (Version: {fileVersion}).");
        }

        var versionMatches = CheckVersionMatch(fileVersion, rule.ExpectedVersion, rule.VersionMatch);
        return new DetectionResult(
            versionMatches,
            fileVersion,
            versionMatches
                ? $"File '{expandedPath}' detected with matching version '{fileVersion}'."
                : $"File '{expandedPath}' version '{fileVersion}' does not satisfy {rule.VersionMatch} '{rule.ExpectedVersion}'.");
    }

    private static DetectionResult EvaluateWindowsService(DetectionRule rule)
    {
        if (string.IsNullOrWhiteSpace(rule.ServiceName))
        {
            return new DetectionResult(false, null, "Detection rule missing ServiceName.");
        }

        try
        {
            var services = ServiceController.GetServices();
            var service = services.FirstOrDefault(s => s.ServiceName.Equals(rule.ServiceName, StringComparison.OrdinalIgnoreCase));
            if (service == null)
            {
                return new DetectionResult(false, null, $"Windows Service '{rule.ServiceName}' not found.");
            }

            return new DetectionResult(true, null, $"Windows Service '{rule.ServiceName}' found (Status: {service.Status}).");
        }
        catch (Exception ex)
        {
            return new DetectionResult(false, null, $"Failed to query Windows Services: {ex.Message}");
        }
    }

    private static bool CheckVersionMatch(string? actualVersion, string? expectedVersion, VersionMatch matchType)
    {
        if (matchType == VersionMatch.ANY || string.IsNullOrWhiteSpace(expectedVersion))
        {
            return true;
        }

        if (string.IsNullOrWhiteSpace(actualVersion))
        {
            return false;
        }

        if (matchType == VersionMatch.EXACT)
        {
            return string.Equals(actualVersion.Trim(), expectedVersion.Trim(), StringComparison.OrdinalIgnoreCase);
        }

        if (matchType == VersionMatch.MINIMUM)
        {
            if (Version.TryParse(actualVersion, out var actual) && Version.TryParse(expectedVersion, out var expected))
            {
                return actual >= expected;
            }

            return string.Compare(actualVersion, expectedVersion, StringComparison.OrdinalIgnoreCase) >= 0;
        }

        return false;
    }

    private static RegistryHive ParseHive(string? hive) =>
        hive?.ToUpperInvariant() switch
        {
            "HKCU" or "CURRENTUSER" or "HKEY_CURRENT_USER" => RegistryHive.CurrentUser,
            "HKCR" or "CLASSESROOT" or "HKEY_CLASSES_ROOT" => RegistryHive.ClassesRoot,
            _ => RegistryHive.LocalMachine,
        };

    private static RegistryView ParseView(string? view) =>
        view?.ToUpperInvariant() switch
        {
            "32" or "X86" or "REGISTRY32" => RegistryView.Registry32,
            "64" or "X64" or "REGISTRY64" => RegistryView.Registry64,
            _ => RegistryView.Default,
        };
}
