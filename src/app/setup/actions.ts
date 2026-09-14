'use server';

import { redirect } from 'next/navigation';
import { isSetupComplete } from '@/server/auth/rbac';
import { bootstrapAdmin, validatePasswordStrength } from '@/server/auth';

export interface SetupState {
  error?: string;
  fieldErrors?: Record<string, string>;
  success?: boolean;
}

export async function setupAction(_prev: SetupState, formData: FormData): Promise<SetupState> {
  // Block if already set up
  const alreadySetup = await isSetupComplete();
  if (alreadySetup) {
    return { error: 'Setup has already been completed.' };
  }

  const username = (formData.get('username') as string)?.trim().toLowerCase();
  const displayName = (formData.get('displayName') as string)?.trim();
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  const fieldErrors: Record<string, string> = {};

  if (!username || username.length < 3) fieldErrors['username'] = 'Username must be at least 3 characters.';
  if (!displayName || displayName.length < 2) fieldErrors['displayName'] = 'Display name is required.';
  if (!password) fieldErrors['password'] = 'Password is required.';

  const pwErrors = validatePasswordStrength(password ?? '');
  if (pwErrors.length > 0) fieldErrors['password'] = pwErrors[0]!;

  if (password !== confirmPassword) fieldErrors['confirmPassword'] = 'Passwords do not match.';

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  try {
    await bootstrapAdmin({ username, displayName, password });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    if (msg.includes('UNIQUE')) {
      return { fieldErrors: { username: 'Username already exists.' } };
    }
    return { error: 'Failed to create administrator account. Please try again.' };
  }

  redirect('/login?setup=complete');
}
