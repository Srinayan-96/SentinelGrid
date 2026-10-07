const jwt = require('jsonwebtoken');
const initSocket = require('../src/socket/index');
const User = require('../src/models/User');

jest.mock('jsonwebtoken');

describe('Socket.IO Logic', () => {
  let io;
  let mw;
  
  beforeEach(() => {
    io = {
      use: jest.fn((fn) => { mw = fn; }),
      on: jest.fn(),
      to: jest.fn().mockReturnThis(),
      emit: jest.fn(),
    };
    initSocket(io);
  });

  it('should reject connection without token', async () => {
    const mockSocket = {
      handshake: { auth: {} }
    };

    const next = jest.fn();
    await mw(mockSocket, next);

    expect(next).toHaveBeenCalledWith(expect.any(Error));
    expect(next.mock.calls[0][0].message).toBe('Authentication error');
  });

  it('should accept connection with valid token and attach user data', async () => {
    const mockSocket = {
      handshake: { auth: { token: 'valid-token' } }
    };

    jwt.verify.mockReturnValue({ id: 'user-1' });
    User.findByPk.mockResolvedValue({ id: 'user-1', role: 'RESPONDER' });

    const next = jest.fn();
    await mw(mockSocket, next);

    expect(next).toHaveBeenCalledWith(); // no args meaning success
    expect(mockSocket.userId).toEqual('user-1');
    expect(mockSocket.role).toEqual('RESPONDER');
  });
});
