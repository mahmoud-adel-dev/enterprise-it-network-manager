'use server';

import { getSession } from '@/server/auth/session';
import { createDeploymentJob, cancelDeploymentJob } from '@/server/services/deployments';
import { revalidatePath } from 'next/cache';

export interface DeploymentActionResponse {
  success: boolean;
  error?: string;
  jobId?: string;
}

export async function createDeploymentAction(formData: FormData): Promise<DeploymentActionResponse> {
  const session = await getSession();
  if (!session) {
    return { success: false, error: 'Unauthorized. Please sign in.' };
  }

  const name = (formData.get('name') as string)?.trim();
  const applicationPackageId = (formData.get('applicationPackageId') as string)?.trim();
  
  if (!name || !applicationPackageId) {
    return { success: false, error: 'Deployment name and software package are required.' };
  }

  const targetDeviceIds = formData.getAll('deviceIds') as string[];
  const targetGroupIds = formData.getAll('groupIds') as string[];

  if (targetDeviceIds.length === 0 && targetGroupIds.length === 0) {
    return { success: false, error: 'Please select at least one target device or group.' };
  }

  try {
    const job = await createDeploymentJob({
      name,
      applicationPackageId,
      createdByUserId: session.userId,
      targetDeviceIds,
      targetGroupIds,
    });

    revalidatePath('/software/deployments');
    return { success: true, jobId: job.id };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to create deployment.';
    console.error('Failed to create deployment job:', err);
    return { success: false, error: msg };
  }
}

export async function cancelDeploymentAction(jobId: string): Promise<DeploymentActionResponse> {
  const session = await getSession();
  if (!session) {
    return { success: false, error: 'Unauthorized.' };
  }

  try {
    await cancelDeploymentJob(jobId, session.userId);
    revalidatePath('/software/deployments');
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to cancel deployment.';
    console.error('Failed to cancel deployment job:', err);
    return { success: false, error: msg };
  }
}
