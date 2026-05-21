const User = require('../models/User');

function registerResponderHandlers(io, socket) {
  socket.on('responder:checkin', async ({ lat, lng }) => {
    if (!socket.data.userId) return;
    if (typeof lat !== 'number' || typeof lng !== 'number') return;

    await User.update(
      { location: { type: 'Point', coordinates: [lng, lat] }, is_online: true },
      { where: { id: socket.data.userId } }
    );

    io.emit('responder:location', { userId: socket.data.userId, lat, lng });
  });
}

module.exports = { registerResponderHandlers };
