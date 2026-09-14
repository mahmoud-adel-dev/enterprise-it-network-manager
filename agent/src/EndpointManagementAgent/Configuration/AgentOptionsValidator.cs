using System.Net;
using System.Security.Cryptography;
using Microsoft.Extensions.Options;

namespace EndpointManagementAgent.Configuration;

public sealed class AgentOptionsValidator : IValidateOptions<AgentOptions>
{
    public ValidateOptionsResult Validate(string? name, AgentOptions options)
    {
        ArgumentNullException.ThrowIfNull(options);
        var failures = new List<string>();

        if (!Uri.TryCreate(options.Server.BaseUrl, UriKind.Absolute, out var serverUri))
        {
            failures.Add("Agent:Server:BaseUrl must be an absolute URI.");
        }
        else
        {
            if (!string.IsNullOrEmpty(serverUri.UserInfo) || !string.IsNullOrEmpty(serverUri.Query) || !string.IsNullOrEmpty(serverUri.Fragment))
            {
                failures.Add("Agent:Server:BaseUrl must not contain credentials, query parameters, or a fragment.");
            }

            if (!string.Equals(serverUri.Scheme, Uri.UriSchemeHttps, StringComparison.OrdinalIgnoreCase))
            {
                var loopback = IsLoopback(serverUri.Host);
                if (!(options.Server.AllowHttpForLoopbackDevelopment && loopback && serverUri.Scheme == Uri.UriSchemeHttp))
                {
                    failures.Add("The management server must use HTTPS. HTTP is permitted only for an explicitly enabled loopback development endpoint.");
                }
            }
        }

        ValidateRange(options.Server.RequestTimeoutSeconds, 10, 600, "Agent:Server:RequestTimeoutSeconds", failures);
        ValidateRange(options.HeartbeatIntervalSeconds, 15, 3_600, "Agent:HeartbeatIntervalSeconds", failures);
        ValidateRange(options.InventoryIntervalMinutes, 5, 10_080, "Agent:InventoryIntervalMinutes", failures);
        ValidateRange(options.SoftwareInventoryIntervalMinutes, 5, 10_080, "Agent:SoftwareInventoryIntervalMinutes", failures);
        ValidateRange(options.JobPollIntervalSeconds, 5, 3_600, "Agent:JobPollIntervalSeconds", failures);
        ValidateRange(options.EnrollmentRetrySeconds, 15, 3_600, "Agent:EnrollmentRetrySeconds", failures);
        ValidateRange(options.Installer.DefaultTimeoutMinutes, 1, options.Installer.MaximumTimeoutMinutes, "Agent:Installer:DefaultTimeoutMinutes", failures);
        ValidateRange(options.Installer.MaximumTimeoutMinutes, 1, 1_440, "Agent:Installer:MaximumTimeoutMinutes", failures);
        ValidateRange(options.Installer.MaximumDiagnosticCharacters, 1_024, 1_048_576, "Agent:Installer:MaximumDiagnosticCharacters", failures);

        if (options.MaxPackageBytes < 1_048_576 || options.MaxPackageBytes > 20L * 1024 * 1024 * 1024)
        {
            failures.Add("Agent:MaxPackageBytes must be between 1 MiB and 20 GiB.");
        }

        if (options.AllowedJobTypes.Count == 0)
        {
            failures.Add("Agent:AllowedJobTypes must contain at least one typed job.");
        }

        if (options.AllowedJobTypes.Distinct().Count() != options.AllowedJobTypes.Count)
        {
            failures.Add("Agent:AllowedJobTypes must not contain duplicates.");
        }

        if (!string.IsNullOrWhiteSpace(options.Server.PinnedCertificateSha256))
        {
            try
            {
                var pin = Convert.FromHexString(NormalizeHex(options.Server.PinnedCertificateSha256));
                if (pin.Length != SHA256.HashSizeInBytes)
                {
                    failures.Add("Agent:Server:PinnedCertificateSha256 must be a 32-byte SHA-256 fingerprint.");
                }
            }
            catch (FormatException)
            {
                failures.Add("Agent:Server:PinnedCertificateSha256 must contain hexadecimal characters only.");
            }
        }

        ValidateRootedPath(options.StateDirectory, "Agent:StateDirectory", failures);
        ValidateRootedPath(options.PackageCacheDirectory, "Agent:PackageCacheDirectory", failures);
        ValidateRootedPath(options.EnrollmentTokenFile, "Agent:EnrollmentTokenFile", failures);

        return failures.Count == 0 ? ValidateOptionsResult.Success : ValidateOptionsResult.Fail(failures);
    }

    internal static string NormalizeHex(string value) => value.Replace(":", string.Empty, StringComparison.Ordinal).Replace(" ", string.Empty, StringComparison.Ordinal);

    private static void ValidateRange(int value, int minimum, int maximum, string path, ICollection<string> failures)
    {
        if (value < minimum || value > maximum)
        {
            failures.Add($"{path} must be between {minimum} and {maximum}.");
        }
    }

    private static void ValidateRootedPath(string? value, string path, ICollection<string> failures)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return;
        }

        var expanded = Environment.ExpandEnvironmentVariables(value);
        if (!Path.IsPathFullyQualified(expanded))
        {
            failures.Add($"{path} must be an absolute path when configured.");
        }
    }

    private static bool IsLoopback(string host)
    {
        if (string.Equals(host, "localhost", StringComparison.OrdinalIgnoreCase))
        {
            return true;
        }

        return IPAddress.TryParse(host, out var address) && IPAddress.IsLoopback(address);
    }
}
