const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getIo } = require('../socket/gateway');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key_123';

// Citizen Login (Create or Find)
router.post('/citizen-login', async (req, res) => {
  try {
    const { name, state, phone } = req.body;
    
    // In a real app, we might verify phone. Here we create a temp citizen or find existing.
    let user = await User.findOne({ where: { phone, role: 'CITIZEN' } });
    
    if (!user) {
      user = await User.create({
        name,
        email: `citizen_${Date.now()}@sentinel.grid`, // Temp unique email
        password: 'citizen_no_pass', // Not used for citizens
        role: 'CITIZEN',
        phone,
        state
      });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, name: user.name, state: user.state },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({ token, user: { id: user.id, name: user.name, role: user.role, state: user.state } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Command & Responder Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { 
        id: user.id, 
        role: user.role, 
        name: user.name, 
        unit_name: user.unit_name, 
        force_id: user.force_id, 
        state: user.state 
      },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({ 
      token, 
      user: { 
        id: user.id, 
        name: user.name, 
        role: user.role, 
        unit_name: user.unit_name, 
        force_id: user.force_id, 
        state: user.state 
      } 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Demo Login (legacy UI support)
router.post('/demo-login', async (req, res) => {
  try {
    const { role } = req.body || {};
    const normalized = (role || '').toUpperCase();

    // Map legacy ADMIN -> COMMAND user
    let lookupEmail;
    let responseRole = normalized;
    if (normalized === 'ADMIN') {
      lookupEmail = 'command@rescue.in';
      responseRole = 'ADMIN';
    } else if (normalized === 'RESPONDER') {
      lookupEmail = 'ndrf1@rescue.in'; 
      responseRole = 'RESPONDER';
    } else if (normalized === 'COMMAND') {
      lookupEmail = 'command@rescue.in';
      responseRole = 'ADMIN';
    } else {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const user = await User.findOne({ where: { email: lookupEmail } });
    if (!user) return res.status(404).json({ error: 'Demo user not found' });

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role, // keep DB role for server-side semantics
        name: user.name,
        unit_name: user.unit_name,
        force_id: user.force_id,
        state: user.state
      },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    // Return role expected by legacy UI without changing DB enum
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        role: responseRole,
        unit_name: user.unit_name,
        force_id: user.force_id,
        state: user.state
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to demo login' });
  }
});

// Broadcast tactical alert (legacy + TS)
router.post('/broadcast', async (req, res) => {
  try {
    const { message } = req.body || {};
    if (!message) return res.status(400).json({ error: 'message required' });
    const io = getIo();
    if (io) io.emit('TACTICAL_ALERT', { message, timestamp: new Date().toISOString() });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to broadcast' });
  }
});

// Responders list (legacy convenience)
router.get('/responders', async (req, res) => {
  try {
    const responders = await User.findAll({ where: { role: 'RESPONDER' } });
    res.json(
      responders.map((u) => ({
        id: u.id,
        name: u.name,
        role: 'RESPONDER',
        unit_name: u.unit_name,
        force_id: u.force_id,
        state: u.state,
        vehicle_type: u.vehicle_type,
        skills: u.skills,
        handled_cases: u.handled_cases,
        is_available: u.is_available
      }))
    );
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch responders' });
  }
});

// Get Current User
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findByPk(decoded.id);
    
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json(user);
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

module.exports = router;
