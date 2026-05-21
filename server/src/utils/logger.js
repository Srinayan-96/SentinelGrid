// ═══════════════════════════════════════════════════
// Winston Logger — Structured Logging
// ═══════════════════════════════════════════════════
//
// Production: JSON format to stdout (for log aggregation)
// Development: Colorized, human-readable console output
// ═══════════════════════════════════════════════════

const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    process.env.NODE_ENV === 'production'
      ? winston.format.json()
      : winston.format.combine(
          winston.format.colorize(),
          winston.format.printf(({ timestamp, level, message, ...meta }) => {
            const metaStr = Object.keys(meta).length 
              ? ` ${JSON.stringify(meta)}` 
              : '';
            return `${timestamp} [${level}]: ${message}${metaStr}`;
          })
        )
  ),
  transports: [
    new winston.transports.Console(),
  ],
  // Don't exit on uncaught exceptions — let the process manager handle it
  exitOnError: false,
});

module.exports = logger;
