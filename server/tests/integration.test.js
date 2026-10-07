const request = require('supertest');
const express = require('express');
const errorHandler = require('../src/middleware/errorHandler');
const Incident = require('../src/models/Incident');

const app = express();
app.use(express.json());
app.use('/api/incidents', require('../src/routes/incidents'));
app.use(errorHandler);

describe('Backend Integration API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/incidents', () => {
    it('should validate request schema and block invalid payloads', async () => {
      const response = await request(app)
        .post('/api/incidents')
        .send({
          type: 'FLOOD'
        });
      
      expect(response.status).toBe(400);
      expect(response.body.error.message).toMatch(/validation error/i);
    });

    it('should create an incident successfully and return 201', async () => {
      Incident.create.mockResolvedValue({ id: 'inc-123', status: 'OPEN' });

      const response = await request(app)
        .post('/api/incidents')
        .send({
          type: 'FLOOD',
          severity: 'HIGH',
          lat: 12.34,
          lng: 56.78
        });

      expect(response.status).toBe(201);
      expect(Incident.create).toHaveBeenCalled();
    });
  });
});
