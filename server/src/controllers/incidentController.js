const jwt = require('jsonwebtoken');
const Incident = require('../models/Incident');
const User = require('../models/User');
const { getIo } = require('../socket/gateway');
const { sequelize } = require('../config/database');
const { enrichIncidentsList } = require('../services/incidentService');

const axios = require('axios');

exports.createIncident = async (req, res) => {
  try {
    const { title, description, latitude, longitude } = req.body;
    
    // Call FastAPI AI Service
    let triage = { urgency: 'MODERATE', category: 'OTHER', survivalTips: [], summary: 'Awaiting AI analysis...', resources: ['BASIC_GEAR'] };
    try {
      const aiResponse = await axios.post(process.env.AI_SERVICE_URL + '/api/triage', {
        description
      });
      triage = aiResponse.data;
    } catch (aiError) {
      console.error('AI Service fetch failed, using fallback triage:', aiError.message);
    }

    // 1. Create the Incident
    const incident = await Incident.create({
      title,
      description,
      location: { type: 'Point', coordinates: [longitude, latitude] },
      urgency: triage.urgency,
      category: triage.category,
      ai_urgency: triage.urgency,
      ai_category: triage.category,
      ai_summary: triage.summary,
      ai_resources_needed: triage.resources,
      survival_tips: triage.survivalTips,
      status: 'OPEN' // Temporarily OPEN until we find someone
    });

    // 2. Spatial Query: Find nearest Responder using PostGIS
    // ST_DistanceSphere returns distance in meters.
    const nearestResponder = await User.findOne({
      where: {
        role: 'RESPONDER',
        is_available: true,
        is_online: true // Ideally only dispatch to online, but for demo let's grab any
      },
      attributes: {
        include: [
          [
            sequelize.fn(
              'ST_DistanceSphere',
              sequelize.col('location'),
              sequelize.fn('ST_SetSRID', sequelize.fn('ST_MakePoint', longitude, latitude), 4326)
            ),
            'distance_meters'
          ]
        ]
      },
      order: [
        [
          sequelize.fn(
            'ST_DistanceSphere',
            sequelize.col('location'),
            sequelize.fn('ST_SetSRID', sequelize.fn('ST_MakePoint', longitude, latitude), 4326)
          ),
          'ASC'
        ]
      ]
    });

    // Removed auto-assignment logic as per manual dispatch requirement.
    // Incident remains in OPEN status until command center manual assignment.
    
    const enriched = (await enrichIncidentsList([incident]))[0];
    const payload = enriched;
    // Broadcast
    const io = getIo();
    if(io) {
      if(incident.status === 'ASSIGNED') {
        io.emit('INCIDENT_ASSIGNED', payload); // Target everyone for demo visual
      } else {
        io.emit('NEW_INCIDENT', payload);
      }
    }

    // Generate GUEST token for anonymous citizen so they can chat
    let guestToken = null;
    if (!req.user) {
      guestToken = jwt.sign(
        { id: '00000000-0000-0000-0000-000000000000', role: 'CITIZEN' }, 
        process.env.JWT_SECRET || 'dev_secret', 
        { expiresIn: '1d' }
      );
    }

    res.status(201).json({ ...payload, token: guestToken });
  } catch (error) {
    console.error('Failed to create incident:', error);
    res.status(500).json({ error: 'Creation failed' });
  }
};

exports.getIncidents = async (req, res) => {
  try {
    const incidents = await Incident.findAll({ 
      order: [['created_at', 'DESC']],
      include: [{ model: User, as: 'Responder', attributes: ['name', 'force_id', 'location'] }]
    });
    
    const formatted = await enrichIncidentsList(incidents);
    res.json(formatted);
  } catch (error) {
    console.error('Fetch failed:', error);
    res.status(500).json({ error: 'Fetch failed' });
  }
};

exports.acceptIncident = async (req, res) => {
  try {
    const { incidentId } = req.params;
    const responderId = req.user.id;

    const incident = await Incident.findByPk(incidentId);
    if (!incident) return res.status(404).json({ error: 'Incident not found' });
    if (incident.status !== 'OPEN') return res.status(400).json({ error: 'Incident already assigned' });

    const responder = await User.findByPk(responderId);
    
    const currentAssigned = Array.isArray(incident.assigned_to) ? incident.assigned_to : (incident.assigned_to ? [incident.assigned_to] : []);
    if (!currentAssigned.includes(responderId)) {
        incident.assigned_to = [...currentAssigned, responderId];
    }
    
    incident.status = 'ASSIGNED';
    await incident.save();

    const enriched = (await enrichIncidentsList([incident]))[0];
    const payload = enriched;

    const io = getIo();
    if (io) {
      io.emit('INCIDENT_ASSIGNED', payload);
    }

    res.json(payload);
  } catch (error) {
    console.error('Accept failed:', error);
    res.status(500).json({ error: 'Accept failed' });
  }
};
