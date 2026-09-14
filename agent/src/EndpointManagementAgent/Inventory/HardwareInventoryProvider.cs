using System.Management;
using System.Net.NetworkInformation;
using System.Net.Sockets;
using System.Runtime.InteropServices;
using EndpointManagementAgent.Domain;
using Microsoft.Extensions.Logging;

namespace EndpointManagementAgent.Inventory;

public sealed class HardwareInventoryProvider(ILogger<HardwareInventoryProvider> logger) : IHardwareInventoryProvider
{
    public Task<HardwareInventory> CollectInventoryAsync(CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        var hostname = Environment.MachineName;
        string? fqdn = null;
        try
        {
            fqdn = System.Net.Dns.GetHostEntry(hostname).HostName;
        }
        catch
        {
            fqdn = hostname;
        }

        string? manufacturer = null;
        string? model = null;
        string? serialNumber = null;
        long? totalMemoryBytes = null;
        string? loggedInUser = null;
        var domainStatus = "WORKGROUP";
        string? domainName = null;

        // Query Win32_ComputerSystem
        try
        {
            using var searcher = new ManagementObjectSearcher("SELECT Manufacturer, Model, TotalPhysicalMemory, UserName, PartOfDomain, Domain FROM Win32_ComputerSystem");
            foreach (var obj in searcher.Get())
            {
                using (obj)
                {
                    manufacturer = obj["Manufacturer"]?.ToString()?.Trim();
                    model = obj["Model"]?.ToString()?.Trim();
                    if (long.TryParse(obj["TotalPhysicalMemory"]?.ToString(), out var mem))
                    {
                        totalMemoryBytes = mem;
                    }

                    loggedInUser = obj["UserName"]?.ToString()?.Trim();
                    if (bool.TryParse(obj["PartOfDomain"]?.ToString(), out var partOfDomain) && partOfDomain)
                    {
                        domainStatus = "JOINED";
                        domainName = obj["Domain"]?.ToString()?.Trim();
                    }
                    else
                    {
                        domainStatus = "WORKGROUP";
                        domainName = obj["Domain"]?.ToString()?.Trim();
                    }
                }
            }
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to query Win32_ComputerSystem via WMI.");
        }

        // Query Win32_BIOS
        BiosInventory? bios = null;
        try
        {
            using var searcher = new ManagementObjectSearcher("SELECT Manufacturer, SMBIOSBIOSVersion, SerialNumber, ReleaseDate FROM Win32_BIOS");
            foreach (var obj in searcher.Get())
            {
                using (obj)
                {
                    var biosMfg = obj["Manufacturer"]?.ToString()?.Trim();
                    var biosVer = obj["SMBIOSBIOSVersion"]?.ToString()?.Trim();
                    var biosSerial = obj["SerialNumber"]?.ToString()?.Trim();
                    if (!string.IsNullOrWhiteSpace(biosSerial) && !biosSerial.Equals("To be filled by O.E.M.", StringComparison.OrdinalIgnoreCase))
                    {
                        serialNumber ??= biosSerial;
                    }

                    DateTimeOffset? releaseDate = null;
                    var dateStr = obj["ReleaseDate"]?.ToString();
                    if (!string.IsNullOrEmpty(dateStr) && dateStr.Length >= 8)
                    {
                        if (DateTime.TryParseExact(dateStr.Substring(0, 8), "yyyyMMdd", null, System.Globalization.DateTimeStyles.None, out var dt))
                        {
                            releaseDate = new DateTimeOffset(dt, TimeSpan.Zero);
                        }
                    }

                    bios = new BiosInventory(biosMfg, biosVer, biosSerial, releaseDate);
                }
            }
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to query Win32_BIOS via WMI.");
        }

        // Query Win32_Processor
        string? cpu = null;
        int? cpuCores = null;
        try
        {
            using var searcher = new ManagementObjectSearcher("SELECT Name, NumberOfCores FROM Win32_Processor");
            foreach (var obj in searcher.Get())
            {
                using (obj)
                {
                    cpu = obj["Name"]?.ToString()?.Trim();
                    if (int.TryParse(obj["NumberOfCores"]?.ToString(), out var cores))
                    {
                        cpuCores = cores;
                    }
                }
            }
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to query Win32_Processor via WMI.");
        }

        // Query Win32_OperatingSystem
        var operatingSystem = "Windows";
        var operatingSystemEdition = string.Empty;
        var osVersion = Environment.OSVersion.Version.ToString();
        var osBuild = Environment.OSVersion.Version.Build.ToString();
        var architecture = RuntimeInformation.OSArchitecture.ToString().ToLowerInvariant();
        DateTimeOffset? lastBootAt = null;

        try
        {
            using var searcher = new ManagementObjectSearcher("SELECT Caption, Version, BuildNumber, OSArchitecture, LastBootUpTime FROM Win32_OperatingSystem");
            foreach (var obj in searcher.Get())
            {
                using (obj)
                {
                    var caption = obj["Caption"]?.ToString()?.Trim();
                    if (!string.IsNullOrEmpty(caption))
                    {
                        operatingSystem = caption;
                        if (caption.Contains("Pro", StringComparison.OrdinalIgnoreCase)) operatingSystemEdition = "Pro";
                        else if (caption.Contains("Enterprise", StringComparison.OrdinalIgnoreCase)) operatingSystemEdition = "Enterprise";
                        else if (caption.Contains("Home", StringComparison.OrdinalIgnoreCase)) operatingSystemEdition = "Home";
                        else if (caption.Contains("Server", StringComparison.OrdinalIgnoreCase)) operatingSystemEdition = "Server";
                    }

                    var ver = obj["Version"]?.ToString()?.Trim();
                    if (!string.IsNullOrEmpty(ver)) osVersion = ver;

                    var bld = obj["BuildNumber"]?.ToString()?.Trim();
                    if (!string.IsNullOrEmpty(bld)) osBuild = bld;

                    var arch = obj["OSArchitecture"]?.ToString()?.Trim();
                    if (!string.IsNullOrEmpty(arch)) architecture = arch;

                    var bootStr = obj["LastBootUpTime"]?.ToString();
                    if (!string.IsNullOrEmpty(bootStr))
                    {
                        try
                        {
                            lastBootAt = ManagementDateTimeConverter.ToDateTime(bootStr);
                        }
                        catch
                        {
                            // ignore conversion failure
                        }
                    }
                }
            }
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to query Win32_OperatingSystem via WMI.");
        }

        // Calculate Disk metrics
        long? diskTotalBytes = null;
        long? diskFreeBytes = null;
        try
        {
            long total = 0;
            long free = 0;
            foreach (var drive in DriveInfo.GetDrives().Where(d => d.IsReady && d.DriveType == DriveType.Fixed))
            {
                total += drive.TotalSize;
                free += drive.AvailableFreeSpace;
            }
            diskTotalBytes = total;
            diskFreeBytes = free;
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to inspect local drive space.");
        }

        // Network Interfaces
        var networkInterfaces = CollectNetworkInterfaces();

        var osDisplayVersion = osBuild;
        var osClassification = ClassifyOs(operatingSystem, operatingSystemEdition, osBuild);

        var inventory = new HardwareInventory(
            Hostname: hostname,
            Fqdn: fqdn,
            Manufacturer: manufacturer,
            Model: model,
            SerialNumber: serialNumber,
            Bios: bios,
            Cpu: cpu,
            CpuCores: cpuCores,
            TotalMemoryBytes: totalMemoryBytes,
            DiskTotalBytes: diskTotalBytes,
            DiskFreeBytes: diskFreeBytes,
            OperatingSystem: operatingSystem,
            OperatingSystemEdition: operatingSystemEdition,
            OsVersion: osVersion,
            OsBuild: osBuild,
            OsDisplayVersion: osDisplayVersion,
            OsClassification: osClassification,
            Architecture: architecture,
            LoggedInUser: loggedInUser,
            DomainStatus: domainStatus,
            DomainName: domainName,
            LastBootAt: lastBootAt,
            NetworkInterfaces: networkInterfaces,
            CollectedAt: DateTimeOffset.UtcNow);

        return Task.FromResult(inventory);
    }

    public Task<HeartbeatRequest> CollectHeartbeatTelemetryAsync(Guid deviceId, string agentVersion, CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();

        var hostname = Environment.MachineName;
        var nics = CollectNetworkInterfaces();
        var activeIps = nics
            .Where(n => n.OperationalStatus.Equals("Up", StringComparison.OrdinalIgnoreCase))
            .SelectMany(n => n.Ipv4Addresses)
            .Distinct()
            .ToList();

        var macAddresses = nics
            .Where(n => !string.IsNullOrWhiteSpace(n.MacAddress))
            .Select(n => n.MacAddress!)
            .Distinct()
            .ToList();

        if (activeIps.Count == 0)
        {
            activeIps.Add("127.0.0.1");
        }

        if (macAddresses.Count == 0)
        {
            macAddresses.Add("00:00:00:00:00:00");
        }

        var uptimeSeconds = (long)TimeSpan.FromMilliseconds(Environment.TickCount64).TotalSeconds;

        long diskFree = 0;
        try
        {
            var systemDrive = DriveInfo.GetDrives().FirstOrDefault(d => d.IsReady && d.Name.StartsWith("C", StringComparison.OrdinalIgnoreCase))
                ?? DriveInfo.GetDrives().FirstOrDefault(d => d.IsReady && d.DriveType == DriveType.Fixed);
            if (systemDrive != null)
            {
                diskFree = systemDrive.AvailableFreeSpace;
            }
        }
        catch
        {
            // fallback
        }

        string? loggedInUser = null;
        var domainStatus = "WORKGROUP";
        string? domainName = null;
        var operatingSystem = "Windows";
        var operatingSystemEdition = "Pro";
        var osVersion = Environment.OSVersion.Version.ToString();
        var osBuild = Environment.OSVersion.Version.Build.ToString();
        var architecture = RuntimeInformation.OSArchitecture.ToString().ToLowerInvariant();

        try
        {
            using var searcher = new ManagementObjectSearcher("SELECT Caption, BuildNumber, Version FROM Win32_OperatingSystem");
            foreach (var obj in searcher.Get())
            {
                using (obj)
                {
                    operatingSystem = obj["Caption"]?.ToString()?.Trim() ?? operatingSystem;
                    osBuild = obj["BuildNumber"]?.ToString()?.Trim() ?? osBuild;
                    osVersion = obj["Version"]?.ToString()?.Trim() ?? osVersion;
                }
            }
        }
        catch
        {
            // ignore WMI fallback
        }

        try
        {
            using var searcher = new ManagementObjectSearcher("SELECT UserName, PartOfDomain, Domain FROM Win32_ComputerSystem");
            foreach (var obj in searcher.Get())
            {
                using (obj)
                {
                    loggedInUser = obj["UserName"]?.ToString()?.Trim();
                    if (bool.TryParse(obj["PartOfDomain"]?.ToString(), out var partOfDomain) && partOfDomain)
                    {
                        domainStatus = "JOINED";
                        domainName = obj["Domain"]?.ToString()?.Trim();
                    }
                    else
                    {
                        domainName = obj["Domain"]?.ToString()?.Trim();
                    }
                }
            }
        }
        catch
        {
            // ignore
        }

        var heartbeat = new HeartbeatRequest(
            DeviceId: deviceId,
            AgentVersion: agentVersion,
            Hostname: hostname,
            ActiveIpAddresses: activeIps,
            MacAddresses: macAddresses,
            OperatingSystem: operatingSystem,
            OperatingSystemEdition: operatingSystemEdition,
            OsVersion: osVersion,
            OsBuild: osBuild,
            Architecture: architecture,
            UptimeSeconds: uptimeSeconds,
            LoggedInUser: loggedInUser,
            DiskFreeBytes: diskFree,
            DomainStatus: domainStatus,
            DomainName: domainName,
            Health: "HEALTHY",
            ObservedAt: DateTimeOffset.UtcNow);

        return Task.FromResult(heartbeat);
    }

    private List<NetworkInterfaceInventory> CollectNetworkInterfaces()
    {
        var list = new List<NetworkInterfaceInventory>();
        try
        {
            foreach (var ni in NetworkInterface.GetAllNetworkInterfaces())
            {
                if (ni.NetworkInterfaceType == NetworkInterfaceType.Loopback)
                {
                    continue;
                }

                var ipProps = ni.GetIPProperties();
                var ipv4Addresses = ipProps.UnicastAddresses
                    .Where(u => u.Address.AddressFamily == AddressFamily.InterNetwork)
                    .Select(u => u.Address.ToString())
                    .ToList();

                var mac = ni.GetPhysicalAddress()?.ToString();
                if (!string.IsNullOrEmpty(mac) && mac.Length == 12)
                {
                    mac = string.Join(":", Enumerable.Range(0, 6).Select(i => mac.Substring(i * 2, 2)));
                }

                list.Add(new NetworkInterfaceInventory(
                    Id: ni.Id,
                    Name: ni.Name,
                    Description: ni.Description,
                    InterfaceType: ni.NetworkInterfaceType.ToString(),
                    OperationalStatus: ni.OperationalStatus.ToString(),
                    MacAddress: mac,
                    Ipv4Addresses: ipv4Addresses,
                    SpeedBitsPerSecond: ni.Speed));
            }
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to collect network interfaces.");
        }

        return list;
    }

    private static string ClassifyOs(string os, string edition, string build)
    {
        var combined = (os + " " + edition).ToLowerInvariant();
        if (combined.Contains("server")) return "windowsserver";
        if (int.TryParse(build, out var b) && b >= 22000) return "windows11";
        if (combined.Contains("windows 11")) return "windows11";
        if (combined.Contains("windows 10")) return "windows10";
        return "other";
    }
}
