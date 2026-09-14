import { type NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import * as schema from '@/server/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { authenticateAgent } from '@/server/auth/agent-auth';
import path from 'path';
import fs from 'fs';
import { Readable } from 'stream';

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json({ code, message }, { status });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const device = await authenticateAgent(req.headers.get('authorization'));
  if (!device) return errorResponse('AGENT_UNAUTHORIZED', 'Invalid agent credentials.', 401);

  const { id: packageId } = await params;

  // Verify this device has an active deployment target for this package
  const target = await db
    .select({ id: schema.deploymentTargets.id, leaseToken: schema.deploymentTargets.leaseToken })
    .from(schema.deploymentTargets)
    .innerJoin(schema.deploymentJobs, eq(schema.deploymentTargets.deploymentJobId, schema.deploymentJobs.id))
    .where(
      and(
        eq(schema.deploymentTargets.deviceId, device.id),
        eq(schema.deploymentJobs.applicationPackageId, packageId),
        inArray(schema.deploymentTargets.status, ['QUEUED', 'DOWNLOADING', 'VERIFYING_PACKAGE', 'INSTALLING']),
      ),
    )
    .get();

  if (!target) {
    return errorResponse('DEPLOYMENT_NOT_ALLOWED', 'No active deployment found for this package on this device.', 403);
  }

  const pkg = await db
    .select()
    .from(schema.applicationPackages)
    .where(eq(schema.applicationPackages.id, packageId))
    .get();

  if (!pkg) return errorResponse('PACKAGE_NOT_FOUND', 'Package not found.', 404);
  if (!pkg.enabled) return errorResponse('PACKAGE_DISABLED', 'Package is disabled.', 403);
  if (!pkg.approved) return errorResponse('PACKAGE_NOT_APPROVED', 'Package not approved for deployment.', 403);

  // Resolve and validate file path — prevent path traversal
  const storageBase = process.env['PACKAGE_STORAGE_PATH']
    ? path.resolve(process.env['PACKAGE_STORAGE_PATH'])
    : path.join(process.cwd(), 'data', 'packages');
  const filePath = path.resolve(storageBase, pkg.installerStoragePath);

  // Ensure file is within storage directory
  if (!filePath.startsWith(storageBase + path.sep) && filePath !== storageBase) {
    return errorResponse('PACKAGE_NOT_FOUND', 'Invalid package path.', 404);
  }

  if (!fs.existsSync(filePath)) {
    return errorResponse('PACKAGE_NOT_FOUND', 'Package file not found on storage.', 404);
  }

  const stat = fs.statSync(filePath);

  // Stream the file directly to avoid memory buffering of large installers
  const nodeStream = fs.createReadStream(filePath);
  const webStream = Readable.toWeb(nodeStream) as ReadableStream;

  return new Response(webStream, {
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(pkg.installerFileName)}"`,
      'Content-Length': String(stat.size),
      'X-Package-SHA256': pkg.sha256,
      'X-Package-Size': String(pkg.fileSize),
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}
