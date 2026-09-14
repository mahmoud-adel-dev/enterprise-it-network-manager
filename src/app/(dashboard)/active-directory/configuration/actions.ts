'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/server/db';
import * as schema from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { syncAdComputers } from '@/server/services/ad';
import { getSession } from '@/server/auth/session';
import { auditAction } from '@/server/services/audit';

export async function saveAdConfig(formData: FormData) {
  const session = await getSession();
  if (!session?.userId) throw new Error('Unauthorized');

  const enabled = formData.get('enabled') === 'on';
  const domainFqdn = formData.get('domainFqdn') as string;
  const ldapEndpoint = formData.get('ldapEndpoint') as string;
  const baseDn = formData.get('baseDn') as string;
  const computerOu = (formData.get('computerOu') as string) || null;
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;

  // Insert or update AD config
  const existing = await db.select().from(schema.adConfiguration).where(eq(schema.adConfiguration.id, 'singleton')).get();

  if (existing) {
    await db.update(schema.adConfiguration).set({
      enabled,
      domainFqdn,
      ldapEndpoint,
      baseDn,
      computerOu,
      serviceAccountUsername: username,
      updatedAt: new Date(),
    }).where(eq(schema.adConfiguration.id, 'singleton'));
  } else {
    await db.insert(schema.adConfiguration).values({
      id: 'singleton',
      enabled,
      domainFqdn,
      ldapEndpoint,
      baseDn,
      computerOu,
      serviceAccountUsername: username,
    });
  }

  // Save password securely in appSettings
  if (password) {
    const existingPw = await db.select().from(schema.appSettings).where(eq(schema.appSettings.key, 'ad.service_account_password')).get();
    if (existingPw) {
      await db.update(schema.appSettings).set({ value: password }).where(eq(schema.appSettings.key, 'ad.service_account_password'));
    } else {
      await db.insert(schema.appSettings).values({ key: 'ad.service_account_password', value: password });
    }
  }

  await auditAction({
    action: 'AD_CONFIG_UPDATED',
    userId: session.userId,
    success: true,
  });

  revalidatePath('/active-directory/configuration');
}

export async function triggerAdSync() {
  const session = await getSession();
  if (!session?.userId) throw new Error('Unauthorized');

  try {
    const result = await syncAdComputers();
    
    await auditAction({
      action: 'AD_SYNC_TRIGGERED',
      userId: session.userId,
      success: true,
      metadata: result,
    });
    
    revalidatePath('/active-directory/configuration');
    return { success: true, result };
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    await auditAction({
      action: 'AD_SYNC_TRIGGERED',
      userId: session.userId,
      success: false,
      metadata: { error: errorMsg },
    });
    throw new Error(`Sync failed: ${errorMsg}`);
  }
}
