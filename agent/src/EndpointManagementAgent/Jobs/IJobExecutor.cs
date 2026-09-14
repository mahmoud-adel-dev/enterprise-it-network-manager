using EndpointManagementAgent.Domain;

namespace EndpointManagementAgent.Jobs;

public interface IJobExecutor
{
    Task ExecuteJobAsync(AgentJob job, CancellationToken cancellationToken);
}
