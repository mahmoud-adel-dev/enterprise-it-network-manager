using System.Diagnostics;
using System.Net;
using EndpointManagementAgent.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace EndpointManagementAgent.Security;

public sealed class FirewallIsolationManager(
    IOptions<AgentOptions> options,
    ILogger<FirewallIsolationManager> logger) : IFirewallIsolationManager
{
    private const string RulePrefix = "EnterpriseQuarantine-";
    private readonly SemaphoreSlim _lock = new(1, 1);
    private bool _isQuarantined;

    public bool IsQuarantined => _isQuarantined;

    public async Task ApplyIsolationAsync(CancellationToken cancellationToken = default)
    {
        await _lock.WaitAsync(cancellationToken).ConfigureAwait(false);
        try
        {
            if (_isQuarantined)
            {
                logger.LogInformation("Endpoint is already quarantined. Ensuring isolation firewall rules are active.");
                return;
            }

            logger.LogWarning("ACTIVATING NETWORK ISOLATION / QUARANTINE ON ENDPOINT.");

            // 1. Resolve management server IP address to ensure communication is preserved
            var serverHost = GetServerHost();
            var serverIps = await ResolveHostIpsAsync(serverHost, cancellationToken).ConfigureAwait(false);
            var serverRemoteIpArg = serverIps.Count > 0 ? string.Join(",", serverIps) : "any";

            var serverPort = GetServerPort();

            // 2. Clean any stale quarantine rules first
            await RemoveAllQuarantineRulesAsync().ConfigureAwait(false);

            // 3. Add explicit allow rules for Management Server
            await RunNetshAsync($"advfirewall firewall add rule name=\"{RulePrefix}Allow-Server-Out\" dir=out action=allow protocol=TCP remoteip={serverRemoteIpArg} remoteport={serverPort}").ConfigureAwait(false);
            await RunNetshAsync($"advfirewall firewall add rule name=\"{RulePrefix}Allow-Server-In\" dir=in action=allow protocol=TCP remoteip={serverRemoteIpArg}").ConfigureAwait(false);

            // 4. Add explicit allow rules for Loopback
            await RunNetshAsync($"advfirewall firewall add rule name=\"{RulePrefix}Allow-Loopback-In\" dir=in action=allow remoteip=127.0.0.1,::1").ConfigureAwait(false);
            await RunNetshAsync($"advfirewall firewall add rule name=\"{RulePrefix}Allow-Loopback-Out\" dir=out action=allow remoteip=127.0.0.1,::1").ConfigureAwait(false);

            // 5. Add allow rule for DNS and DHCP so IP lease and host resolution remain active
            await RunNetshAsync($"advfirewall firewall add rule name=\"{RulePrefix}Allow-DNS-Out\" dir=out action=allow protocol=UDP remoteport=53").ConfigureAwait(false);
            await RunNetshAsync($"advfirewall firewall add rule name=\"{RulePrefix}Allow-DHCP-Out\" dir=out action=allow protocol=UDP remoteport=67,68").ConfigureAwait(false);

            // 6. Block general inbound and outbound traffic
            await RunNetshAsync($"advfirewall firewall add rule name=\"{RulePrefix}Block-In\" dir=in action=block").ConfigureAwait(false);
            await RunNetshAsync($"advfirewall firewall add rule name=\"{RulePrefix}Block-Out\" dir=out action=block").ConfigureAwait(false);

            _isQuarantined = true;
            logger.LogInformation("Network isolation active. Only management server traffic ({Host}:{Port}) is allowed.", serverHost, serverPort);
        }
        finally
        {
            _lock.Release();
        }
    }

    public async Task RestoreNetworkAsync(CancellationToken cancellationToken = default)
    {
        await _lock.WaitAsync(cancellationToken).ConfigureAwait(false);
        try
        {
            logger.LogInformation("RESTORING NORMAL NETWORK ACCESS. Removing quarantine firewall rules.");

            await RemoveAllQuarantineRulesAsync().ConfigureAwait(false);

            _isQuarantined = false;
            logger.LogInformation("Network restored. All quarantine firewall rules removed.");
        }
        finally
        {
            _lock.Release();
        }
    }

    private async Task RemoveAllQuarantineRulesAsync()
    {
        var rules = new[]
        {
            $"{RulePrefix}Block-In",
            $"{RulePrefix}Block-Out",
            $"{RulePrefix}Allow-Server-Out",
            $"{RulePrefix}Allow-Server-In",
            $"{RulePrefix}Allow-Loopback-In",
            $"{RulePrefix}Allow-Loopback-Out",
            $"{RulePrefix}Allow-DNS-Out",
            $"{RulePrefix}Allow-DHCP-Out",
        };

        foreach (var rule in rules)
        {
            await RunNetshAsync($"advfirewall firewall delete rule name=\"{rule}\"").ConfigureAwait(false);
        }
    }

    private static async Task<int> RunNetshAsync(string arguments)
    {
        try
        {
            var startInfo = new ProcessStartInfo
            {
                FileName = "netsh.exe",
                Arguments = arguments,
                UseShellExecute = false,
                CreateNoWindow = true,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
            };

            using var proc = Process.Start(startInfo);
            if (proc == null) return -1;

            await proc.WaitForExitAsync().ConfigureAwait(false);
            return proc.ExitCode;
        }
        catch
        {
            return -1;
        }
    }

    private string GetServerHost()
    {
        if (Uri.TryCreate(options.Value.Server.BaseUrl, UriKind.Absolute, out var uri))
        {
            return uri.Host;
        }
        return "127.0.0.1";
    }

    private int GetServerPort()
    {
        if (Uri.TryCreate(options.Value.Server.BaseUrl, UriKind.Absolute, out var uri))
        {
            return uri.Port > 0 ? uri.Port : (uri.Scheme == "https" ? 443 : 80);
        }
        return 3000;
    }

    private static async Task<List<string>> ResolveHostIpsAsync(string host, CancellationToken cancellationToken)
    {
        var list = new List<string>();
        if (IPAddress.TryParse(host, out var ip))
        {
            list.Add(ip.ToString());
            return list;
        }

        try
        {
            var entries = await Dns.GetHostAddressesAsync(host, cancellationToken).ConfigureAwait(false);
            list.AddRange(entries.Select(e => e.ToString()));
        }
        catch
        {
            // fallback if DNS fails during resolution
            list.Add(host);
        }

        return list;
    }
}
