'use server';

import { db } from '@/server/db';
import * as schema from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { getSession } from '@/server/auth/session';
import { auditAction } from '@/server/services/audit';
import { revalidatePath } from 'next/cache';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

export interface ActionResponse {
  success: boolean;
  error?: string;
}

export async function uploadPackageAction(formData: FormData): Promise<ActionResponse> {
  const session = await getSession();
  if (!session) {
    return { success: false, error: 'Unauthorized. Please sign in.' };
  }

  const file = formData.get('file') as File | null;
  if (!file || file.size === 0) {
    return { success: false, error: 'Installer file is required.' };
  }

  const name = (formData.get('name') as string)?.trim();
  const applicationVersion = (formData.get('applicationVersion') as string)?.trim();
  const publisher = (formData.get('publisher') as string)?.trim() || null;
  const description = (formData.get('description') as string)?.trim() || null;
  const installerTypeRaw = (formData.get('installerType') as string)?.trim().toUpperCase();
  const installerType = installerTypeRaw === 'EXE' ? 'EXE' : 'MSI';
  
  if (!name || !applicationVersion) {
    return { success: false, error: 'Application name and version are required.' };
  }

  // Validate file extension
  const originalFileName = file.name;
  const ext = path.extname(originalFileName).toLowerCase();
  if (ext !== '.msi' && ext !== '.exe') {
    return { success: false, error: 'Invalid file format. Only .msi and .exe installers are supported.' };
  }

  // Parse arguments and detection rules
  const rawArgs = (formData.get('installerArguments') as string)?.trim();
  let installerArguments = '[]';
  if (rawArgs) {
    try {
      installerArguments = JSON.stringify(JSON.parse(rawArgs));
    } catch {
      // Split by whitespace if not valid JSON
      installerArguments = JSON.stringify(rawArgs.split(/\s+/).filter(Boolean));
    }
  }

  const rawUninstallArgs = (formData.get('uninstallArguments') as string)?.trim();
  let uninstallArguments = '[]';
  if (rawUninstallArgs) {
    try {
      uninstallArguments = JSON.stringify(JSON.parse(rawUninstallArgs));
    } catch {
      uninstallArguments = JSON.stringify(rawUninstallArgs.split(/\s+/).filter(Boolean));
    }
  }

  const detectionType = (formData.get('detectionType') as string)?.trim() || 'MSI_PRODUCT_CODE';
  const detectionValue = (formData.get('detectionValue') as string)?.trim() || '';
  
  const detectionRuleObj = {
    type: detectionType,
    value: detectionValue,
    matchType: 'EXACT',
  };
  const detectionRule = JSON.stringify(detectionRuleObj);

  const timeoutMinutes = parseInt((formData.get('timeoutMinutes') as string) || '120', 10);
  const autoApprove = formData.get('autoApprove') === 'true';

  // Read file data and calculate SHA-256
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');
  const fileSize = buffer.length;

  // Resolve storage directory safely
  const storageBase = process.env['PACKAGE_STORAGE_PATH']
    ? path.resolve(process.env['PACKAGE_STORAGE_PATH'])
    : path.join(process.cwd(), 'data', 'packages');
  if (!fs.existsSync(storageBase)) {
    fs.mkdirSync(storageBase, { recursive: true });
  }

  // Generate safe storage filename using UUID
  const storageFileName = `${crypto.randomUUID()}${ext}`;
  const filePath = path.join(storageBase, storageFileName);

  // Write file to disk
  try {
    fs.writeFileSync(filePath, buffer);
  } catch (fsErr: unknown) {
    const msg = fsErr instanceof Error ? fsErr.message : 'Unknown storage error';
    console.error('Failed to write package to disk:', fsErr);
    return { success: false, error: `Failed to save package file to storage: ${msg}` };
  }

  // Persist record to database
  try {
    const [inserted] = await db.insert(schema.applicationPackages).values({
      name,
      description,
      publisher,
      applicationVersion,
      packageVersion: '1',
      supportedOperatingSystems: JSON.stringify(['windows10', 'windows11']),
      supportedArchitectures: JSON.stringify(['x64']),
      installerType,
      installerFileName: originalFileName,
      installerStoragePath: storageFileName,
      installerArguments,
      uninstallArguments,
      successExitCodes: JSON.stringify([0, 3010]),
      detectionType,
      detectionRule,
      sha256,
      fileSize,
      timeoutMinutes: isNaN(timeoutMinutes) ? 120 : timeoutMinutes,
      enabled: true,
      approved: autoApprove,
      approvedBy: autoApprove ? session.userId : null,
      approvedAt: autoApprove ? new Date() : null,
      createdBy: session.userId,
    }).returning({ id: schema.applicationPackages.id });

    await auditAction({
      action: 'PACKAGE_UPLOADED',
      userId: session.userId,
      usernameSnapshot: session.username,
      resourceType: 'APPLICATION_PACKAGE',
      resourceId: inserted?.id,
      metadata: { name, version: applicationVersion, originalFileName, sha256, fileSize },
    });

    revalidatePath('/software/applications');
    return { success: true };
  } catch (dbErr: unknown) {
    // Database insert failed, roll back the saved file on disk
    const msg = dbErr instanceof Error ? dbErr.message : 'Database error';
    console.error('Database insert failed, rolling back uploaded file:', dbErr);
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (cleanupErr) {
      console.error('Failed to cleanup file after DB failure:', cleanupErr);
    }
    return { success: false, error: `Failed to save package record: ${msg}` };
  }
}

export async function togglePackageApprovalAction(packageId: string): Promise<ActionResponse> {
  const session = await getSession();
  if (!session) return { success: false, error: 'Unauthorized.' };

  const pkg = await db.select().from(schema.applicationPackages).where(eq(schema.applicationPackages.id, packageId)).get();
  if (!pkg) return { success: false, error: 'Package not found.' };

  const newApproved = !pkg.approved;
  await db.update(schema.applicationPackages).set({
    approved: newApproved,
    approvedBy: newApproved ? session.userId : null,
    approvedAt: newApproved ? new Date() : null,
    updatedAt: new Date(),
  }).where(eq(schema.applicationPackages.id, packageId));

  await auditAction({
    action: newApproved ? 'PACKAGE_APPROVED' : 'PACKAGE_UNAPPROVED',
    userId: session.userId,
    usernameSnapshot: session.username,
    resourceType: 'APPLICATION_PACKAGE',
    resourceId: packageId,
  });

  revalidatePath('/software/applications');
  return { success: true };
}

export async function togglePackageStatusAction(packageId: string): Promise<ActionResponse> {
  const session = await getSession();
  if (!session) return { success: false, error: 'Unauthorized.' };

  const pkg = await db.select().from(schema.applicationPackages).where(eq(schema.applicationPackages.id, packageId)).get();
  if (!pkg) return { success: false, error: 'Package not found.' };

  const newEnabled = !pkg.enabled;
  await db.update(schema.applicationPackages).set({
    enabled: newEnabled,
    updatedAt: new Date(),
  }).where(eq(schema.applicationPackages.id, packageId));

  await auditAction({
    action: newEnabled ? 'PACKAGE_ENABLED' : 'PACKAGE_DISABLED',
    userId: session.userId,
    usernameSnapshot: session.username,
    resourceType: 'APPLICATION_PACKAGE',
    resourceId: packageId,
  });

  revalidatePath('/software/applications');
  return { success: true };
}

export async function deletePackageAction(packageId: string): Promise<ActionResponse> {
  const session = await getSession();
  if (!session) return { success: false, error: 'Unauthorized.' };

  const pkg = await db.select().from(schema.applicationPackages).where(eq(schema.applicationPackages.id, packageId)).get();
  if (!pkg) return { success: false, error: 'Package not found.' };

  // Check if active deployment exists
  const activeJobs = await db.select({ id: schema.deploymentJobs.id })
    .from(schema.deploymentJobs)
    .where(eq(schema.deploymentJobs.applicationPackageId, packageId));

  if (activeJobs.length > 0) {
    return { success: false, error: 'Cannot delete package that is associated with deployment jobs.' };
  }

  // Delete file from disk
  const storageBase = process.env['PACKAGE_STORAGE_PATH']
    ? path.resolve(process.env['PACKAGE_STORAGE_PATH'])
    : path.join(process.cwd(), 'data', 'packages');
  const filePath = path.resolve(storageBase, pkg.installerStoragePath);
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch (e) {
      console.warn('Could not delete package file from disk:', e);
    }
  }

  // Delete DB record
  await db.delete(schema.applicationPackages).where(eq(schema.applicationPackages.id, packageId));

  await auditAction({
    action: 'PACKAGE_DELETED',
    userId: session.userId,
    usernameSnapshot: session.username,
    resourceType: 'APPLICATION_PACKAGE',
    resourceId: packageId,
    metadata: { name: pkg.name },
  });

  revalidatePath('/software/applications');
  return { success: true };
}
