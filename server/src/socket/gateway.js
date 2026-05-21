let io;

/**
 * Store the io instance created in app.js.
 * Call this once after `new Server(httpServer)` in app.js.
 */
exports.setIo = (ioInstance) => {
  io = ioInstance;
};

exports.getIo = () => {
  if (!io) {
    console.warn('Socket.io not initialized yet — call setIo(io) in app.js first.');
  }
  return io;
};
