using EndpointManagementAgent.Domain;

namespace EndpointManagementAgent.Configuration;

public sealed class AgentOptions
{
    public const string SectionName = "Agent";

    public ServerOptions Server { get; init; } = new();

    public string? StateDirectory { get; init; }

    public string? PackageCacheDirectory { get; init; }

    public string? EnrollmentTokenFile { get; init; }

    // Prefer Agent__EnrollmentToken as a one-time process environment variable only for unattended bootstrap.
    public string? EnrollmentToken { get; init; }

    public int HeartbeatIntervalSeconds { get; init; } = 60;

    public int InventoryIntervalMinutes { get; init; } = 360;

    public int SoftwareInventoryIntervalMinutes { get; init; } = 720;

    public int JobPollIntervalSeconds { get; init; } = 15;

    public int EnrollmentRetrySeconds { get; init; } = 60;

    public long MaxPackageBytes { get; init; } = 2L * 1024 * 1024 * 1024;

    public IReadOnlyList<AgentJobType> AllowedJobTypes { get; init; } =
    [
        AgentJobType.INSTALL_APPLICATION,
        AgentJobType.COLLECT_INVENTORY,
        AgentJobType.REFRESH_SOFTWARE_INVENTORY,
        AgentJobType.ROTATE_CREDENTIAL,
    ];

    public InstallerOptions Installer { get; init; } = new();

    public AgentFileLoggingOptions Logging { get; init; } = new();

    public string GetStateDirectory() => NormalizeDirectory(
        StateDirectory,
        Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.CommonApplicationData), "EndpointManagementAgent", "state"));

    public string GetPackageCacheDirectory() => NormalizeDirectory(
        PackageCacheDirectory,
        Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.CommonApplicationData), "EndpointManagementAgent", "packages"));

    public string GetEnrollmentTokenFile() => string.IsNullOrWhiteSpace(EnrollmentTokenFile)
        ? Path.Combine(GetStateDirectory(), "enrollment.token")
        : Path.GetFullPath(Environment.ExpandEnvironmentVariables(EnrollmentTokenFile));

    public string GetLogDirectory() => NormalizeDirectory(
        Logging.Directory,
        Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.CommonApplicationData), "EndpointManagementAgent", "logs"));

    private static string NormalizeDirectory(string? configured, string fallback) =>
        Path.GetFullPath(Environment.ExpandEnvironmentVariables(string.IsNullOrWhiteSpace(configured) ? fallback : configured));
}

public sealed class ServerOptions
{
    public string BaseUrl { get; init; } = string.Empty;

    public int RequestTimeoutSeconds { get; init; } = 120;

    public bool AllowHttpForLoopbackDevelopment { get; init; }

    // Upper/lower case and colon separators are accepted. The pin is the SHA-256 certificate fingerprint.
    public string? PinnedCertificateSha256 { get; init; }
}

public sealed class InstallerOptions
{
    public int DefaultTimeoutMinutes { get; init; } = 120;

    public int MaximumTimeoutMinutes { get; init; } = 480;

    public bool KillProcessTreeOnTimeout { get; init; }

    public int MaximumDiagnosticCharacters { get; init; } = 65_536;

    public bool PreserveFailedPackages { get; init; }

    public IReadOnlyList<string>? AdditionalAllowedDetectionRoots { get; init; }
}

public sealed class AgentFileLoggingOptions
{
    public string? Directory { get; init; }

    public long MaximumFileBytes { get; init; } = 10 * 1024 * 1024;

    public int RetainedFiles { get; init; } = 14;
}
