const path = require('path');

// Load .env — try multiple paths so it works locally AND inside Docker
// Local:  /Fullstack/disaster-relief/server/src/app.js → ../../.env = project root
// Docker: /app/src/app.js → ../../.env = /.env (wrong), ../.env = /app/.env (right if copied)
const _envPaths = [
  path.resolve(__dirname, '../../.env'),   // local dev (project root)
  path.resolve(__dirname, '../.env'),      // Docker: /app/.env
  path.resolve(__dirname, '.env'),
];
for (const _p of _envPaths) {
  require('dotenv').config({ path: _p });
  if (process.env.DATABASE_URL) break;
}

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const sequelize = require('./config/database');
const initSocket = require('./socket');
const { setIo } = require('./socket/gateway');

// Models
const User = require('./models/User');
const Incident = require('./models/Incident');
const Facility = require('./models/Facility');
const Message = require('./models/Message');

// Seeds
const seedFacilities = require('./seeds/facilities');
const seedUsers = require('./seeds/users');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

// Wire the io instance into the gateway so all routes can call getIo()
setIo(io);

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/incidents', require('./routes/incidents'));
app.use('/api/facilities', require('./routes/facilities'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/users', require('./routes/users'));

// Initialize Sockets
initSocket(io);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Enable PostGIS extensions (requires superuser or pre-installed)
    await sequelize.query('CREATE EXTENSION IF NOT EXISTS postgis;');
    await sequelize.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');

    // Sync Database
    await sequelize.sync({ force: process.env.NODE_ENV === 'development' });
    console.log('✅ Database synced');

    // Seed Data
    if (process.env.NODE_ENV === 'development') {
      await seedFacilities(Facility);
      await seedUsers(User);
    }

    server.listen(PORT, () => {
      console.log(`🚀 SentinelGrid Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
  }
};

startServer();
