'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { addNetworkDeviceAction } from './actions';
import { Plus, Server, Loader2, AlertCircle, X } from 'lucide-react';

export function AddDeviceDialog() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [snmpEnabled, setSnmpEnabled] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.set('snmpEnabled', String(snmpEnabled));

    startTransition(async () => {
      const res = await addNetworkDeviceAction(formData);
      if (res.success) {
        setOpen(false);
      } else {
        setError(res.error || 'Failed to add device.');
      }
    });
  };

  return (
    <>
      <Button onClick={() => setOpen(true)} className="gap-2">
        <Plus className="size-4" /> Add Infrastructure Device
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-xl w-full max-w-lg shadow-2xl overflow-hidden my-8">
            <div className="flex justify-between items-center px-6 py-4 border-b border-border bg-muted/20">
              <div>
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Server className="size-5 text-primary" />
                  Add Network Device
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Register a switch, router, firewall, or gateway for inventory and topology tracking
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1 rounded-md"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive flex items-center gap-2">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="managementIp">Management IP *</Label>
                  <Input
                    id="managementIp"
                    name="managementIp"
                    required
                    placeholder="192.168.1.1"
                    className="mt-1 font-mono text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="deviceType">Device Type *</Label>
                  <select
                    id="deviceType"
                    name="deviceType"
                    className="mt-1 w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus:outline-hidden focus:ring-1 focus:ring-ring"
                  >
                    <option value="SWITCH" className="bg-popover text-popover-foreground">Switch (Layer 2 / Layer 3)</option>
                    <option value="ROUTER" className="bg-popover text-popover-foreground">Router / Gateway</option>
                    <option value="FIREWALL" className="bg-popover text-popover-foreground">Firewall / Security Appliance</option>
                    <option value="ACCESS_POINT" className="bg-popover text-popover-foreground">Wireless Access Point</option>
                    <option value="CONTROLLER" className="bg-popover text-popover-foreground">Network Controller</option>
                    <option value="OTHER" className="bg-popover text-popover-foreground">Other Appliance</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="hostname">Hostname / SysName</Label>
                  <Input id="hostname" name="hostname" placeholder="core-sw-01.corp" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="manufacturer">Manufacturer / Vendor</Label>
                  <Input id="manufacturer" name="manufacturer" placeholder="Cisco / Aruba / Juniper" className="mt-1" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="model">Model</Label>
                  <Input id="model" name="model" placeholder="Catalyst 9300-48P" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="serialNumber">Serial Number</Label>
                  <Input id="serialNumber" name="serialNumber" placeholder="FCZ2345L02K" className="mt-1 font-mono text-xs" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="site">Site Location</Label>
                  <Input id="site" name="site" placeholder="HQ - Server Room" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="rack">Rack / Unit</Label>
                  <Input id="rack" name="rack" placeholder="Rack A, U24" className="mt-1" />
                </div>
              </div>

              {/* SNMP Settings */}
              <div className="border-t border-border pt-3 space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={snmpEnabled}
                    onChange={(e) => setSnmpEnabled(e.target.checked)}
                    className="rounded border-border"
                  />
                  <span className="text-xs font-semibold text-foreground">Enable SNMP Polling</span>
                </label>

                {snmpEnabled && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="snmpVersion">SNMP Version</Label>
                      <select
                        id="snmpVersion"
                        name="snmpVersion"
                        className="mt-1 w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus:outline-hidden focus:ring-1 focus:ring-ring"
                      >
                        <option value="v2c" className="bg-popover text-popover-foreground">SNMP v2c</option>
                        <option value="v3" className="bg-popover text-popover-foreground">SNMP v3</option>
                        <option value="v1" className="bg-popover text-popover-foreground">SNMP v1</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="snmpCommunity">Community String</Label>
                      <Input
                        id="snmpCommunity"
                        name="snmpCommunity"
                        type="password"
                        placeholder="public"
                        defaultValue="public"
                        className="mt-1 font-mono text-xs"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-border">
                <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending} className="gap-2">
                  {isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                  Register Device
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
