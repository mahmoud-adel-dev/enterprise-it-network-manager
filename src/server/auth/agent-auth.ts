import 'server-only';
import { db } from '@/server/db';
import * as schema from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

const TOKEN_HASH_ROUNDS = 10;

/**
 * Hash an agent bearer token for storage.
 * We use bcrypt so brute-force is expensive even if DB is leaked.
 */
export async function hashAgentToken(token: string): Promise<string> {
  return bcrypt.hash(token, TOKEN_HASH_ROUNDS);
}

export async function verifyAgentToken(token: string, hash: string): Promise<boolean> {
  return bcrypt.compare(token, hash);
}

/**
 * Validate the Agent Bearer token from the Authorization header.
 * Returns the device if valid, null otherwise.
 */
export async function authenticateAgent(
  authHeader: string | null,
): Promise<typeof schema.devices.$inferSelect | null> {
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  if (!token) return null;

  // We need to find the device that owns this token.
  // To avoid full table scan, we store a prefix of the token for lookup.
  // The full token is hashed for verification.
  // Token format: {agentId}:{secret}
  const parts = token.split(':');
  if (parts.length !== 2) return null;

  const [agentId, secret] = parts;
  if (!agentId || !secret) return null;

  const device = await db
    .select()
    .from(schema.devices)
    .where(eq(schema.devices.agentId, agentId))
    .get();

  if (!device?.agentToken) return null;
  if (device.managementStatus === 'RETIRED') return null;
  if (device.approvalStatus === 'REJECTED') return null;

  const valid = await verifyAgentToken(secret, device.agentToken);
  return valid ? device : null;
}

/**
 * Generate a new agent token. Returns { token, hash }.
 * Store hash in DB, send token to agent.
 */
export function generateAgentToken(agentId: string): { rawToken: string } {
  const secret = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
  return { rawToken: `${agentId}:${secret}` };
}
