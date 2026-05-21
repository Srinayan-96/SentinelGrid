const axios = require('axios');

async function triageIncident({ description, photo_url, category, incident_id }) {
  try {
    const url = `${process.env.AI_SERVICE_URL}/triage`;
    const { data } = await axios.post(
      url,
      { description, photo_url, category, incident_id },
      { timeout: 15000 }
    );
    return data;
  } catch (error) {
    console.error('AI Triage failed, using fallback:', error.message);
    
    // Fallback AI response to ensure the SOS dispatch doesn't crash
    const safeDesc = typeof description === 'string' ? description : '';
    return {
      urgency: 'HIGH',
      category: category || 'OTHER',
      spam_score: 0.1,
      resources_needed: ['First Aid', 'Emergency Transport'],
      summary: `Automated Fallback Triage: High urgency incident. Needs immediate assessment. (Original Description: ${safeDesc.substring(0, 50)}...)`
    };
  }
}

module.exports = { triageIncident };
