const express = require('express');
const router = express.Router();
const Facility = require('../models/Facility');
const asyncHandler = require('express-async-handler');
const { z } = require('zod');
const validateRequest = require('../middleware/validateRequest');

const getFacilitiesSchema = z.object({
  query: z.object({
    state: z.string().optional(),
    type: z.string().optional(),
  })
});

exports.getFacilities = asyncHandler(async (req, res) => {
  const { state, type } = req.query;
  const where = {};
  if (state) where.state = state;
  if (type) where.type = type;

  const facilities = await Facility.findAll({ where });
  res.json(facilities);
});

router.get('/', validateRequest(getFacilitiesSchema), this.getFacilities);

module.exports = router;
