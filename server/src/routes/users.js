const express = require('express');
const { QueryTypes } = require('sequelize');
const User = require('../models/User');
const sequelize = require('../config/database');
const { requireAuth } = require('../middleware/auth');
const { requireRoles } = require('../middleware/roles');
const asyncHandler = require('express-async-handler');
const { z } = require('zod');
const validateRequest = require('../middleware/validateRequest');

const router = express.Router();

const updateLocationSchema = z.object({
  body: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  })
});

const getStatsSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  })
});

exports.getResponders = asyncHandler(async (_req, res) => {
  const responders = await User.findAll({ where: { role: 'RESPONDER' }, order: [['is_available', 'DESC']] });
  res.json(responders.map((r) => r.toSafeJSON()));
});

exports.getMe = asyncHandler(async (req, res) => {
  res.json(req.user.toSafeJSON());
});

exports.updateLocation = asyncHandler(async (req, res) => {
  const { lat, lng } = req.body;
  await req.user.update({
    location: { type: 'Point', coordinates: [lng, lat] },
    is_online: true,
  });
  res.json(req.user.toSafeJSON());
});

exports.getStats = asyncHandler(async (req, res) => {
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

router.get('/responders', this.getResponders);
router.get('/me', requireAuth, this.getMe);
router.patch('/me/location', requireAuth, requireRoles('RESPONDER'), validateRequest(updateLocationSchema), this.updateLocation);
router.get('/:id/stats', requireAuth, validateRequest(getStatsSchema), this.getStats);

module.exports = router;
