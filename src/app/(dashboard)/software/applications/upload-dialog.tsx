'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { uploadPackageAction } from './actions';
import { Plus, Upload, Loader2, AlertCircle, CheckCircle2, X } from 'lucide-react';

export function UploadPackageDialog() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [installerType, setInstallerType] = useState<'MSI' | 'EXE'>('MSI');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);

    // Auto-detect installer type
    if (file.name.toLowerCase().endsWith('.msi')) {
      setInstallerType('MSI');
    } else if (file.name.toLowerCase().endsWith('.exe')) {
      setInstallerType('EXE');
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    if (!selectedFile) {
      setError('Please select an installer file (.msi or .exe)');
      return;
    }

    startTransition(async () => {
      const res = await uploadPackageAction(formData);
      if (res.success) {
        setSuccess(true);
        setTimeout(() => {
          setOpen(false);
          setSuccess(false);
          setSelectedFile(null);
        }, 1200);
      } else {
        setError(res.error || 'Failed to upload package');
      }
    });
  };

  return (
    <>
      <Button onClick={() => setOpen(true)} className="gap-2">
        <Plus className="size-4" /> Add Package
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-xl w-full max-w-xl shadow-2xl overflow-hidden my-8">
            <div className="flex justify-between items-center px-6 py-4 border-b border-border bg-muted/20">
              <div>
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Upload className="size-5 text-primary" />
                  Upload Software Package
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Package MSI or EXE installers for automated deployment to endpoints
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

              {success && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 className="size-4 shrink-0" />
                  <span>Package uploaded and verified successfully!</span>
                </div>
              )}

              {/* File picker */}
              <div>
                <Label htmlFor="file">Installer File (.msi or .exe) *</Label>
                <div className="mt-1.5 border-2 border-dashed border-border hover:border-primary/50 rounded-lg p-4 text-center cursor-pointer transition-colors relative bg-muted/10">
                  <input
                    type="file"
                    id="file"
                    name="file"
                    accept=".msi,.exe"
                    required
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <div className="flex flex-col items-center justify-center gap-1 text-sm">
                    <Upload className="size-8 text-muted-foreground mb-1" />
                    {selectedFile ? (
                      <div className="font-medium text-foreground">
                        {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                      </div>
                    ) : (
                      <>
                        <span className="font-medium text-primary">Click to upload</span> or drag and drop
                        <span className="text-xs text-muted-foreground">MSI or EXE installer files up to 2GB</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="name">Application Name *</Label>
                  <Input id="name" name="name" placeholder="e.g. Google Chrome" required className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="applicationVersion">Version *</Label>
                  <Input id="applicationVersion" name="applicationVersion" placeholder="e.g. 128.0.6613.85" required className="mt-1" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="publisher">Publisher</Label>
                  <Input id="publisher" name="publisher" placeholder="e.g. Google LLC" className="mt-1" />
                </div>
                <div>
                  <Label htmlFor="installerType">Installer Type *</Label>
                  <select
                    id="installerType"
                    name="installerType"
                    value={installerType}
                    onChange={(e) => setInstallerType(e.target.value as 'MSI' | 'EXE')}
                    className="mt-1 w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus:outline-hidden focus:ring-1 focus:ring-ring"
                  >
                    <option value="MSI" className="bg-popover text-popover-foreground">MSI (Windows Installer)</option>
                    <option value="EXE" className="bg-popover text-popover-foreground">EXE (Executable)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="installerArguments">Silent Install Arguments</Label>
                  <Input
                    id="installerArguments"
                    name="installerArguments"
                    placeholder={installerType === 'MSI' ? '/qn /norestart' : '/S /silent'}
                    defaultValue={installerType === 'MSI' ? '/qn /norestart' : ''}
                    className="mt-1 font-mono text-xs"
                  />
                </div>
                <div>
                  <Label htmlFor="uninstallArguments">Silent Uninstall Arguments</Label>
                  <Input
                    id="uninstallArguments"
                    name="uninstallArguments"
                    placeholder="/uninstall /qn"
                    className="mt-1 font-mono text-xs"
                  />
                </div>
              </div>

              <div className="border-t border-border pt-3 space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Detection Rules</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="detectionType">Detection Method</Label>
                    <select
                      id="detectionType"
                      name="detectionType"
                      defaultValue={installerType === 'MSI' ? 'MSI_PRODUCT_CODE' : 'INSTALLED_APPLICATION'}
                      className="mt-1 w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs focus:outline-hidden focus:ring-1 focus:ring-ring"
                    >
                      <option value="MSI_PRODUCT_CODE" className="bg-popover text-popover-foreground">MSI Product Code GUID</option>
                      <option value="INSTALLED_APPLICATION" className="bg-popover text-popover-foreground">Installed App Display Name</option>
                      <option value="REGISTRY_VALUE" className="bg-popover text-popover-foreground">Registry Key / Value</option>
                      <option value="FILE_VERSION" className="bg-popover text-popover-foreground">File Path & Version</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="detectionValue">Detection Target Value</Label>
                    <Input
                      id="detectionValue"
                      name="detectionValue"
                      placeholder="e.g. {23170F69-40C1-2702-2107-000001000000}"
                      className="mt-1 font-mono text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border">
                <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                  <input type="checkbox" name="autoApprove" value="true" defaultChecked className="rounded border-border" />
                  <span>Auto-approve package for immediate deployment</span>
                </label>

                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isPending || !selectedFile} className="gap-1.5">
                    {isPending ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Uploading & Hashing...
                      </>
                    ) : (
                      <>
                        <Upload className="size-4" />
                        Save Package
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
