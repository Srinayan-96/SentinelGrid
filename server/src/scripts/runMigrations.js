const fs = require('fs/promises');
const path = require('path');
const sequelize = require('../config/database');
const User = require('../models/User');

async function runMigrations() {
  const migrationPath = path.join(__dirname, '..', 'migrations', '001_init.sql');
  const sql = await fs.readFile(migrationPath, 'utf8');

  try {
    await sequelize.authenticate();
    await sequelize.query(sql);
    console.log('Schema migration applied: 001_init.sql');

    // Seed Data
    const count = await User.count();
    if (count === 0) {
      console.log('Seeding demo users...');
      await User.create({
        name: 'Command Center',
        email: 'cmd_admin',
        password: 'sentinel@2024',
        role: 'COMMAND',
        is_available: true,
        is_online: false
      });
      await User.create({
        name: 'NDRF Rescue Unit 1',
        email: 'ndrf1@rescue.in', // The old endpoint expected this, but login page sends force_id
        password: 'ndrf@2024',
        role: 'RESPONDER',
        force_id: 'NDRF-001',
        unit_name: 'Alpha Squad',
        is_available: true,
        is_online: false
      });
      console.log('Demo users seeded successfully.');
    }

    return true;
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = runMigrations;
