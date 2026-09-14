import 'server-only';
import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { cookies } from 'next/headers';

const SESSION_COOKIE = 'em_session';
const ALGORITHM = 'HS256';

function getSecretKey(): Uint8Array {
  const secret = process.env['AUTH_SECRET'];
  if (!secret || secret.length < 32) {
    throw new Error(
      'AUTH_SECRET environment variable is required and must be at least 32 characters long.',
    );
  }
  return new TextEncoder().encode(secret);
}

export interface SessionPayload extends JWTPayload {
  userId: string;
  username: string;
  sessionId: string;
}

export async function createSession(payload: Omit<SessionPayload, 'iat' | 'exp'>): Promise<string> {
  const expiresInDays = parseInt(process.env['SESSION_EXPIRY_DAYS'] ?? '7', 10);
  const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: ALGORITHM })
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .sign(getSecretKey());

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env['NODE_ENV'] === 'production',
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
  });

  return token;
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify<SessionPayload>(token, getSecretKey(), {
      algorithms: [ALGORITHM],
    });
    return payload;
  } catch {
    return null;
  }
}

export async function updateSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return;

  try {
    const { payload } = await jwtVerify<SessionPayload>(token, getSecretKey(), {
      algorithms: [ALGORITHM],
    });

    const expiresInDays = parseInt(process.env['SESSION_EXPIRY_DAYS'] ?? '7', 10);
    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

    const newToken = await new SignJWT({
      userId: payload.userId,
      username: payload.username,
      sessionId: payload.sessionId,
    })
      .setProtectedHeader({ alg: ALGORITHM })
      .setIssuedAt()
      .setExpirationTime(expiresAt)
      .sign(getSecretKey());

    cookieStore.set(SESSION_COOKIE, newToken, {
      httpOnly: true,
      secure: process.env['NODE_ENV'] === 'production',
      expires: expiresAt,
      sameSite: 'lax',
      path: '/',
    });
  } catch {
    // Expired or invalid — clear it
    await deleteSession();
  }
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

/**
 * Require an authenticated session or throw.
 * Use in server components and route handlers.
 */
export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    // Next.js redirect() throws internally — we re-throw to let callers handle it
    throw new Error('UNAUTHORIZED');
  }
  return session;
}
