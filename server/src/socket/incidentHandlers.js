function registerIncidentHandlers(io, socket) {
  socket.on('incident:subscribe', ({ incidentId }) => {
    if (incidentId) socket.join(`incident:${incidentId}`);
  });

  socket.on('join:zone', ({ lat, lng, radiusKm }) => {
    if (lat != null && lng != null && radiusKm != null) {
      socket.data.zone = { lat, lng, radiusKm };
    }
  });
}

module.exports = { registerIncidentHandlers };
