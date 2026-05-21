const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getIo } = require('../socket/gateway');

exports.broadcastAlert = async (req, res) => {
  try {
    const { message } = req.body;
    const io = getIo();
    if (io) {
      io.emit('TACTICAL_ALERT', { message, timestamp: new Date() });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to broadcast' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    
    if (!user || user.password_hash !== password) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '1d' });
    res.json({ token, user: user.toSafeJSON() });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
};

exports.demoLogin = async (req, res) => {
  try {
    const { role } = req.body;
    
    let email = `demo-${role.toLowerCase()}@rescue.local`;
    let password = 'DEMO';

    if (role === 'ADMIN') { email = 'command@rescue.in'; password = 'RESCUE2024'; }
    if (role === 'RESPONDER') { email = 'ndrf1@rescue.in'; password = 'RESCUE2024'; }

    let user = await User.findOne({ where: { email } });
    if (!user) {
      user = await User.create({
        name: `Demo ${role}`,
        email,
        password_hash: password,
        role,
        is_available: true
      });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '1d' });
    res.json({ token, user: user.toSafeJSON() });
  } catch (error) {
    console.error('Demo login error', error);
    res.status(500).json({ error: 'Failed to demo login' });
  }
};

exports.getResponders = async (req, res) => {
  try {
    const responders = await User.findAll({ where: { role: 'RESPONDER' } });
    res.json(responders.map(r => r.toSafeJSON()));
  } catch(err) {
    res.status(500).json({ error: 'Failed to fetch responders' });
  }
};
