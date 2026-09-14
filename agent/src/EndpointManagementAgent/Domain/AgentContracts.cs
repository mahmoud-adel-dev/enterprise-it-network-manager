using System.Text.Json;
using System.Text.Json.Serialization;

namespace EndpointManagementAgent.Domain;

public enum AgentJobType
{
    INSTALL_APPLICATION,
    COLLECT_INVENTORY,
    REFRESH_SOFTWARE_INVENTORY,
    ROTATE_CREDENTIAL,
}

public enum AgentJobStatus
{
    ACKNOWLEDGED,
    DOWNLOADING,
    VERIFYING_PACKAGE,
    INSTALLING,
    VERIFYING_INSTALLATION,
    SUCCESS,
    FAILED,
    REBOOT_REQUIRED,
}

public enum InstallerType
{
    MSI,
    EXE,
}

public enum DetectionType
{
    MSI_PRODUCT_CODE,
    REGISTRY_VALUE,
    INSTALLED_APPLICATION,
    FILE_VERSION,
    WINDOWS_SERVICE,
}

public enum VersionMatch
{
    ANY,
    EXACT,
    MINIMUM,
}

public sealed record AgentCredential(
    Guid AgentId,
    Guid DeviceId,
    string AccessToken,
    Uri ServerUri,
    DateTimeOffset IssuedAt,
    DateTimeOffset? ExpiresAt);

public sealed record EnrollmentRequest(
    Guid DeviceUuid,
    string Hostname,
    string? Fqdn,
    string AgentVersion,
    string OperatingSystem,
    string OsBuild,
    string Architecture,
    string? SerialNumber,
    IReadOnlyList<NetworkInterfaceInventory> NetworkInterfaces);

public sealed record EnrollmentResponse(
    Guid AgentId,
    Guid DeviceId,
    string AccessToken,
    DateTimeOffset? ExpiresAt,
    int? HeartbeatIntervalSeconds);

public sealed record CredentialRotationResponse(string AccessToken, DateTimeOffset? ExpiresAt);

public sealed record HeartbeatRequest(
    Guid DeviceId,
    string AgentVersion,
    string Hostname,
    IReadOnlyList<string> ActiveIpAddresses,
    IReadOnlyList<string> MacAddresses,
    string OperatingSystem,
    string OperatingSystemEdition,
    string OsVersion,
    string OsBuild,
    string Architecture,
    long UptimeSeconds,
    string? LoggedInUser,
    long DiskFreeBytes,
    string DomainStatus,
    string? DomainName,
    string Health,
    DateTimeOffset ObservedAt);

public sealed record HeartbeatResponse(bool Ok, bool Quarantined);

public sealed record HardwareInventory(
    string Hostname,
    string? Fqdn,
    string? Manufacturer,
    string? Model,
    string? SerialNumber,
    BiosInventory? Bios,
    string? Cpu,
    int? CpuCores,
    long? TotalMemoryBytes,
    long? DiskTotalBytes,
    long? DiskFreeBytes,
    string OperatingSystem,
    string OperatingSystemEdition,
    string OsVersion,
    string OsBuild,
    string OsDisplayVersion,
    string OsClassification,
    string Architecture,
    string? LoggedInUser,
    string DomainStatus,
    string? DomainName,
    DateTimeOffset? LastBootAt,
    IReadOnlyList<NetworkInterfaceInventory> NetworkInterfaces,
    DateTimeOffset CollectedAt);

public sealed record BiosInventory(string? Manufacturer, string? Version, string? SerialNumber, DateTimeOffset? ReleaseDate);

public sealed record NetworkInterfaceInventory(
    string Id,
    string Name,
    string Description,
    string InterfaceType,
    string OperationalStatus,
    string? MacAddress,
    IReadOnlyList<string> Ipv4Addresses,
    long SpeedBitsPerSecond);

public sealed record SoftwareInventoryItem(
    string NormalizedId,
    string Name,
    string? Publisher,
    string? Version,
    string Architecture,
    string? InstallLocation,
    string? ProductCode,
    DateTimeOffset DetectedAt);

public sealed record HardwareInventoryRequest(Guid DeviceId, string AgentVersion, HardwareInventory Inventory);

public sealed record SoftwareInventoryRequest(Guid DeviceId, string AgentVersion, IReadOnlyList<SoftwareInventoryItem> Applications, DateTimeOffset CollectedAt);

public sealed record AgentJob(
    Guid Id,
    AgentJobType Type,
    string LeaseToken,
    DateTimeOffset LeaseExpiresAt,
    JsonElement Payload);

public sealed record JobStatusRequest(
    string LeaseToken,
    AgentJobStatus Status,
    DateTimeOffset ObservedAt,
    int? ExitCode = null,
    string? ErrorCode = null,
    string? ErrorMessage = null,
    bool RebootRequired = false,
    string? Diagnostics = null);

public sealed record InstallApplicationPayload(
    Guid PackageId,
    string FileName,
    InstallerType InstallerType,
    string Sha256,
    long FileSize,
    IReadOnlyList<string> InstallerArguments,
    DetectionRule DetectionRule,
    IReadOnlyList<int>? SuccessExitCodes,
    int? TimeoutMinutes,
    bool AllowKillOnTimeout = false);

public sealed record DetectionRule(
    DetectionType Type,
    VersionMatch VersionMatch = VersionMatch.ANY,
    string? ExpectedVersion = null,
    string? MsiProductCode = null,
    string? RegistryHive = null,
    string? RegistryView = null,
    string? RegistryPath = null,
    string? RegistryValueName = null,
    string? ExpectedValue = null,
    string? ApplicationName = null,
    string? ApplicationPublisher = null,
    string? FilePath = null,
    string? ServiceName = null);

public sealed record DetectionResult(bool IsDetected, string? DetectedVersion, string? Evidence);

public sealed record PackageDownloadResult(string FilePath, long Size, string Sha256);

public sealed record InstallerExecutionResult(
    bool Started,
    bool TimedOut,
    int? ExitCode,
    bool RebootRequired,
    string Diagnostics,
    string? ErrorCode,
    string? ErrorMessage);

public sealed record ApiError(string Code, string Message);
