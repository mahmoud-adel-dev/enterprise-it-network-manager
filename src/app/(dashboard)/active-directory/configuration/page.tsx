import { db } from '@/server/db';
import * as schema from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { saveAdConfig, triggerAdSync } from './actions';
import { BookUser, Settings, RefreshCcw, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { timeAgo } from '@/lib/utils';

export const metadata = { title: 'AD Configuration — Endpoint Manager' };

export default async function AdConfigurationPage() {
  const config = await db.select().from(schema.adConfiguration).where(eq(schema.adConfiguration.id, 'singleton')).get();
  
  return (
    <div className="w-full space-y-6 px-4 md:px-6 xl:px-8 2xl:px-10 py-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BookUser className="size-6 text-primary" />
          Active Directory Integration
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Configure LDAP connection to your Domain Controllers for computer discovery and domain join automation.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Col: Status & Actions */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Integration Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Status</span>
                {config?.enabled ? (
                  <Badge variant="success" className="gap-1"><CheckCircle2 className="size-3" /> Enabled</Badge>
                ) : (
                  <Badge variant="secondary">Disabled</Badge>
                )}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Connection</span>
                {config?.connectionVerifiedAt ? (
                  <span className="text-sm text-emerald-500 font-medium">Verified</span>
                ) : (
                  <span className="text-sm text-muted-foreground">Not Verified</span>
                )}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Last Verified</span>
                <span className="text-sm text-muted-foreground">
                  {config?.connectionVerifiedAt ? timeAgo(config.connectionVerifiedAt) : 'Never'}
                </span>
              </div>
            </CardContent>
            <CardFooter className="bg-muted/30 pt-4 flex-col items-stretch gap-2">
               <form action={async () => { 'use server'; await triggerAdSync(); }}>
                 <Button type="submit" variant="outline" className="w-full gap-2" disabled={!config?.enabled}>
                   <RefreshCcw className="size-4" />
                   Run AD Sync Now
                 </Button>
               </form>
               <p className="text-xs text-center text-muted-foreground">
                 Imports computer objects into the staging area.
               </p>
            </CardFooter>
          </Card>

          <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-4 text-sm text-blue-500 space-y-2">
            <h4 className="font-semibold flex items-center gap-2">
              <ShieldAlert className="size-4" /> Least Privilege
            </h4>
            <p className="text-xs">
              The service account only requires <strong>Read</strong> access to computer objects for discovery. 
              Domain Join capabilities require delegation of &quot;Create Computer Objects&quot; and &quot;Delete Computer Objects&quot; on the target OU.
            </p>
          </div>
        </div>

        {/* Right Col: Form */}
        <div className="md:col-span-2">
          <Card>
            <form action={saveAdConfig}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="size-5" />
                  Connection Settings
                </CardTitle>
                <CardDescription>
                  Configure LDAPS endpoint and service account credentials.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 mb-4 p-3 border rounded-md bg-muted/20">
                  <input 
                    type="checkbox" 
                    id="enabled" 
                    name="enabled" 
                    defaultChecked={config?.enabled ?? false}
                    className="size-4 rounded border-input text-primary focus:ring-primary"
                  />
                  <Label htmlFor="enabled" className="font-semibold text-base cursor-pointer">Enable Active Directory Integration</Label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="domainFqdn">Domain FQDN</Label>
                    <Input id="domainFqdn" name="domainFqdn" placeholder="corp.example.com" defaultValue={config?.domainFqdn ?? ''} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="ldapEndpoint">LDAP Endpoint</Label>
                    <Input id="ldapEndpoint" name="ldapEndpoint" placeholder="ldaps://dc01.corp.example.com:636" defaultValue={config?.ldapEndpoint ?? ''} required />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="baseDn">Base DN</Label>
                  <Input id="baseDn" name="baseDn" placeholder="DC=corp,DC=example,DC=com" defaultValue={config?.baseDn ?? ''} required />
                  <p className="text-xs text-muted-foreground">The root DN for searching users and computers.</p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="computerOu">Default Computer OU (Optional)</Label>
                  <Input id="computerOu" name="computerOu" placeholder="OU=Workstations,DC=corp,DC=example,DC=com" defaultValue={config?.computerOu ?? ''} />
                  <p className="text-xs text-muted-foreground">Specific OU to scope computer discovery and domain joins.</p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div className="space-y-1.5">
                    <Label htmlFor="username">Service Account Username</Label>
                    <Input id="username" name="username" placeholder="svc-endpoint-mgr@corp.example.com" defaultValue={config?.serviceAccountUsername ?? ''} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="password">Service Account Password</Label>
                    <Input id="password" name="password" type="password" placeholder={config?.serviceAccountUsername ? '•••••••• (Leave blank to keep)' : 'Enter password'} />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="justify-end border-t pt-6 bg-muted/10 rounded-b-xl">
                <Button type="submit">Save Configuration</Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
