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

    public HttpStatusCode StatusCode { get; }

    public string ErrorCode { get; }
}
