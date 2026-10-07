const { claimIncident } = require('../src/controllers/incidentController');
const Incident = require('../src/models/Incident');
const User = require('../src/models/User');
const Assignment = require('../src/models/Assignment');

describe('Incident Claim Concurrency', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should accept claim if incident is OPEN', async () => {
    const req = {
      params: { id: 'incident-1' },
      auth: { id: 'responder-1' }
    };
    const res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };

    const mockIncident = {
      id: 'incident-1',
      status: 'OPEN',
      update: jest.fn().mockResolvedValue(true)
    };

    const mockResponder = {
      id: 'responder-1',
      force_id: 'force-1',
      update: jest.fn().mockResolvedValue(true)
    };

    Incident.findByPk.mockResolvedValue(mockIncident);
    User.findByPk.mockResolvedValue(mockResponder);

    await claimIncident(req, res);

    expect(Incident.findByPk).toHaveBeenCalledWith('incident-1', expect.objectContaining({
      lock: 'UPDATE' // Ensuring row lock was requested
    }));
    expect(mockIncident.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'ASSIGNED' }),
      expect.any(Object)
    );
    expect(Assignment.create).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalled();
  });

  it('should throw ConflictError if incident is already ASSIGNED', async () => {
    const req = {
      params: { id: 'incident-1' },
      auth: { id: 'responder-2' } // Second responder trying to claim
    };
    const res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };

    const mockIncident = {
      id: 'incident-1',
      status: 'ASSIGNED',
      update: jest.fn()
    };

    Incident.findByPk.mockResolvedValue(mockIncident);

    await expect(claimIncident(req, res)).rejects.toThrow('Mission already ASSIGNED');
    expect(mockIncident.update).not.toHaveBeenCalled();
    expect(Assignment.create).not.toHaveBeenCalled();
  });
});
