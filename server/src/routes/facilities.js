const express = require('express');
const router = express.Router();
const Facility = require('../models/Facility');

router.get('/', async (req, res) => {
  try {
    const { state, type } = req.query;
    const where = {};
    if (state) where.state = state;
    if (type) where.type = type;

    const facilities = await Facility.findAll({ where });
    res.json(facilities);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
