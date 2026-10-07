const jwt = require('jsonwebtoken');
const { getIo } = require('./gateway');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key_123';

const responderLocations = {};

module.exports = function initSocket(io) {
  // Middleware for Authentication
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
      if (!token) return next(new Error('Authentication error'));
      
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findByPk(decoded.id);
      
      if (!user) return next(new Error('User not found'));
      
      socket.userId = user.id;
      socket.role = user.role;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.userId} (${socket.role})`);
    
    // Automatically join role and user rooms based on verified identity
    socket.join(`role:${socket.role}`);
    socket.join(`user:${socket.userId}`);

    socket.on('incident:subscribe', ({ incidentId }) => {
      // In a real app, authorize if user can view this incident
      socket.join(`incident:${incidentId}`);
    });

    socket.on('incident:unsubscribe', ({ incidentId }) => {
      socket.leave(`incident:${incidentId}`);
    });

    // Responder Location Updates
    socket.on('responder.location_updated', async ({ lat, lng, incidentId }) => {
      if (socket.role !== 'RESPONDER') return;

      responderLocations[socket.userId] = { lat, lng, updatedAt: Date.now() };

      // Broadcast to command and incident watchers
      io.to('role:COMMAND').emit('responder.location_updated', { userId: socket.userId, lat, lng });
      if (incidentId) {
        io.to(`incident:${incidentId}`).emit('responder.location_updated', { userId: socket.userId, lat, lng });
      }

      // Persist to DB periodically or directly (throttle this in a real app)
      await User.update(
        { location: { type: 'Point', coordinates: [lng, lat] }, is_online: true, updated_at: new Date() },
        { where: { id: socket.userId } }
      );
    });

    // Chat Events
    socket.on('chat:join', (incidentId) => {
      socket.join(`chat:${incidentId}`);
    });

    socket.on('chat:send', (msgData) => {
      const message = {
        ...msgData,
        id: require('uuid').v4(),
        timestamp: new Date().toISOString()
      };
      
      // Broadcast to everyone in the incident chat room
      io.to(`chat:${msgData.incidentId}`).emit('chat:message', message);
    });

    socket.on('disconnect', async () => {
      console.log(`Socket disconnected: ${socket.userId}`);
      delete responderLocations[socket.userId];
      
      io.to('role:COMMAND').emit('responder.offline', { userId: socket.userId });

      if (socket.userId && socket.role === 'RESPONDER') {
        await User.update({ is_online: false }, { where: { id: socket.userId } });
      }
    });
  });
};
