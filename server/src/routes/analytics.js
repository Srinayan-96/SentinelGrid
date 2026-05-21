const express = require('express');
const { QueryTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { requireAuth } = require('../middleware/auth');
const { requireRoles } = require('../middleware/roles');

const router = express.Router();

router.use(requireAuth, requireRoles('ADMIN'));

router.get('/kpis', async (req, res) => {
  const [kpis] = await sequelize.query(
    `
      SELECT
        COALESCE(SUM(people_saved),0) AS total_saved,
        COUNT(*) FILTER (WHERE status = 'RESOLVED') AS resolved,
        COUNT(*) FILTER (WHERE status IN ('OPEN','ASSIGNED','IN_PROGRESS')) AS pending,
        COALESCE(AVG(EXTRACT(EPOCH FROM (resolved_at - created_at)) / 60) FILTER (WHERE resolved_at IS NOT NULL),0) AS avg_response_time_min
      FROM incidents
    `,
    { type: QueryTypes.SELECT }
  );
  res.json(kpis);
});

router.get('/heatmap', async (req, res) => {
  const rows = await sequelize.query(
    `
      SELECT COALESCE(address, 'UNKNOWN') AS zone, COUNT(*)::int AS count
      FROM incidents
      GROUP BY COALESCE(address, 'UNKNOWN')
      ORDER BY count DESC
    `,
    { type: QueryTypes.SELECT }
  );
  res.json(rows);
});

router.get('/timeline', async (req, res) => {
  const rows = await sequelize.query(
    `
      SELECT date_trunc('hour', created_at) AS bucket, COUNT(*)::int AS incidents
      FROM incidents
      WHERE created_at >= NOW() - INTERVAL '24 hours'
      GROUP BY 1
      ORDER BY 1
    `,
    { type: QueryTypes.SELECT }
  );
  res.json(rows);
});

router.get('/forces', async (req, res) => {
  const rows = await sequelize.query(
    `
      SELECT force_id, COUNT(*)::int AS incidents,
             COALESCE(SUM(people_saved),0)::int AS people_saved
      FROM incidents
      WHERE force_id IS NOT NULL
      GROUP BY force_id
      ORDER BY incidents DESC
    `,
    { type: QueryTypes.SELECT }
  );
  res.json(rows);
});

module.exports = router;
