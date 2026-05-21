const express = require('express');
const SituationReport = require('../models/SituationReport');
const { requireAuth } = require('../middleware/auth');
const { requireRoles } = require('../middleware/roles');
const { generateSitrep } = require('../services/sitrep');

const router = express.Router();

router.get('/', requireAuth, requireRoles('ADMIN'), async (req, res) => {
  const rows = await SituationReport.findAll({ order: [['created_at', 'DESC']], limit: 200 });
  res.json(rows);
});

router.post('/generate', requireAuth, requireRoles('ADMIN'), async (req, res) => {
  const report = await generateSitrep();
  res.status(201).json(report);
});

module.exports = router;
