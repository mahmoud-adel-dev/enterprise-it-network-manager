const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');
const crypto = require('crypto');

const dbPath = path.resolve(__dirname, '../data/endpoint-manager.sqlite');
const db = new Database(dbPath);

async function addMem1User() {
  const username = 'mem1';
  const displayName = 'mem1';
  const email = 'mem1@enterprise.local';
  const plainPassword = 'P@ssw0rd';
  const passwordHash = await bcrypt.hash(plainPassword, 12);

  // 1. Ensure SUPER_ADMIN role exists
  let superAdminRole = db.prepare("SELECT id FROM roles WHERE name = 'SUPER_ADMIN'").get();
  if (!superAdminRole) {
    const roleId = crypto.randomUUID();
    db.prepare("INSERT INTO roles (id, name, description) VALUES (?, 'SUPER_ADMIN', 'Full system access and tenant management')").run(roleId);
    superAdminRole = { id: roleId };
    console.log('Created SUPER_ADMIN role');
  }

  // 2. Check if user already exists
  const existingUser = db.prepare("SELECT id FROM users WHERE username = ?").get(username);
  let userId;

  if (existingUser) {
    userId = existingUser.id;
    db.prepare(`
      UPDATE users 
      SET display_name = ?, 
          email = ?, 
          password_hash = ?, 
          enabled = 1, 
          force_password_change = 0,
          failed_login_count = 0, 
          locked_until = NULL, 
          plan_name = 'ENTERPRISE_LIFETIME',
          plan_expires_at = NULL,
          max_managed_devices = 500,
          updated_at = unixepoch() * 1000
      WHERE id = ?
    `).run(displayName, email, passwordHash, userId);
    console.log(`Updated existing user: ${username}`);
  } else {
    userId = crypto.randomUUID();
    db.prepare(`
      INSERT INTO users (
        id, username, display_name, email, password_hash, 
        enabled, force_password_change, failed_login_count, 
        created_at, updated_at, plan_name, plan_expires_at, max_managed_devices
      )
      VALUES (?, ?, ?, ?, ?, 1, 0, 0, unixepoch() * 1000, unixepoch() * 1000, 'ENTERPRISE_LIFETIME', NULL, 500)
    `).run(userId, username, displayName, email, passwordHash);
    console.log(`Inserted new user: ${username}`);
  }

  // 3. Ensure user has SUPER_ADMIN role
  const userRole = db.prepare("SELECT * FROM user_roles WHERE user_id = ? AND role_id = ?").get(userId, superAdminRole.id);
  if (!userRole) {
    db.prepare("INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)").run(userId, superAdminRole.id);
    console.log(`Assigned SUPER_ADMIN role to ${username}`);
  }

  // 4. Test password verification
  const isValid = await bcrypt.compare(plainPassword, passwordHash);
  console.log('Password verification check:', isValid ? 'PASS' : 'FAIL');

  console.log('User created successfully:');
  console.log({
    id: userId,
    username,
    displayName,
    email,
    password: plainPassword,
    role: 'SUPER_ADMIN',
    plan: 'ENTERPRISE_LIFETIME (صلاحية مفتوحة)',
    status: 'مفعل (ACTIVE)'
  });

  db.close();
}

addMem1User().catch(console.error);
