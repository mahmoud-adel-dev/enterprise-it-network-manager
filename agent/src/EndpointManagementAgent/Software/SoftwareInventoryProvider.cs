using System.Text.RegularExpressions;
using EndpointManagementAgent.Domain;
using Microsoft.Extensions.Logging;
using Microsoft.Win32;

namespace EndpointManagementAgent.Software;

public sealed partial class SoftwareInventoryProvider(ILogger<SoftwareInventoryProvider> logger) : ISoftwareInventoryProvider
{
    private static readonly Regex GuidRegex = GuidPattern();

    public Task<IReadOnlyList<SoftwareInventoryItem>> CollectInstalledSoftwareAsync(CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        var items = new Dictionary<string, SoftwareInventoryItem>(StringComparer.OrdinalIgnoreCase);

        // 1. Scan 64-bit Registry view
        ScanRegistryView(RegistryView.Registry64, "x64", items);

        // 2. Scan 32-bit Registry view (WOW6432Node)
        ScanRegistryView(RegistryView.Registry32, "x86", items);

        logger.LogInformation("Discovered {Count} unique installed applications across 64-bit and 32-bit registry hives.", items.Count);

        return Task.FromResult<IReadOnlyList<SoftwareInventoryItem>>(items.Values.ToList());
    }

    private void ScanRegistryView(RegistryView view, string architecture, Dictionary<string, SoftwareInventoryItem> items)
    {
        const string uninstallPath = @"SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall";
        try
        {
            using var baseKey = RegistryKey.OpenBaseKey(RegistryHive.LocalMachine, view);
            using var uninstallKey = baseKey.OpenSubKey(uninstallPath);
            if (uninstallKey == null)
            {
                return;
            }

            foreach (var subKeyName in uninstallKey.GetSubKeyNames())
            {
                try
                {
                    using var appKey = uninstallKey.OpenSubKey(subKeyName);
                    if (appKey == null) continue;

                    // Filter out system components, updates, and non-displayable entries
                    var isSystemComponent = Convert.ToInt32(appKey.GetValue("SystemComponent", 0)) == 1;
                    if (isSystemComponent) continue;

                    var parentKey = appKey.GetValue("ParentKeyName")?.ToString();
                    if (!string.IsNullOrEmpty(parentKey)) continue;

                    var displayName = appKey.GetValue("DisplayName")?.ToString()?.Trim();
                    if (string.IsNullOrWhiteSpace(displayName)) continue;

                    var displayVersion = appKey.GetValue("DisplayVersion")?.ToString()?.Trim();
                    var publisher = appKey.GetValue("Publisher")?.ToString()?.Trim();
                    var installLocation = appKey.GetValue("InstallLocation")?.ToString()?.Trim();

                    string? productCode = null;
                    var isWindowsInstaller = Convert.ToInt32(appKey.GetValue("WindowsInstaller", 0)) == 1;
                    if (isWindowsInstaller || GuidRegex.IsMatch(subKeyName))
                    {
                        productCode = subKeyName.Trim();
                    }

                    var normalizedId = BuildNormalizedId(displayName, publisher, displayVersion, productCode, architecture);

                    if (!items.ContainsKey(normalizedId))
                    {
                        items[normalizedId] = new SoftwareInventoryItem(
                            NormalizedId: normalizedId,
                            Name: displayName,
                            Publisher: string.IsNullOrWhiteSpace(publisher) ? null : publisher,
                            Version: string.IsNullOrWhiteSpace(displayVersion) ? null : displayVersion,
                            Architecture: architecture,
                            InstallLocation: string.IsNullOrWhiteSpace(installLocation) ? null : installLocation,
                            ProductCode: productCode,
                            DetectedAt: DateTimeOffset.UtcNow);
                    }
                }
                catch (Exception ex)
                {
                    logger.LogDebug(ex, "Failed to read registry key {SubKey} in {View}", subKeyName, view);
                }
            }
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to inspect uninstall registry key for view {View}", view);
        }
    }

    private static string BuildNormalizedId(string name, string? publisher, string? version, string? productCode, string arch)
    {
        if (!string.IsNullOrWhiteSpace(productCode) && GuidRegex.IsMatch(productCode))
        {
            return $"msi:{productCode.ToLowerInvariant()}";
        }

        var cleanPub = Sanitize(publisher ?? "unknown");
        var cleanName = Sanitize(name);
        var cleanVer = Sanitize(version ?? "none");

        return $"reg:{cleanPub}:{cleanName}:{cleanVer}:{arch}".ToLowerInvariant();
    }

    private static string Sanitize(string input)
    {
        var chars = input.Select(c => char.IsLetterOrDigit(c) ? c : '_').ToArray();
        return new string(chars).Trim('_');
    }

    [GeneratedRegex(@"^\{[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\}$", RegexOptions.Compiled)]
    private static partial Regex GuidPattern();
}
