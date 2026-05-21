const { sequelize } = require('../config/database');
const runMigrations = require('./runMigrations');

async function sync() {
  try {
    await sequelize.authenticate();
    await runMigrations();
    console.log('Database migration sync complete.');
    process.exit(0);
  } catch (err) {
    console.error('Failed to sync database:', err);
    process.exit(1);
  }
}

sync();
