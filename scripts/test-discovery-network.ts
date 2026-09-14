import assert from 'node:assert/strict';
import {
  normalizeMacAddress,
  parseNeighborTable,
  parseNmapXml,
} from '../src/server/services/discovery-network';

const nmapXml = `<?xml version="1.0"?>
<nmaprun>
  <host>
    <status state="up" reason="arp-response" />
    <address addr="192.168.1.10" addrtype="ipv4" />
    <address addr="ac-64-62-68-45-94" addrtype="mac" vendor="ACME &amp; Co" />
    <hostnames><hostname name="router.local" type="PTR" /></hostnames>
  </host>
  <host>
    <status state="up" reason="echo-reply" />
    <address addr="192.168.1.20" addrtype="ipv4" />
  </host>
  <host>
    <status state="down" reason="no-response" />
    <address addr="192.168.1.30" addrtype="ipv4" />
  </host>
</nmaprun>`;

assert.deepEqual(parseNmapXml(nmapXml), [
  {
    ip: '192.168.1.10',
    mac: 'AC:64:62:68:45:94',
    hostname: 'router.local',
    vendor: 'ACME & Co',
  },
  { ip: '192.168.1.20' },
]);

const windowsArp = `
Interface: 192.168.1.5 --- 0xa
  Internet Address      Physical Address      Type
  192.168.1.1           ac-64-62-68-45-94     dynamic
  224.0.0.251           01-00-5e-00-00-fb     static
`;
const linuxNeighbors = `
192.168.1.2 dev eth0 lladdr 02:42:ac:11:00:02 REACHABLE
192.168.1.3 dev eth0 FAILED
`;
const macOsArp = `? (192.168.1.4) at a8:20:66:12:34:56 on en0 ifscope [ethernet]`;

assert.deepEqual(Object.fromEntries(parseNeighborTable(windowsArp)), {
  '192.168.1.1': 'AC:64:62:68:45:94',
});
assert.deepEqual(Object.fromEntries(parseNeighborTable(linuxNeighbors)), {
  '192.168.1.2': '02:42:AC:11:00:02',
});
assert.deepEqual(Object.fromEntries(parseNeighborTable(macOsArp)), {
  '192.168.1.4': 'A8:20:66:12:34:56',
});

assert.equal(normalizeMacAddress('aabb.ccdd.eeff'), 'AA:BB:CC:DD:EE:FF');
assert.equal(normalizeMacAddress('00:00:00:00:00:00'), undefined);
assert.equal(normalizeMacAddress('FF:FF:FF:FF:FF:FF'), undefined);
assert.equal(normalizeMacAddress('01:00:5E:00:00:FB'), undefined);
assert.equal(normalizeMacAddress('invalid'), undefined);

console.log('Discovery network parser tests passed.');
