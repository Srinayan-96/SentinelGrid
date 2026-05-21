const express = require('express');
const { QueryTypes } = require('sequelize');
const User = require('../models/User');
const { sequelize } = require('../config/database');
const { requireAuth } = require('../middleware/auth');
const { requireRoles } = require('../middleware/roles');

const router = express.Router();

// Legacy + public convenience: allow fetching responders without auth
router.get('/responders', async (_req, res) => {
  const responders = await User.findAll({ where: { role: 'RESPONDER' }, order: [['is_available', 'DESC']] });
  res.json(responders.map((r) => r.toSafeJSON()));
});

router.get('/me', requireAuth, async (req, res) => {
  res.json(req.user.toSafeJSON());
});

router.patch('/me/location', requireAuth, requireRoles('RESPONDER'), async (req, res) => {
  const { lat, lng } = req.body;
  await req.user.update({
    location: { type: 'Point', coordinates: [lng, lat] },
    is_online: true,
  });
  res.json(req.user.toSafeJSON());
});

router.get('/:id/stats', requireAuth, async (req, res) => {
  const user = await User.findByPk(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  const [rating] = await sequelize.query(
    'SELECT ROUND(COALESCE(AVG(score),0)::numeric, 2) as rating FROM ratings WHERE responder_id = :id',
    { replacements: { id: user.id }, type: QueryTypes.SELECT }
  );
  res.json({
    missions: user.total_missions,
    saves: user.total_saves,
    rating: Number(rating.rating || 0),
  });
});

module.exports = router;
