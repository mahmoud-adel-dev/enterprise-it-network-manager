import { db } from '@/server/db';
import * as schema from '@/server/db/schema';
import { desc } from 'drizzle-orm';
import { Badge } from '@/components/ui/badge';
import { Package, FileBox } from 'lucide-react';
import { timeAgo } from '@/lib/utils';
import { UploadPackageDialog } from './upload-dialog';
import { PackageActions } from './package-actions';

export const metadata = { title: 'Software Applications — Endpoint Manager' };

export default async function ApplicationsPage() {
  const packages = await db
    .select({
      id: schema.applicationPackages.id,
      name: schema.applicationPackages.name,
      version: schema.applicationPackages.applicationVersion,
      publisher: schema.applicationPackages.publisher,
      installerType: schema.applicationPackages.installerType,
      installerFileName: schema.applicationPackages.installerFileName,
      fileSize: schema.applicationPackages.fileSize,
      sha256: schema.applicationPackages.sha256,
      approved: schema.applicationPackages.approved,
      enabled: schema.applicationPackages.enabled,
      createdAt: schema.applicationPackages.createdAt,
    })
    .from(schema.applicationPackages)
    .orderBy(desc(schema.applicationPackages.createdAt));

  return (
    <div className="p-6 space-y-6 max-w-7xl">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package className="size-6 text-primary" />
            Software Repository
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage application packages available for deployment to endpoints.
          </p>
        </div>
        <UploadPackageDialog />
      </div>

      {packages.length === 0 ? (
        <div className="border rounded-xl p-16 text-center text-muted-foreground bg-muted/10">
          <FileBox className="size-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium text-lg text-foreground">No applications found</p>
          <p className="text-sm mt-1">Upload MSI or EXE installers to begin deploying software.</p>
          <div className="mt-4 inline-block">
            <UploadPackageDialog />
          </div>
        </div>
      ) : (
        <div className="border rounded-xl overflow-hidden bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Application</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Installer</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Size</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Uploaded</th>
                <th className="px-4 py-3 font-medium text-muted-foreground text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {packages.map((pkg) => (
                <tr key={pkg.id} className="hover:bg-muted/10 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium">{pkg.name}</div>
                    <div className="text-xs text-muted-foreground flex gap-2 items-center">
                      <span>v{pkg.version}</span>
                      {pkg.publisher && (
                        <>
                          <span className="text-muted-foreground/30">•</span>
                          <span>{pkg.publisher}</span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className="font-mono text-[10px]">
                        {pkg.installerType}
                      </Badge>
                      <span className="text-xs text-muted-foreground truncate max-w-[180px]" title={pkg.installerFileName}>
                        {pkg.installerFileName}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground font-mono">
                    {(pkg.fileSize / 1024 / 1024).toFixed(1)} MB
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      {pkg.approved ? (
                        <Badge variant="success" className="text-[10px]">Approved</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px]">Draft</Badge>
                      )}
                      {!pkg.enabled && (
                        <Badge variant="destructive" className="text-[10px]">Disabled</Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                    {timeAgo(pkg.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <PackageActions
                      packageId={pkg.id}
                      approved={pkg.approved}
                      enabled={pkg.enabled}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
