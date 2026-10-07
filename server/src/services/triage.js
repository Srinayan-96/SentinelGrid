const axios = require('axios');

async function triageIncident(incident) {
  try {
    const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://ai-service:8000';
    
    // Convert Node incident format to FastAPI schema
    const payload = {
      incident_id: incident.id || 'NEW_INCIDENT',
      description: incident.description,
      category: incident.type,
      people_affected: incident.people_affected
    };
    
    const response = await axios.post(`${AI_SERVICE_URL}/api/triage`, payload, {
      timeout: 15000 // 15 seconds max
    });

    const aiData = response.data;

    return {
      ai_urgency: aiData.urgency || 'HIGH',
      ai_summary: aiData.summary || 'Emergency reported.',
      ai_resources: aiData.resources_needed || [],
      spam_score: aiData.spam_score || 0.0,
      eta_minutes: Math.floor(Math.random() * (30 - 10) + 10), // We keep ETA stubbed for now or update FastAPI to return it
      mode: 'GEMINI_AI'
    };
  } catch (error) {
    console.warn('AI Triage failed, using safe defaults:', error.message);
    return {
      ai_urgency: 'HIGH',
      ai_summary: `Emergency reported. ${incident.people_affected || 1} persons affected.`,
      ai_resources: [],
      spam_score: 0.01,
      eta_minutes: 15,
      mode: 'FALLBACK'
    };
  }
}

module.exports = { triageIncident };
