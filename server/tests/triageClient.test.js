jest.unmock('../src/services/triage');
const { triageIncident } = require('../src/services/triage');
const axios = require('axios');

jest.mock('axios');

describe('AI Triage Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call ai-service and return correctly mapped response', async () => {
    const mockResponse = {
      data: {
        urgency: 'CRITICAL',
        summary: 'Massive flood in zone A.',
        resources_needed: ['BOAT', 'HELICOPTER'],
        spam_score: 0.05
      }
    };
    axios.post.mockResolvedValue(mockResponse);

    const result = await triageIncident({
      id: 'incident-123',
      description: 'Need help, water is rising!',
      type: 'FLOOD',
      people_affected: 20
    });

    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining('/api/triage'),
      expect.objectContaining({
        incident_id: 'incident-123',
        description: 'Need help, water is rising!',
        category: 'FLOOD',
        people_affected: 20
      }),
      expect.any(Object)
    );

    expect(result).toMatchObject({
      ai_urgency: 'CRITICAL',
      ai_summary: 'Massive flood in zone A.',
      ai_resources: ['BOAT', 'HELICOPTER'],
      spam_score: 0.05,
      mode: 'GEMINI_AI'
    });
  });

  it('should return fallback if ai-service fails', async () => {
    axios.post.mockRejectedValue(new Error('Network error'));

    const result = await triageIncident({
      id: 'incident-456',
      description: 'Small fire.',
      type: 'FIRE',
      people_affected: 5
    });

    expect(result).toMatchObject({
      ai_urgency: 'HIGH',
      ai_summary: 'Emergency reported. 5 persons affected.',
      mode: 'FALLBACK'
    });
  });
});
