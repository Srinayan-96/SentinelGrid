const request = require('supertest');
const express = require('express');
const errorHandler = require('../src/middleware/errorHandler');
const Incident = require('../src/models/Incident');
const User = require('../src/models/User');
const Assignment = require('../src/models/Assignment');

jest.unmock('../src/services/triage');
const { triageIncident } = require('../src/services/triage');
jest.mock('../src/services/triage');

const app = express();
app.use(express.json());
// Inject fake user for auth
app.use((req, res, next) => {
  req.user = { id: 'admin-1', role: 'COMMAND' };
  req.auth = { id: 'admin-1' };
  next();
});
app.use('/api/incidents', require('../src/routes/incidents'));
app.use(errorHandler);

describe('E2E Workflow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should process full SOS -> Assign -> Resolve flow', async () => {
    // 1. SOS (Create)
    triageIncident.mockResolvedValue({
      ai_urgency: 'CRITICAL',
      ai_summary: 'Flood',
      ai_resources: ['BOAT'],
      spam_score: 0.01,
      mode: 'GEMINI_AI'
    });
    Incident.create.mockResolvedValue({ id: '123e4567-e89b-12d3-a456-426614174000', status: 'OPEN' });

    const createRes = await request(app).post('/api/incidents').send({
      type: 'FLOOD',
      lat: 10, lng: 10,
      people_affected: 50
    });
    expect(createRes.status).toBe(201);

    // 2. Assign
    const mockIncident = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      status: 'OPEN',
      update: jest.fn().mockResolvedValue(true)
    };
    Incident.findByPk.mockResolvedValue(mockIncident);
    User.findByPk.mockResolvedValue({ id: '987fcdeb-51a2-43d7-9012-3456789abcde', force_id: 'NDRF-1', update: jest.fn() });

    const assignRes = await request(app).patch('/api/incidents/123e4567-e89b-12d3-a456-426614174000/assign').send({
      responderId: '987fcdeb-51a2-43d7-9012-3456789abcde'
    });
    expect(assignRes.status).toBe(200);
    expect(mockIncident.update).toHaveBeenCalledWith(expect.objectContaining({ status: 'ASSIGNED' }), expect.any(Object));
    expect(Assignment.create).toHaveBeenCalled();

    // 3. Resolve
    const resolveRes = await request(app).patch('/api/incidents/123e4567-e89b-12d3-a456-426614174000/resolve').send({
      people_saved: 50,
      notes: 'All safe'
    });
    expect(resolveRes.status).toBe(200);
    expect(mockIncident.update).toHaveBeenCalledWith(expect.objectContaining({ status: 'RESOLVED', people_saved: 50 }), expect.any(Object));
  });
});
