'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { GitBranch, Network, Server, Monitor, Router as RouterIcon, Info, ArrowRight, ShieldCheck } from 'lucide-react';

interface NetworkDeviceItem {
  id: string;
  hostname: string | null;
  managementIp: string;
  deviceType: string;
  manufacturer: string | null;
  model: string | null;
  status: string;
}

interface NetworkLinkItem {
  id: string;
  sourceDevice: { id: string; hostname: string | null; ip: string };
  sourceInterface: string | null;
  destinationDevice: { id: string; hostname: string | null; ip: string } | null;
  destinationHostname: string | null;
  destinationInterface: string | null;
  protocol: string;
  confidence: string;
}

interface ConnectedEndpoint {
  id: string;
  hostname: string;
  ipAddress: string | null;
  operatingSystem: string | null;
  onlineStatus: string;
  switchId: string | null;
}

interface TopologyViewProps {
  devices: NetworkDeviceItem[];
  links: NetworkLinkItem[];
  endpoints: ConnectedEndpoint[];
}

export function TopologyView({ devices, links, endpoints }: TopologyViewProps) {
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(devices[0]?.id || null);

  const selectedDevice = devices.find((d) => d.id === selectedDeviceId);
  const selectedDeviceLinks = links.filter(
    (l) => l.sourceDevice.id === selectedDeviceId || l.destinationDevice?.id === selectedDeviceId
  );
  const attachedEndpoints = endpoints.filter((e) => e.switchId === selectedDeviceId);

  if (devices.length === 0 && endpoints.length === 0) {
    return (
      <div className="border rounded-xl p-16 text-center text-muted-foreground bg-muted/10">
        <GitBranch className="size-12 mx-auto mb-3 opacity-30" />
        <p className="font-medium text-lg text-foreground">No topology data available</p>
        <p className="text-sm mt-1">Register infrastructure switches and routers to render the network topology map.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Transparency / Fidelity Notice */}
      <div className="border border-border/80 rounded-xl p-4 bg-muted/20 flex items-start gap-3">
        <Info className="size-5 text-blue-500 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <p className="font-semibold text-foreground">Topology Mapping & Data Grounding</p>
          <p className="text-muted-foreground leading-relaxed">
            Topology is derived from verified LLDP/CDP neighbor tables and MAC forwarding records.
            Unlinked endpoints are displayed in the edge pool until switch port correlation is established via SNMP bridge MIBs or agent network telemetry.
          </p>
        </div>
      </div>

      {/* Visual Hierarchy Diagram */}
      <div className="border border-border rounded-xl p-6 bg-card space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-base flex items-center gap-2">
            <GitBranch className="size-4 text-primary" />
            Infrastructure Topology Diagram
          </h3>
          <span className="text-xs text-muted-foreground">
            {devices.length} Infrastructure Nodes • {links.length} Inter-Device Links • {endpoints.length} Total Endpoints
          </span>
        </div>

        {/* Node selector cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {devices.map((dev) => {
            const isSelected = selectedDeviceId === dev.id;
            const isSwitch = dev.deviceType === 'SWITCH';
            const isRouter = dev.deviceType === 'ROUTER';

            return (
              <div
                key={dev.id}
                onClick={() => setSelectedDeviceId(dev.id)}
                className={`border rounded-xl p-4 cursor-pointer transition-all ${
                  isSelected
                    ? 'border-primary bg-primary/5 shadow-xs'
                    : 'border-border hover:border-border/80 hover:bg-muted/10'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-muted/50">
                      {isRouter ? (
                        <RouterIcon className="size-4 text-indigo-500" />
                      ) : (
                        <Network className="size-4 text-blue-500" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-foreground truncate max-w-[120px]">
                        {dev.hostname || dev.managementIp}
                      </h4>
                      <p className="text-[11px] font-mono text-muted-foreground">{dev.managementIp}</p>
                    </div>
                  </div>
                  <Badge variant={dev.status === 'ONLINE' ? 'success' : 'secondary'} className="text-[9px]">
                    {dev.deviceType}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Node Details & Neighbor Connections */}
        {selectedDevice && (
          <div className="border-t border-border pt-6 mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Device Info & Inter-switch Links */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm flex items-center gap-2 text-foreground">
                <Server className="size-4 text-primary" />
                Selected Node: {selectedDevice.hostname || selectedDevice.managementIp}
              </h4>

              <div className="bg-muted/20 border border-border rounded-lg p-3 text-xs space-y-1.5 font-mono">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Management IP:</span>
                  <span className="font-semibold text-foreground">{selectedDevice.managementIp}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type:</span>
                  <span className="text-foreground">{selectedDevice.deviceType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Hardware:</span>
                  <span className="text-foreground">{selectedDevice.manufacturer || ''} {selectedDevice.model || 'Generic Appliance'}</span>
                </div>
              </div>

              <div>
                <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Uplink & Inter-Switch Links ({selectedDeviceLinks.length})
                </h5>
                {selectedDeviceLinks.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">
                    No verified inter-device links recorded for this appliance.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {selectedDeviceLinks.map((link) => (
                      <div
                        key={link.id}
                        className="border border-border rounded-lg p-2.5 bg-muted/10 text-xs flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">
                            {link.sourceDevice.hostname || link.sourceDevice.ip}
                          </span>
                          <span className="font-mono text-[10px] text-muted-foreground">
                            ({link.sourceInterface || 'Trunk'})
                          </span>
                          <ArrowRight className="size-3 text-muted-foreground" />
                          <span className="font-medium text-foreground">
                            {link.destinationDevice?.hostname || link.destinationHostname || 'Remote Device'}
                          </span>
                          <span className="font-mono text-[10px] text-muted-foreground">
                            ({link.destinationInterface || 'Port'})
                          </span>
                        </div>
                        <Badge variant="outline" className="text-[9px] font-mono">
                          {link.protocol} ({link.confidence})
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Attached Endpoints */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm flex items-center justify-between text-foreground">
                <span className="flex items-center gap-2">
                  <Monitor className="size-4 text-primary" />
                  Correlated Endpoints ({attachedEndpoints.length})
                </span>
                <Badge variant="outline" className="text-[10px]">
                  Switch Port Pool
                </Badge>
              </h4>

              <div className="border border-border rounded-lg max-h-72 overflow-y-auto divide-y divide-border bg-card">
                {attachedEndpoints.length === 0 ? (
                  <div className="p-8 text-center text-xs text-muted-foreground space-y-1">
                    <p>No endpoints directly linked to this switch port table yet.</p>
                    <p className="text-[11px]">Endpoints appear here once MAC bridge forwarding records are polled.</p>
                  </div>
                ) : (
                  attachedEndpoints.map((ep) => (
                    <div key={ep.id} className="p-2.5 flex items-center justify-between text-xs hover:bg-muted/10">
                      <div>
                        <div className="font-medium text-foreground">{ep.hostname}</div>
                        <div className="text-[11px] font-mono text-muted-foreground">{ep.ipAddress || 'DHCP'}</div>
                      </div>
                      <Badge variant={ep.onlineStatus === 'ONLINE' ? 'success' : 'secondary'} className="text-[9px]">
                        {ep.onlineStatus}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edge Endpoint Inventory Pool */}
      <div className="border border-border rounded-xl p-5 bg-card space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-base flex items-center gap-2">
            <Monitor className="size-4 text-primary" />
            Unattached / Edge Endpoints Pool ({endpoints.filter(e => !e.switchId).length})
          </h3>
          <span className="text-xs text-muted-foreground">
            Discovered or enrolled endpoints awaiting switch port mapping
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {endpoints
            .filter((e) => !e.switchId)
            .slice(0, 18)
            .map((ep) => (
              <div key={ep.id} className="border border-border/80 rounded-lg p-2.5 bg-muted/10 text-xs space-y-1">
                <div className="font-medium truncate text-foreground" title={ep.hostname}>
                  {ep.hostname}
                </div>
                <div className="font-mono text-[10px] text-muted-foreground truncate">
                  {ep.ipAddress || 'No IP'}
                </div>
                <Badge variant={ep.onlineStatus === 'ONLINE' ? 'success' : 'secondary'} className="text-[8px] h-4 px-1">
                  {ep.onlineStatus}
                </Badge>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
