module.exports = function initSocket(io) {

  // In-memory store for responder locations
  const responderLocations = {};

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Join a room per role and specific incident
    socket.on('join', ({ userId, role, incidentId }) => {
      socket.join(`role:${role}`);
      if (userId) socket.join(`user:${userId}`);
      if (incidentId) socket.join(`incident:${incidentId}`);
      
      socket.userId = userId;
      socket.role = role;
      console.log(`User ${userId} (${role}) joined`);
    });

    socket.on('join:incident', ({ incidentId }) => {
      socket.join(`incident:${incidentId}`);
    });

    // ── INCIDENT EVENTS ──────────────────────────

    socket.on('incident:new', (incident) => {
      io.to('role:COMMAND').emit('incident:new', incident);
      io.to('role:RESPONDER').emit('incident:new', incident);
    });

    socket.on('incident:updated', (incident) => {
      io.emit('incident:updated', incident);
    });

    socket.on('incident:dispatched', ({ incident, responderId }) => {
      io.emit('incident:updated', incident);
      // Notify specific responder
      io.to(`user:${responderId}`).emit('mission:assigned', incident);
    });

    // ── RESPONDER LOCATION ───────────────────────

    socket.on('responder:location', ({ userId, lat, lng, incidentId }) => {
      responderLocations[userId] = { lat, lng, updatedAt: Date.now() };

      // Broadcast to command + anyone watching this incident
      io.to('role:COMMAND').emit('responder:location', { userId, lat, lng });
      if (incidentId) {
        io.to(`incident:${incidentId}`).emit('responder:location', {
          userId, lat, lng, incidentId
        });
      }
    });

    // ── CHAT EVENTS ──────────────────────────────

    socket.on('chat:message', async (msg) => {
      // msg = { incidentId, senderId, senderName, senderRole, text }
      const message = {
        ...msg,
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
      };

      // Save to DB
      try {
        const Message = require('../models/Message');
        await Message.create({
          incident_id: msg.incidentId,
          sender_id:   msg.senderId,
          sender_name: msg.senderName,
          sender_role: msg.senderRole,
          text:        msg.text
        });
      } catch (e) {
        console.error('Message save failed:', e.message);
      }

      // Broadcast to everyone in this incident room
      io.to(`incident:${msg.incidentId}`).emit('chat:message', message);
    });

    // ── DISCONNECT ───────────────────────────────

    socket.on('disconnect', () => {
      if (socket.userId) {
        delete responderLocations[socket.userId];
        io.to('role:COMMAND').emit('responder:offline', { userId: socket.userId });
      }
    });
  });
};
