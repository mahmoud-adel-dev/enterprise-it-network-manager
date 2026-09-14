'use server';

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { authenticateUser } from '@/server/auth';
import { createSession } from '@/server/auth/session';
import { v4 as uuidv4 } from 'uuid';

export interface LoginState {
  error?: string;
  forcePasswordChange?: boolean;
}

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const username = (formData.get('username') as string)?.trim();
  const password = formData.get('password') as string;

  if (!username || !password) {
    return { error: 'Username and password are required.' };
  }

  const hdrs = await headers();
  const sourceIp = hdrs.get('x-forwarded-for') ?? hdrs.get('x-real-ip') ?? undefined;
  const userAgent = hdrs.get('user-agent') ?? undefined;

  const result = await authenticateUser(username, password, sourceIp, userAgent);

  if (!result.success || !result.user) {
    return { error: result.error ?? 'Authentication failed.' };
  }

  // Create a session
  await createSession({
    userId: result.user.id,
    username: result.user.username,
    sessionId: uuidv4(),
  });

  if (result.user.forcePasswordChange) {
    redirect('/account/change-password?force=true');
  }

  redirect('/dashboard');
}

export async function logoutAction(): Promise<void> {
  const { deleteSession } = await import('@/server/auth/session');
  await deleteSession();
  redirect('/login');
}
