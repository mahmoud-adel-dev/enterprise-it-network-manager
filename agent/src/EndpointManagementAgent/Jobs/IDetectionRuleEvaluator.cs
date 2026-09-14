using EndpointManagementAgent.Domain;

namespace EndpointManagementAgent.Jobs;

public interface IDetectionRuleEvaluator
{
    Task<DetectionResult> EvaluateAsync(DetectionRule rule, CancellationToken cancellationToken = default);
}
