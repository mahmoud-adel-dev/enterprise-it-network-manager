import 'server-only';
import { db } from '@/server/db';
import * as schema from '@/server/db/schema';
import { eq, like, or } from 'drizzle-orm';
import ldap from 'ldapjs';
import { recordSystemEvent } from '@/server/services/audit';

function parseLdapTimestamp(ldapDateStr: string | undefined): Date | null {
  if (!ldapDateStr) return null;
  // Format: YYYYMMDDHHMMSS.0Z (e.g., 20230510153000.0Z)
  const match = ldapDateStr.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/);
  if (!match) return null;
  const [, y, m, d, h, min, s] = match;
  return new Date(Date.UTC(+y!, +m! - 1, +d!, +h!, +min!, +s!));
}

function parseWindowsFileTime(fileTimeStr: string | undefined): Date | null {
  if (!fileTimeStr || fileTimeStr === '0') return null;
  // Windows FILETIME is 100-nanosecond intervals since Jan 1, 1601 (UTC).
  // 116444736000000000 is the number of 100-ns intervals between 1601 and 1970.
  const intervals = BigInt(fileTimeStr);
  const ms = Number((intervals - BigInt('116444736000000000')) / BigInt(10000));
  return new Date(ms);
}

export async function getActiveDirectoryConfig() {
  return db.select().from(schema.adConfiguration).where(eq(schema.adConfiguration.id, 'singleton')).get();
}

/**
 * Perform a full sync of computer objects from Active Directory.
 * Uses pagination to handle domains with >1000 computers.
 */
export async function syncAdComputers(): Promise<{ added: number; updated: number; removed: number; errors: string[] }> {
  const config = await getActiveDirectoryConfig();
  if (!config?.enabled || !config.ldapEndpoint || !config.baseDn || !config.serviceAccountUsername) {
    throw new Error('Active Directory integration is not fully configured or enabled.');
  }

  // Get password from settings
  const pwSetting = await db
    .select()
    .from(schema.appSettings)
    .where(eq(schema.appSettings.key, 'ad.service_account_password'))
    .get();

  const password = pwSetting?.value;
  if (!password) {
    throw new Error('AD service account password is not set.');
  }

  const client = ldap.createClient({
    url: config.ldapEndpoint,
    tlsOptions: { rejectUnauthorized: false }, // Useful for internal CAs, should be configurable
  });

interface LdapAttributePojo {
  type: string;
  values: string[];
}

interface LdapEntryPojo {
  objectName: string;
  attributes: LdapAttributePojo[];
}

  return new Promise((resolve, reject) => {
    client.bind(config.serviceAccountUsername!, password, async (err) => {
      if (err) {
        client.unbind();
        return reject(new Error(`LDAP bind failed: ${err.message}`));
      }

      const computers: LdapEntryPojo[] = [];
      const opts: ldap.SearchOptions = {
        filter: '(&(objectClass=computer)(!(userAccountControl:1.2.840.113556.1.4.803:=2)))', // Only active computers
        scope: 'sub',
        attributes: [
          'dn', 'samaccountname', 'dNSHostName', 'operatingSystem',
          'lastLogonTimestamp', 'whenCreated', 'userAccountControl',
        ],
        paged: true,
        sizeLimit: 1000,
      };

      try {
        const targetDn = config.computerOu || config.baseDn!;
        client.search(targetDn, opts, (searchErr, res) => {
          if (searchErr) {
            client.unbind();
            return reject(searchErr);
          }

          res.on('searchEntry', (entry) => {
            computers.push(entry.pojo);
          });

          res.on('error', (resErr) => {
            console.error('LDAP Search Error:', resErr);
            // Continue best effort
          });

          res.on('end', async () => {
            client.unbind();

            let added = 0;
            let updated = 0;
            const errors: string[] = [];

            // Existing AD computers to track deletions
            const existing = await db.select({ dn: schema.adComputers.distinguishedName }).from(schema.adComputers);
            const existingDns = new Set(existing.map((e) => e.dn.toLowerCase()));
            const incomingDns = new Set<string>();

            // Process results
            for (const c of computers) {
              const dn = c.objectName;
              if (!dn) continue;

              const getAttr = (name: string) => c.attributes.find((a) => a.type.toLowerCase() === name.toLowerCase())?.values[0];

              const samAccountName = getAttr('sAMAccountName');
              const dnsHostname = getAttr('dNSHostName');
              const operatingSystem = getAttr('operatingSystem');
              const lastLogonTimestamp = getAttr('lastLogonTimestamp');
              const whenCreated = getAttr('whenCreated');
              const uac = getAttr('userAccountControl');

              if (!samAccountName) continue;

              const isEnabled = uac ? (parseInt(uac, 10) & 2) === 0 : true;

              // Derive OU from DN
              const dnParts = dn.split(',').map((p: string) => p.trim());
              const ouParts = dnParts.filter((p: string) => p.toUpperCase().startsWith('OU='));
              const organizationalUnit = ouParts.length > 0 ? ouParts.join(',') : null;

              incomingDns.add(dn.toLowerCase());

              try {
                // Try to correlate with existing device by hostname
                let correlatedDeviceId: string | undefined;
                if (dnsHostname) {
                  const hostname = dnsHostname.split('.')[0]!.toLowerCase();
                  const matchedDevice = await db
                    .select({ id: schema.devices.id })
                    .from(schema.devices)
                    .where(
                      or(
                        like(schema.devices.fqdn, `${hostname}.%`),
                        eq(schema.devices.hostname, hostname),
                      ),
                    )
                    .get();
                  if (matchedDevice) correlatedDeviceId = matchedDevice.id;
                }

                if (existingDns.has(dn.toLowerCase())) {
                  // Update
                  await db
                    .update(schema.adComputers)
                    .set({
                      samAccountName,
                      dnsHostname,
                      operatingSystem,
                      enabled: isEnabled,
                      lastLogon: parseWindowsFileTime(lastLogonTimestamp),
                      organizationalUnit,
                      correlatedDeviceId,
                      lastSyncAt: new Date(),
                    })
                    .where(eq(schema.adComputers.distinguishedName, dn));
                  updated++;
                } else {
                  // Insert
                  await db.insert(schema.adComputers).values({
                    distinguishedName: dn,
                    samAccountName,
                    dnsHostname,
                    operatingSystem,
                    enabled: isEnabled,
                    lastLogon: parseWindowsFileTime(lastLogonTimestamp),
                    whenCreated: parseLdapTimestamp(whenCreated),
                    organizationalUnit,
                    correlatedDeviceId,
                  });
                  added++;
                }
              } catch (e: unknown) {
                const msg = e instanceof Error ? e.message : 'Unknown sync error';
                errors.push(`Failed to sync ${dn}: ${msg}`);
              }
            }

            // Optional: Mark computers not found in AD as disabled/deleted in our table
            // For safety, we will just keep them but they won't have updated lastSyncAt.
            // A cleanup job could handle stale records later.

            await recordSystemEvent({
              event: 'AD_SYNC_COMPLETED',
              metadata: { added, updated, total: computers.length },
            });

            resolve({ added, updated, removed: 0, errors });
          });
        });
      } catch (err) {
        client.unbind();
        reject(err);
      }
    });
  });
}
