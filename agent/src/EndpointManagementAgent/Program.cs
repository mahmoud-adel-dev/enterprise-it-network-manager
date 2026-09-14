using System.Net.Security;
using System.Security.Cryptography;
using System.Security.Cryptography.X509Certificates;
using EndpointManagementAgent;
using EndpointManagementAgent.Api;
using EndpointManagementAgent.Configuration;
using EndpointManagementAgent.Inventory;
using EndpointManagementAgent.Jobs;
using EndpointManagementAgent.Security;
using EndpointManagementAgent.Software;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

var builder = Host.CreateApplicationBuilder(args);

// 1. Windows Service Integration
builder.Services.AddWindowsService(options =>
{
    options.ServiceName = "EndpointManagementAgent";
});

// 2. Configuration & Validation
builder.Services.AddOptions<AgentOptions>()
    .Bind(builder.Configuration.GetSection(AgentOptions.SectionName));
builder.Services.AddSingleton<IValidateOptions<AgentOptions>, AgentOptionsValidator>();

// 3. Core Services
builder.Services.AddSingleton<ICredentialStore, DpapiCredentialStore>();
builder.Services.AddSingleton<IHardwareInventoryProvider, HardwareInventoryProvider>();
builder.Services.AddSingleton<ISoftwareInventoryProvider, SoftwareInventoryProvider>();
builder.Services.AddSingleton<IPackageDownloadManager, PackageDownloadManager>();
builder.Services.AddSingleton<IPackageVerifier, PackageVerifier>();
builder.Services.AddSingleton<IInstallerEngine, InstallerEngine>();
builder.Services.AddSingleton<IDetectionRuleEvaluator, DetectionRuleEvaluator>();
builder.Services.AddSingleton<IFirewallIsolationManager, FirewallIsolationManager>();
builder.Services.AddSingleton<IJobExecutor, JobExecutor>();

// 4. API Client & HTTP Configuration
builder.Services.AddTransient<AgentAuthenticationHandler>();

builder.Services.AddHttpClient(AgentApiClient.HttpClientName, (sp, client) =>
{
    var options = sp.GetRequiredService<IOptions<AgentOptions>>().Value;
    if (Uri.TryCreate(options.Server.BaseUrl, UriKind.Absolute, out var baseUri))
    {
        client.BaseAddress = baseUri;
    }
    client.Timeout = TimeSpan.FromSeconds(options.Server.RequestTimeoutSeconds);
    client.DefaultRequestHeaders.Add("User-Agent", $"EndpointManagementAgent/{Worker.AgentVersion} (Windows)");
})
.AddHttpMessageHandler<AgentAuthenticationHandler>()
.ConfigurePrimaryHttpMessageHandler(sp =>
{
    var options = sp.GetRequiredService<IOptions<AgentOptions>>().Value;
    var handler = new SocketsHttpHandler
    {
        PooledConnectionLifetime = TimeSpan.FromMinutes(15),
        PooledConnectionIdleTimeout = TimeSpan.FromMinutes(2),
    };

    if (!string.IsNullOrWhiteSpace(options.Server.PinnedCertificateSha256))
    {
        var expectedPin = AgentOptionsValidator.NormalizeHex(options.Server.PinnedCertificateSha256);
        handler.SslOptions.RemoteCertificateValidationCallback = (sender, cert, chain, errors) =>
        {
            if (cert is null) return false;
            var certHash = cert.GetCertHash(HashAlgorithmName.SHA256);
            var actualPin = Convert.ToHexString(certHash);
            return string.Equals(expectedPin, actualPin, StringComparison.OrdinalIgnoreCase);
        };
    }

    return handler;
});

builder.Services.AddSingleton<IAgentApiClient, AgentApiClient>();

// 5. Hosted Worker
builder.Services.AddHostedService<Worker>();

// 6. Logging
builder.Logging.ClearProviders();
builder.Logging.AddConsole();
builder.Logging.AddDebug();

try
{
    if (OperatingSystem.IsWindows())
    {
        builder.Logging.AddEventLog(settings =>
        {
            settings.SourceName = "EndpointManagementAgent";
            settings.LogName = "Application";
        });
    }
}
catch
{
    // Fallback if event log source registration requires elevation
}

var host = builder.Build();
host.Run();
