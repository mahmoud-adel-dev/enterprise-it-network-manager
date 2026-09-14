using System.Security.Cryptography;
using System.Text;
using Microsoft.Win32;

namespace EndpointManagementAgent.Domain;

public static class MachineIdentity
{
    public static Guid GetOrCreateDeviceUuid(string stateDirectory)
    {
        // 1. Check persistent agent UUID file first
        var uuidFilePath = Path.Combine(stateDirectory, "device.uuid");
        if (File.Exists(uuidFilePath))
        {
            var content = File.ReadAllText(uuidFilePath).Trim();
            if (Guid.TryParse(content, out var savedGuid))
            {
                return savedGuid;
            }
        }

        // 2. Query Windows Cryptography MachineGuid
        try
        {
            using var baseKey = RegistryKey.OpenBaseKey(RegistryHive.LocalMachine, RegistryView.Registry64);
            using var cryptoKey = baseKey.OpenSubKey(@"SOFTWARE\Microsoft\Cryptography");
            var guidStr = cryptoKey?.GetValue("MachineGuid")?.ToString()?.Trim();
            if (!string.IsNullOrEmpty(guidStr) && Guid.TryParse(guidStr, out var machineGuid))
            {
                PersistUuid(uuidFilePath, machineGuid);
                return machineGuid;
            }
        }
        catch
        {
            // fallback
        }

        // 3. Fallback: generate deterministic machine UUID based on MachineName + ProcessorCount
        var seed = $"{Environment.MachineName}-{Environment.ProcessorCount}-{Environment.OSVersion}";
        var hash = SHA256.HashData(Encoding.UTF8.GetBytes(seed));
        var generatedGuid = new Guid(hash.AsSpan(0, 16));

        PersistUuid(uuidFilePath, generatedGuid);
        return generatedGuid;
    }

    private static void PersistUuid(string path, Guid guid)
    {
        try
        {
            var dir = Path.GetDirectoryName(path);
            if (!string.IsNullOrEmpty(dir) && !Directory.Exists(dir))
            {
                Directory.CreateDirectory(dir);
            }
            File.WriteAllText(path, guid.ToString("D"));
        }
        catch
        {
            // Non-fatal if state dir is not yet writable
        }
    }
}
