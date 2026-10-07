const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getIo } = require('../socket/gateway');
const { AuthenticationError, NotFoundError } = require('../errors/AppError');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key_123';

exports.citizenLogin = asyncHandler(async (req, res) => {
  const { name, state, phone } = req.body;
  
  let user = phone ? await User.findOne({ where: { phone, role: 'CITIZEN' } }) : null;
  
  if (!user) {
    user = await User.create({
      name,
      email: `citizen_${Date.now()}@sentinel.grid`,
      password: 'citizen_no_pass',
      role: 'CITIZEN',
      phone,
      state,
    });
  }

  const token = jwt.sign(
    { id: user.id, role: user.role, name: user.name, state: user.state },
    JWT_SECRET,
    { expiresIn: '8h' }
  );

  res.json({ token, user: { id: user.id, name: user.name, role: user.role, state: user.state } });
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ where: { email } });

  if (!user || !(await user.comparePassword(password))) {
    throw new AuthenticationError('Invalid credentials');
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
});

exports.demoLogin = asyncHandler(async (req, res) => {
  const { role } = req.body;
  const normalized = role.toUpperCase();

  let lookupEmail;
  let responseRole = normalized;
  if (normalized === 'ADMIN' || normalized === 'COMMAND') {
    lookupEmail = 'command@rescue.in';
    responseRole = 'ADMIN';
  } else if (normalized === 'RESPONDER') {
    lookupEmail = 'ndrf1@rescue.in'; 
    responseRole = 'RESPONDER';
  } else {
    throw new AuthenticationError('Invalid demo role');
  }

  const user = await User.findOne({ where: { email: lookupEmail } });
  if (!user) throw new NotFoundError('Demo user not found');

  const token = jwt.sign(
    {
      id: user.id,
      role: user.role,
      name: user.name,
      unit_name: user.unit_name,
      force_id: user.force_id,
      state: user.state,
    },
    JWT_SECRET,
    { expiresIn: '8h' }
  );

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      role: responseRole,
      unit_name: user.unit_name,
      force_id: user.force_id,
      state: user.state,
    }
  });
});

exports.broadcastAlert = asyncHandler(async (req, res) => {
  const { message } = req.body;
  const io = getIo();
  if (io) {
    io.emit('system.alert', { message, timestamp: new Date().toISOString() });
    io.emit('TACTICAL_ALERT', { message, timestamp: new Date().toISOString() }); // Legacy support
  }
  res.json({ success: true });
});

exports.getResponders = asyncHandler(async (req, res) => {
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
      is_available: u.is_available,
    }))
  );
});

exports.getCurrentUser = asyncHandler(async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AuthenticationError('Unauthorized');
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findByPk(decoded.id);
    if (!user) throw new NotFoundError('User not found');
    res.json(user);
  } catch (err) {
    throw new AuthenticationError('Invalid token');
  }
});
