const { Sequelize } = require('sequelize');
const path = require('path');

// Try loading .env from multiple locations — works both locally and in Docker
// Local:  server/src/config/ → ../../../.env  (project root)
// Docker: /app/src/config/   → /app/.env      (container root)
const envPaths = [
  path.resolve(__dirname, '../../../.env'),  // local dev (3 levels up to project root)
  path.resolve(__dirname, '../../.env'),     // inside /app/src → /app/.env
  path.resolve(__dirname, '../.env'),
];
for (const p of envPaths) {
  require('dotenv').config({ path: p });
  if (process.env.DATABASE_URL) break;
}

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('❌ DATABASE_URL is not set. Check your .env file or docker-compose environment.');
  process.exit(1);
}

const sequelize = new Sequelize(dbUrl, {
  dialect: 'postgres',
  logging: false,
  define: {
    timestamps: true,
    underscored: true,
  },
});

module.exports = sequelize;
