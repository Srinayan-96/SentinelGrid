const logger = require('../utils/logger');

async function notifyNearestResponders(incident, responders) {
  logger.info('Notifier dispatch simulated', {
    incidentId: incident.id,
    responderCount: responders.length,
  });
}

module.exports = { notifyNearestResponders };
