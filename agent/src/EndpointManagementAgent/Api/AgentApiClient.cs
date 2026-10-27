using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using EndpointManagementAgent.Domain;

namespace EndpointManagementAgent.Api;

public interface IAgentApiClient
{
    Task<EnrollmentResponse> EnrollAsync(string enrollmentToken, EnrollmentRequest request, CancellationToken cancellationToken);

    Task<HeartbeatResponse> SendHeartbeatAsync(HeartbeatRequest request, CancellationToken cancellationToken);

    Task SendHardwareInventoryAsync(HardwareInventoryRequest request, CancellationToken cancellationToken);

    Task SendSoftwareInventoryAsync(SoftwareInventoryRequest request, CancellationToken cancellationToken);

    Task<IReadOnlyList<AgentJob>> PollJobsAsync(int maximumJobs, CancellationToken cancellationToken);

    Task ReportJobStatusAsync(Guid jobId, JobStatusRequest request, CancellationToken cancellationToken);

    Task<CredentialRotationResponse> RotateCredentialAsync(CancellationToken cancellationToken);
}

public sealed class AgentApiClient(IHttpClientFactory httpClientFactory) : IAgentApiClient
{
    public const string HttpClientName = "EndpointManagementApi";
    internal static readonly JsonSerializerOptions SerializerOptions = CreateSerializerOptions();

    private static void AttachRequestId(HttpRequestMessage message)
    {
        message.Headers.TryAddWithoutValidation("X-Request-Id", Guid.NewGuid().ToString("N"));
    }

    public async Task<EnrollmentResponse> EnrollAsync(string enrollmentToken, EnrollmentRequest request, CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(enrollmentToken);
        ArgumentNullException.ThrowIfNull(request);

        using var message = new HttpRequestMessage(HttpMethod.Post, "api/v1/agent/enroll")
        {
            Content = JsonContent.Create(request, options: SerializerOptions),
        };
        message.Headers.TryAddWithoutValidation("X-Enrollment-Token", enrollmentToken);
        AttachRequestId(message);

        using var response = await Client.SendAsync(message, HttpCompletionOption.ResponseHeadersRead, cancellationToken).ConfigureAwait(false);
        return await ReadRequiredJsonAsync<EnrollmentResponse>(response, cancellationToken).ConfigureAwait(false);
    }

    public async Task<HeartbeatResponse> SendHeartbeatAsync(HeartbeatRequest request, CancellationToken cancellationToken)
    {
        using var message = new HttpRequestMessage(HttpMethod.Post, "api/v1/agent/heartbeat")
        {
            Content = JsonContent.Create(request, options: SerializerOptions),
        };
        AttachRequestId(message);
        using var response = await Client.SendAsync(message, HttpCompletionOption.ResponseHeadersRead, cancellationToken).ConfigureAwait(false);
        return await ReadRequiredJsonAsync<HeartbeatResponse>(response, cancellationToken).ConfigureAwait(false);
    }

    public Task SendHardwareInventoryAsync(HardwareInventoryRequest request, CancellationToken cancellationToken) =>
        SendJsonWithoutResponseAsync(HttpMethod.Post, "api/v1/agent/inventory", request, cancellationToken);

    public Task SendSoftwareInventoryAsync(SoftwareInventoryRequest request, CancellationToken cancellationToken) =>
        SendJsonWithoutResponseAsync(HttpMethod.Post, "api/v1/agent/software", request, cancellationToken);

    public async Task<IReadOnlyList<AgentJob>> PollJobsAsync(int maximumJobs, CancellationToken cancellationToken)
    {
        if (maximumJobs is < 1 or > 10)
        {
            throw new ArgumentOutOfRangeException(nameof(maximumJobs));
        }

        using var request = new HttpRequestMessage(HttpMethod.Get, $"api/v1/agent/jobs?limit={maximumJobs}");
        AttachRequestId(request);
        using var response = await Client.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, cancellationToken).ConfigureAwait(false);
        var envelope = await ReadRequiredJsonAsync<AgentJobsResponse>(response, cancellationToken).ConfigureAwait(false);
        return envelope.Jobs;
    }

    public Task ReportJobStatusAsync(Guid jobId, JobStatusRequest request, CancellationToken cancellationToken)
    {
        if (jobId == Guid.Empty)
        {
            throw new ArgumentException("A non-empty job ID is required.", nameof(jobId));
        }

        return SendJsonWithoutResponseAsync(HttpMethod.Post, $"api/v1/agent/jobs/{jobId:D}/status", request, cancellationToken);
    }

    public async Task<CredentialRotationResponse> RotateCredentialAsync(CancellationToken cancellationToken)
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, "api/v1/agent/credentials/rotate")
        {
            Content = JsonContent.Create(new { }, options: SerializerOptions),
        };
        AttachRequestId(request);
        using var response = await Client.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, cancellationToken).ConfigureAwait(false);
        return await ReadRequiredJsonAsync<CredentialRotationResponse>(response, cancellationToken).ConfigureAwait(false);
    }

    private HttpClient Client => httpClientFactory.CreateClient(HttpClientName);

    private async Task SendJsonWithoutResponseAsync<T>(HttpMethod method, string relativeUri, T body, CancellationToken cancellationToken)
    {
        using var request = new HttpRequestMessage(method, relativeUri)
        {
            Content = JsonContent.Create(body, options: SerializerOptions),
        };
        AttachRequestId(request);
        using var response = await Client.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, cancellationToken).ConfigureAwait(false);
        if (!response.IsSuccessStatusCode)
        {
            throw await CreateExceptionAsync(response, cancellationToken).ConfigureAwait(false);
        }
    }

    internal static async Task<T> ReadRequiredJsonAsync<T>(HttpResponseMessage response, CancellationToken cancellationToken)
    {
        if (!response.IsSuccessStatusCode)
        {
            throw await CreateExceptionAsync(response, cancellationToken).ConfigureAwait(false);
        }

        var result = await response.Content.ReadFromJsonAsync<T>(SerializerOptions, cancellationToken).ConfigureAwait(false);
        return result ?? throw new ManagementApiException(response.StatusCode, "INVALID_SERVER_RESPONSE", "The management server returned an empty response.");
    }

    internal static async Task<ManagementApiException> CreateExceptionAsync(HttpResponseMessage response, CancellationToken cancellationToken)
    {
        const int maximumErrorBytes = 8_192;
        try
        {
            await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken).ConfigureAwait(false);
            var buffer = new byte[maximumErrorBytes];
            var bytesRead = await stream.ReadAsync(buffer, cancellationToken).ConfigureAwait(false);
            var error = JsonSerializer.Deserialize<ApiError>(buffer.AsSpan(0, bytesRead), SerializerOptions);
            if (error is not null && !string.IsNullOrWhiteSpace(error.Code))
            {
                return new ManagementApiException(response.StatusCode, error.Code, SanitizeServerMessage(error.Message));
            }
        }
        catch (JsonException)
        {
            // Fall through to the stable generic error below.
        }

        return new ManagementApiException(
            response.StatusCode,
            $"HTTP_{(int)response.StatusCode}",
            $"The management server rejected the request with HTTP {(int)response.StatusCode} ({response.StatusCode}).");
    }

    private static string SanitizeServerMessage(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            return "The management server rejected the request.";
        }

        var builder = new StringBuilder(Math.Min(value.Length, 1_024));
        foreach (var character in value.Take(1_024))
        {
            builder.Append(char.IsControl(character) ? ' ' : character);
        }

        return builder.ToString();
    }

    private static JsonSerializerOptions CreateSerializerOptions()
    {
        var options = new JsonSerializerOptions(JsonSerializerDefaults.Web)
        {
            PropertyNameCaseInsensitive = true,
            UnmappedMemberHandling = JsonUnmappedMemberHandling.Skip,
        };
        options.Converters.Add(new JsonStringEnumConverter());
        return options;
    }

    private sealed record AgentJobsResponse(IReadOnlyList<AgentJob> Jobs);
}
