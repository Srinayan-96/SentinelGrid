const cron = require('node-cron');
const axios = require('axios');
const { QueryTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const SituationReport = require('../models/SituationReport');
const { emitSitrep } = require('../socket/index');

async function buildKpiSnapshot() {
  const [row] = await sequelize.query(
    `
      SELECT
        COUNT(*) FILTER (WHERE status IN ('OPEN','ASSIGNED','IN_PROGRESS')) AS active_incidents,
        COALESCE(SUM(people_saved), 0) AS people_saved_total
      FROM incidents
    `,
    { type: QueryTypes.SELECT }
  );
  return row;
}

async function fetchGroupedIncidents() {
  return sequelize.query(
    `
      SELECT COALESCE(address, 'UNKNOWN_ZONE') AS zone,
             json_agg(json_build_object(
                'id', id, 'status', status, 'urgency', urgency, 'category', category, 'people_reported', people_reported
             )) AS incidents
      FROM incidents
      WHERE status IN ('OPEN','IN_PROGRESS')
      GROUP BY COALESCE(address, 'UNKNOWN_ZONE')
    `,
    { type: QueryTypes.SELECT }
  );
}

async function generateSitrep() {
  const grouped = await fetchGroupedIncidents();
  const stats = await buildKpiSnapshot();
  const estimated_people_at_risk = grouped.reduce((sum, zone) => {
    const zonePeople = (zone.incidents || []).reduce((acc, inc) => acc + (inc.people_reported || 0), 0);
    return sum + zonePeople;
  }, 0);

  const { data } = await axios.post(`${process.env.AI_SERVICE_URL}/sitrep`, {
    grouped_incidents: grouped,
    deployed_forces: [],
    estimated_people_at_risk,
    kpi_snapshot: stats,
  });

  const saved = await SituationReport.create({
    zone: data.zone,
    report_text: data.report_text,
    stats: data.stats || stats,
  });
  emitSitrep(saved.toJSON());
  return saved;
}

function startSitrepCron() {
  cron.schedule('*/15 * * * *', async () => {
    try {
      await generateSitrep();
    } catch (error) {
      // keep server alive
      console.error('Sitrep cron error', error.message);
    }
  });
}

module.exports = { generateSitrep, startSitrepCron };
