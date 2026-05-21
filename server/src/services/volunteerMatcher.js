const { QueryTypes } = require('sequelize');
const axios = require('axios');
const { sequelize } = require('../config/database');

async function findNearbyResponders(incidentId, limit = 10) {
  const rows = await sequelize.query(
    `
      SELECT u.id as responder_id, u.force_id, u.skills, u.total_missions as current_load,
             ST_Distance(i.location::geography, u.location::geography) / 1000.0 as distance_km
      FROM incidents i
      JOIN users u ON u.role = 'RESPONDER' AND u.is_available = true
      WHERE i.id = :incidentId AND u.location IS NOT NULL
      ORDER BY distance_km ASC
      LIMIT :limit
    `,
    {
      replacements: { incidentId, limit },
      type: QueryTypes.SELECT,
    }
  );
  return rows;
}

async function rankRespondersWithAI(incident, responders) {
  const { data } = await axios.post(
    `${process.env.AI_SERVICE_URL}/match-volunteers`,
    { incident, responders },
    { timeout: 15000 }
  );
  return data.matches || [];
}

module.exports = { findNearbyResponders, rankRespondersWithAI };
