using System.Net;

namespace EndpointManagementAgent.Api;

public sealed class ManagementApiException : Exception
{
    public ManagementApiException(HttpStatusCode statusCode, string errorCode, string message)
        : base(message)
    {
        StatusCode = statusCode;
        ErrorCode = errorCode;
    }

    public ManagementApiException(HttpStatusCode statusCode, string errorCode, string message, Exception innerException)
        : base(message, innerException)
    {
        StatusCode = statusCode;
        ErrorCode = errorCode;
    }

    public HttpStatusCode StatusCode { get; }

    public string ErrorCode { get; }

    public override string ToString() =>
        $"ManagementApiException: HTTP {(int)StatusCode} [{ErrorCode}] {Message}";
}
