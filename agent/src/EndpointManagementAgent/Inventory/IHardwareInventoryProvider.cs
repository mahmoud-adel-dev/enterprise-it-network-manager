using EndpointManagementAgent.Domain;

namespace EndpointManagementAgent.Inventory;

public interface IHardwareInventoryProvider
{
    Task<HardwareInventory> CollectInventoryAsync(CancellationToken cancellationToken = default);
    Task<HeartbeatRequest> CollectHeartbeatTelemetryAsync(Guid deviceId, string agentVersion, CancellationToken cancellationToken = default);
}
