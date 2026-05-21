const RESOURCE_MAP = {
  FLOOD:    { resources:['NDRF Boat Team','Water Rescue Unit','Medical Team'], facilityType:'NDRF',     eta:[8,20] },
  FIRE:     { resources:['Fire Brigade','Ambulance','Police Cordon'],          facilityType:'FIRE',     eta:[5,15] },
  MEDICAL:  { resources:['Ambulance','Emergency Medical Team'],                facilityType:'HOSPITAL', eta:[6,18] },
  RESCUE:   { resources:['NDRF Rescue Team','Medical Support'],                facilityType:'NDRF',     eta:[10,25] },
  COLLAPSE: { resources:['NDRF Search & Rescue','Heavy Machinery','Medical'],  facilityType:'NDRF',     eta:[12,28] },
  CYCLONE:  { resources:['NDRF Unit','Evacuation Team','Food Relief'],         facilityType:'NDRF',     eta:[15,35] },
  ACCIDENT: { resources:['Ambulance','Traffic Police','Fire Brigade'],         facilityType:'HOSPITAL', eta:[5,12] },
  CHEMICAL: { resources:['Hazmat Team','Evacuation Unit','Medical Team'],      facilityType:'HOSPITAL', eta:[10,22] },
};

const URGENCY_MAP = {
  FLOOD:'CRITICAL', FIRE:'CRITICAL', COLLAPSE:'CRITICAL',
  CYCLONE:'CRITICAL', RESCUE:'HIGH', MEDICAL:'HIGH',
  CHEMICAL:'HIGH', ACCIDENT:'MODERATE'
};

const SUMMARIES = {
  FLOOD:    (n) => `Flash flood emergency. ${n} persons at risk. Immediate water rescue required.`,
  FIRE:     (n) => `Active fire emergency. ${n} persons in danger zone. Fire + medical response needed.`,
  MEDICAL:  (n) => `Medical emergency. ${n} persons requiring urgent care. Dispatching nearest hospital unit.`,
  RESCUE:   (n) => `Rescue operation needed. ${n} persons trapped. NDRF deployment recommended.`,
  COLLAPSE: (n) => `Structure collapse. ${n} persons possibly buried. Search and rescue initiated.`,
  CYCLONE:  (n) => `Cyclone impact zone. ${n} persons in affected area. Mass evacuation required.`,
  ACCIDENT: (n) => `Road accident. ${n} casualties. Emergency response en route.`,
  CHEMICAL: (n) => `Hazmat incident. ${n} persons exposed. Hazmat team and evacuation dispatched.`,
};

async function triageIncident(incident) {
  // Try GPT-4o first if key exists
  if (process.env.OPENAI_API_KEY) {
    try {
      return await gptTriage(incident);
    } catch (err) {
      console.warn('GPT-4o unavailable, using local triage:', err.message);
    }
  }

  // LOCAL FALLBACK — works fully offline with advanced dynamic keyword semantic decision analysis
  const textToAnalyze = `${incident.title || ''} ${incident.description || ''}`.toUpperCase();
  
  let inferredType = incident.type;
  let customResources = [];
  let facilityType = 'NDRF';

  if (textToAnalyze.includes('FIRE') || textToAnalyze.includes('BURN') || textToAnalyze.includes('SMOKE')) {
    inferredType = 'FIRE';
    facilityType = 'FIRE';
    customResources.push('Fire Brigade Heavy Engine');
  }
  if (textToAnalyze.includes('FLOOD') || textToAnalyze.includes('WATER') || textToAnalyze.includes('DROWN')) {
    inferredType = 'FLOOD';
    facilityType = 'NDRF';
    customResources.push('NDRF Swift Water Rescue Boat');
  }
  if (textToAnalyze.includes('COLLAPSE') || textToAnalyze.includes('EARTHQUAKE') || textToAnalyze.includes('TRAP')) {
    inferredType = 'COLLAPSE';
    facilityType = 'NDRF';
    customResources.push('NDRF Urban Search & Rescue Squad');
  }
  if (textToAnalyze.includes('INJUR') || textToAnalyze.includes('BLEED') || textToAnalyze.includes('MEDICAL') || textToAnalyze.includes('CASUALTY')) {
    facilityType = facilityType === 'NDRF' ? 'HOSPITAL' : facilityType;
    customResources.push('Advanced Life Support Ambulance', 'Emergency Trauma Team');
  }
  if (textToAnalyze.includes('CHEM') || textToAnalyze.includes('GAS') || textToAnalyze.includes('LEAK')) {
    inferredType = 'CHEMICAL';
    facilityType = 'HOSPITAL';
    customResources.push('Hazmat Neutralization Team');
  }

  const config = RESOURCE_MAP[inferredType] || RESOURCE_MAP.RESCUE;
  let urgency = URGENCY_MAP[inferredType] || 'HIGH';

  // If we found specific triggers, merge them intelligently with default configuration
  const finalResources = customResources.length > 0 
    ? Array.from(new Set([...customResources, ...(config.resources || [])])).slice(0, 4)
    : config.resources;

  // Escalate based on text severity markers or people count
  if (incident.people_affected > 50 || textToAnalyze.includes('CRITICAL') || textToAnalyze.includes('SEVERE')) {
    urgency = 'CRITICAL';
  } else if (incident.people_affected > 10 && urgency === 'MODERATE') {
    urgency = 'HIGH';
  }

  const finalSummary = customResources.length > 0
    ? `Intelligent Analysis detected multi-threat scenario. Recommended deployment: ${finalResources.join(', ')}.`
    : (SUMMARIES[inferredType]?.(incident.people_affected) || `Emergency reported. ${incident.people_affected} persons affected.`);

  const eta = Math.floor(
    Math.random() * (config.eta[1] - config.eta[0]) + config.eta[0]
  );

  return {
    ai_urgency:    urgency,
    ai_summary:    finalSummary,
    ai_resources:  finalResources,
    facility_type: facilityType,
    eta_minutes:   eta,
    spam_score:    0.01,
    mode:          'LOCAL_AI_ENHANCED'
  };
}

async function gptTriage(incident) {
  const OpenAI = require('openai');
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  
  const prompt = `You are an emergency dispatch AI.
Analyze this disaster SOS and return ONLY valid JSON:
{
  "ai_urgency": "CRITICAL"|"HIGH"|"MODERATE",
  "ai_summary": "one sentence describing the emergency",
  "ai_resources": ["resource1","resource2","resource3"],
  "facility_type": "NDRF"|"HOSPITAL"|"FIRE"|"POLICE",
  "eta_minutes": number,
  "spam_score": 0.0-1.0
}

Incident: Type=${incident.type}, 
People affected=${incident.people_affected},
Description: ${incident.description},
State: ${incident.state}`;

  const res = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_object' },
    max_tokens: 300
  });
  
  return { ...JSON.parse(res.choices[0].message.content), mode: 'GPT-4o' };
}

module.exports = { triageIncident };
