const fs = require('fs/promises');
const path = require('path');
const { sequelize } = require('../config/database');

async function runMigrations() {
  const migrationPath = path.join(__dirname, '..', 'migrations', '001_init.sql');
  const sql = await fs.readFile(migrationPath, 'utf8');

  try {
    await sequelize.authenticate();
    await sequelize.query(sql);
    console.log('Schema migration applied: 001_init.sql');
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
