export interface DiscoveredNetworkHost {
  ip: string;
  mac?: string;
  hostname?: string;
  vendor?: string;
}

const IPV4_PATTERN = /(?:^|[\s(])((?:\d{1,3}\.){3}\d{1,3})(?=$|[\s)])/g;
const MAC_PATTERN = /(?:^|[^0-9a-f])([0-9a-f]{2}(?:[:-][0-9a-f]{2}){5})(?![0-9a-f])/i;

export function normalizeMacAddress(value: string | undefined): string | undefined {
  if (!value) return undefined;

  const hex = value.replace(/[^0-9a-f]/gi, '');
  if (hex.length !== 12) return undefined;

  const normalized = hex.match(/.{2}/g)?.join(':').toUpperCase();
  if (!normalized || normalized === '00:00:00:00:00:00' || normalized === 'FF:FF:FF:FF:FF:FF') {
    return undefined;
  }

  // The low bit of the first octet marks multicast/group addresses, not host NICs.
  if ((Number.parseInt(hex.slice(0, 2), 16) & 1) === 1) return undefined;

  return normalized;
}

export function parseNeighborTable(output: string): Map<string, string> {
  const neighbors = new Map<string, string>();

  for (const line of output.split(/\r?\n/)) {
    const mac = normalizeMacAddress(line.match(MAC_PATTERN)?.[1]);
    if (!mac) continue;

    for (const match of line.matchAll(IPV4_PATTERN)) {
      const ip = match[1];
      if (ip && isValidIpv4(ip)) neighbors.set(ip, mac);
    }
  }

  return neighbors;
}

export function parseNmapXml(output: string): DiscoveredNetworkHost[] {
  const hosts: DiscoveredNetworkHost[] = [];
  const hostBlocks = output.match(/<host\b[\s\S]*?<\/host>/g) ?? [];

  for (const block of hostBlocks) {
    const statusTag = block.match(/<status\b[^>]*>/)?.[0];
    if (!statusTag || getXmlAttribute(statusTag, 'state') !== 'up') continue;

    const addressTags = block.match(/<address\b[^>]*\/?\s*>/g) ?? [];
    const ipv4Tag = addressTags.find((tag) => getXmlAttribute(tag, 'addrtype') === 'ipv4');
    const macTag = addressTags.find((tag) => getXmlAttribute(tag, 'addrtype') === 'mac');
    const ip = ipv4Tag ? getXmlAttribute(ipv4Tag, 'addr') : undefined;

    if (!ip || !isValidIpv4(ip)) continue;

    const hostnameTag = block.match(/<hostname\b[^>]*\/?\s*>/)?.[0];
    const mac = normalizeMacAddress(macTag ? getXmlAttribute(macTag, 'addr') : undefined);
    const hostname = hostnameTag ? getXmlAttribute(hostnameTag, 'name') : undefined;
    const vendor = macTag ? getXmlAttribute(macTag, 'vendor') : undefined;

    hosts.push({
      ip,
      ...(mac ? { mac } : {}),
      ...(hostname ? { hostname } : {}),
      ...(vendor ? { vendor } : {}),
    });
  }

  return hosts;
}

function getXmlAttribute(tag: string, name: string): string | undefined {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const value = tag.match(new RegExp(`\\b${escapedName}="([^"]*)"`))?.[1];
  return value ? decodeXmlEntities(value) : undefined;
}

function decodeXmlEntities(value: string): string {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function isValidIpv4(value: string): boolean {
  const parts = value.split('.');
  return parts.length === 4 && parts.every((part) => /^\d{1,3}$/.test(part) && Number(part) <= 255);
}
