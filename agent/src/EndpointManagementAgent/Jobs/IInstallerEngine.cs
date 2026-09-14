using EndpointManagementAgent.Domain;

namespace EndpointManagementAgent.Jobs;

public interface IInstallerEngine
{
    Task<InstallerExecutionResult> ExecuteAsync(
        string installerFilePath,
        InstallerType installerType,
        IReadOnlyList<string> customArguments,
        IReadOnlyList<int>? successExitCodes,
        int timeoutMinutes,
        bool allowKillOnTimeout,
        CancellationToken cancellationToken = default);
}
