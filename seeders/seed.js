/**
 * Database seeder — creates default roles and admin user.
 * Safe to run multiple times (idempotent).
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { sequelize, Role, User } = require('../src/models');

const ROLES = [
  {
    name: 'admin',
    permissions: [
      'users:read', 'users:write', 'users:delete',
      'records:read', 'records:write', 'records:delete',
      'dashboard:read',
    ],
  },
  {
    name: 'analyst',
    permissions: [
      'records:read', 'records:write',
      'dashboard:read',
    ],
  },
  {
    name: 'viewer',
    permissions: [
      'records:read',
      'dashboard:read',
    ],
  },
];

const ADMIN_USER = {
  username: 'admin',
  email: 'admin@finance.com',
  password: 'Admin@123',
};

async function seed() {
  try {
    await sequelize.sync({ force: false });
    console.log('📦 Database synced.\n');

    // Seed roles
    for (const roleData of ROLES) {
      const [role, created] = await Role.findOrCreate({
        where: { name: roleData.name },
        defaults: roleData,
      });
      console.log(`  ${created ? '✅ Created' : '⏭️  Exists'} role: ${role.name}`);
    }

    // Seed admin user
    const adminRole = await Role.findOne({ where: { name: 'admin' } });
    const [adminUser, created] = await User.findOrCreate({
      where: { email: ADMIN_USER.email },
      defaults: {
        ...ADMIN_USER,
        roleId: adminRole.id,
      },
    });

    console.log(`\n  ${created ? '✅ Created' : '⏭️  Exists'} admin user: ${adminUser.email}`);
    if (created) {
      console.log(`     Username: ${ADMIN_USER.username}`);
      console.log(`     Password: ${ADMIN_USER.password}`);
    }

    console.log('\n🎉 Seeding complete!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    // Only exit if run as standalone script
    if (require.main === module) {
      process.exit(1);
    }
    throw error;
  }
}

// Allow running as standalone script or importing
if (require.main === module) {
  seed();
}

module.exports = seed;
