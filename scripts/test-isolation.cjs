const { SignJWT } = require('jose');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const envFile = fs.readFileSync(path.resolve(__dirname, '../.env.local'), 'utf8');
let authSecret = '';
for (const line of envFile.split('\n')) {
  if (line.startsWith('AUTH_SECRET=')) {
    authSecret = line.split('=')[1].trim().replace(/^["']|["']$/g, '');
  }
}

const secretKey = new TextEncoder().encode(authSecret);
const dbPath = path.resolve(__dirname, '../data/endpoint-manager.sqlite');
const db = new Database(dbPath);

async function makeToken(userId, username) {
  return await new SignJWT({
    userId,
    username,
    sessionId: 'test-session-' + Date.now(),
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1d')
    .sign(secretKey);
}

async function runTests() {
  console.log('=== STARTING RBAC ISOLATION TEST SUITE ===\n');

  // 1. Get users
  const mem1 = db.prepare("SELECT u.id, u.username, r.name as role FROM users u JOIN user_roles ur ON u.id = ur.user_id JOIN roles r ON ur.role_id = r.id WHERE u.username = 'mem1'").get();
  const admin = db.prepare("SELECT u.id, u.username, r.name as role FROM users u JOIN user_roles ur ON u.id = ur.user_id JOIN roles r ON ur.role_id = r.id WHERE u.username = 'admin'").get();

  console.log('Test User 1 (Restricted):', mem1);
  console.log('Test User 2 (Super Admin):', admin);

  const mem1Token = await makeToken(mem1.id, mem1.username);
  const adminToken = await makeToken(admin.id, admin.username);

  // Test 1: mem1 visits /admin/users
  console.log('\n--- Test 1: mem1 (VIEWER) visits /admin/users ---');
  const resMem1Users = await fetch('http://localhost:3000/admin/users', {
    headers: { Cookie: `em_session=${mem1Token}` },
  });
  const htmlMem1Users = await resMem1Users.text();
  const is403Blocked = htmlMem1Users.includes('HTTP 403 — FORBIDDEN ACCESS') && htmlMem1Users.includes('الوصول غير مصرح به');
  const leaksUsersList = htmlMem1Users.includes('إجمالي المستخدمين') && htmlMem1Users.includes('باقات منتهية الصلاحية');

  console.log('HTTP Status:', resMem1Users.status);
  console.log('Contains Access Denied (403):', is403Blocked ? 'PASS (Blocked)' : 'FAIL');
  console.log('Leaks User Management Table:', leaksUsersList ? 'FAIL (Leaked!)' : 'PASS (Not Leaked)');

  // Test 2: mem1 visits /admin/roles
  console.log('\n--- Test 2: mem1 (VIEWER) visits /admin/roles ---');
  const resMem1Roles = await fetch('http://localhost:3000/admin/roles', {
    headers: { Cookie: `em_session=${mem1Token}` },
  });
  const htmlMem1Roles = await resMem1Roles.text();
  const isRolesBlocked = htmlMem1Roles.includes('HTTP 403 — FORBIDDEN ACCESS');
  console.log('Contains Access Denied (403):', isRolesBlocked ? 'PASS (Blocked)' : 'FAIL');

  // Test 3: mem1 visits /admin/settings
  console.log('\n--- Test 3: mem1 (VIEWER) visits /admin/settings ---');
  const resMem1Settings = await fetch('http://localhost:3000/admin/settings', {
    headers: { Cookie: `em_session=${mem1Token}` },
  });
  const htmlMem1Settings = await resMem1Settings.text();
  const isSettingsBlocked = htmlMem1Settings.includes('HTTP 403 — FORBIDDEN ACCESS');
  console.log('Contains Access Denied (403):', isSettingsBlocked ? 'PASS (Blocked)' : 'FAIL');

  // Test 3.5: Verify Sidebar hiding in dashboard
  console.log('\n--- Test 3.5: Sidebar Navigation Role Filtering ---');
  const resMem1Dash = await fetch('http://localhost:3000/dashboard', {
    headers: { Cookie: `em_session=${mem1Token}` },
  });
  const htmlMem1Dash = await resMem1Dash.text();
  const mem1HasAdminGroup = htmlMem1Dash.includes('الإدارة وضبط النظام') || htmlMem1Dash.includes('Administration');
  console.log('mem1 (VIEWER) Sidebar hides Administration menu:', !mem1HasAdminGroup ? 'PASS (Hidden)' : 'FAIL (Exposed!)');

  const resAdminDash = await fetch('http://localhost:3000/dashboard', {
    headers: { Cookie: `em_session=${adminToken}` },
  });
  const htmlAdminDash = await resAdminDash.text();
  const adminHasAdminGroup = htmlAdminDash.includes('الإدارة وضبط النظام') || htmlAdminDash.includes('Administration');
  console.log('admin (SUPER_ADMIN) Sidebar shows Administration menu:', adminHasAdminGroup ? 'PASS (Visible)' : 'FAIL (Missing)');

  // Test 4: admin (SUPER_ADMIN) visits /admin/users
  console.log('\n--- Test 4: admin (SUPER_ADMIN) visits /admin/users ---');
  const resAdminUsers = await fetch('http://localhost:3000/admin/users', {
    headers: { Cookie: `em_session=${adminToken}` },
  });
  const htmlAdminUsers = await resAdminUsers.text();
  const isAdminAllowed = htmlAdminUsers.includes('لوحة السوبر أدمن — إدارة المستخدمين والباقات');
  console.log('HTTP Status:', resAdminUsers.status);
  console.log('Access Super Admin Dashboard:', isAdminAllowed ? 'PASS (Allowed)' : 'FAIL');

  // Test 5: Check Audit Logs recorded the security alert
  console.log('\n--- Test 5: Audit Log Security Event Verification ---');
  const latestAlerts = db.prepare("SELECT action, user_id, username_snapshot, resource_type, metadata, timestamp FROM audit_logs WHERE action = 'SECURITY_ALERT' ORDER BY timestamp DESC LIMIT 3").all();
  console.log('Logged Security Alerts count:', latestAlerts.length);
  latestAlerts.forEach((a, idx) => {
    console.log(`Alert #${idx + 1}: [${a.action}] user=${a.username_snapshot} resource=${a.resource_type} meta=${a.metadata}`);
  });

  db.close();
  console.log('\n=== ALL TESTS FINISHED ===');
}

runTests().catch(console.error);
