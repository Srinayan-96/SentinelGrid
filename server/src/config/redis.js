// ═══════════════════════════════════════════════════
// Redis Configuration — ioredis Client
// ═══════════════════════════════════════════════════
//
// Sets up two Redis clients:
// 1. `redis` — General purpose (cache, session store)
// 2. `redisPub` / `redisSub` — Dedicated pub/sub pair
//    (Redis requires separate connections for pub/sub)
//
// Used for:
// - Real-time incident broadcasting via pub/sub
// - Socket.io Redis adapter (multi-instance scaling)
// - Session/token blacklist caching
// ═══════════════════════════════════════════════════

const Redis = require('ioredis');
const logger = require('../utils/logger');

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// ─── General Purpose Client ─────────────────────
const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: 3,
  retryDelayOnFailover: 100,
  lazyConnect: false,
});

// ─── Pub/Sub Dedicated Clients ──────────────────
// Redis pub/sub requires separate connections because
// a subscribed client can't send regular commands
const redisPub = new Redis(redisUrl);
const redisSub = new Redis(redisUrl);

// ─── Connection Event Handlers ──────────────────
redis.on('connect', () => {
  logger.info('✅ Redis general client connected');
});

redis.on('error', (err) => {
  logger.error('❌ Redis general client error:', err.message);
});

redisPub.on('connect', () => {
  logger.info('✅ Redis pub client connected');
});

redisSub.on('connect', () => {
  logger.info('✅ Redis sub client connected');
});

redisPub.on('error', (err) => {
  logger.error('❌ Redis pub error:', err.message);
});

redisSub.on('error', (err) => {
  logger.error('❌ Redis sub error:', err.message);
});

module.exports = { redis, redisPub, redisSub };
