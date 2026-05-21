const express = require('express');
const router = express.Router();
const Incident = require('../models/Incident');
const Facility = require('../models/Facility');
const User = require('../models/User');
const { triageIncident } = require('../services/triage');
const sequelize = require('../config/database');
const { getIo } = require('../socket/gateway');
const authOptional = require('../middleware/authOptional');

const { enrichIncidentsList } = require('../services/incidentService');

function clampNum(x, fallback) {
  const n = Number(x);
  return Number.isFinite(n) ? n : fallback;
}

// File SOS
router.post('/', async (req, res) => {
  try {
    // Support both TS schema and legacy CitizenView schema
    const {
      type,
      severity,
      description,
      people_affected,
      lat,
      lng,
      state,
      reporter_id,
      title
    } = req.body || {};

    const finalType = type || (title ? 'RESCUE' : undefined);
    const finalSeverity = severity || 'MEDIUM';
    const finalDescription = description || title || '';
    const finalPeople = clampNum(people_affected, 1);
    const finalLat = clampNum(lat, null);
    const finalLng = clampNum(lng, null);

    // Run Triage
    const triageResult = await triageIncident({
      type: finalType,
      people_affected: finalPeople,
      description: finalDescription,
      state
    });

    // Create Incident
    const incident = await Incident.create({
      type: finalType,
      severity: finalSeverity,
      description: finalDescription,
      people_affected: finalPeople,
      location: { type: 'Point', coordinates: [finalLng, finalLat] },
      state,
      reporter_id,
      ...triageResult
    });

    const enriched = (await enrichIncidentsList([incident]))[0];

    const io = getIo();
    if (io) io.emit('NEW_INCIDENT', enriched);

    res.status(201).json(enriched);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Incidents
router.get('/', async (req, res) => {
  try {
    const { state, status, assignedTo } = req.query;
    const where = {};
    if (state) where.state = state;
    if (status) where.status = status;
    if (assignedTo) where.assigned_to = assignedTo;

    const incidents = await Incident.findAll({ where, order: [['created_at', 'DESC']] });
    const enriched = await enrichIncidentsList(incidents);
    res.json(enriched);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Incident by ID
router.get('/:id', async (req, res) => {
  try {
    const incident = await Incident.findByPk(req.params.id);
    if (!incident) return res.status(404).json({ error: 'Incident not found' });
    const enriched = (await enrichIncidentsList([incident]))[0];
    res.json(enriched);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Assign Incident
router.patch('/:id/assign', async (req, res) => {
  try {
    // Support TS assignment payload and legacy payload
    const { facilityId, assignedUnit, responderId, responder_id } = req.body || {};
    const incident = await Incident.findByPk(req.params.id);

    if (!incident) return res.status(404).json({ error: 'Incident not found' });

    const currentAssigned = Array.isArray(incident.assigned_to) ? incident.assigned_to : (incident.assigned_to ? [incident.assigned_to] : []);
    const rId = responderId || responder_id;

    if (rId && !currentAssigned.includes(rId)) {
        await incident.update({
          assigned_unit: assignedUnit || incident.assigned_unit,
          assigned_to: [...currentAssigned, rId],
          status: 'ASSIGNED'
        });
        await User.update({ is_available: false }, { where: { id: rId } });
    }

    if (facilityId) {
      await Facility.update({ is_available: false }, { where: { id: facilityId } });
    }

    const enriched = (await enrichIncidentsList([incident]))[0];

    const io = getIo();
    if (io) {
      io.emit('INCIDENT_ASSIGNED', enriched);
      io.emit('NEW_INCIDENT', enriched);
    }

    res.json(enriched);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Claim mission (legacy responder portal)
router.patch('/:id/claim', authOptional, async (req, res) => {
  try {
    const incident = await Incident.findByPk(req.params.id);
    if (!incident) return res.status(404).json({ error: 'Incident not found' });
    
    // Safety check: Don't allow claiming if already assigned to another unit
    if (incident.status !== 'OPEN' && incident.status !== 'UNCOMPLETED') {
       return res.status(400).json({ error: `Mission already ${incident.status}` });
    }
    
    let responderId = req.auth?.id || req.body?.responderId || req.body?.responder_id;
    if (!responderId) {
      const fallbackUser = await User.findOne({ where: { role: 'RESPONDER' } });
      if (fallbackUser) responderId = fallbackUser.id;
    }
    
    if (!responderId) return res.status(401).json({ error: 'Unauthorized: No Responder ID' });

    await incident.update({
      assigned_to: [responderId], // Ensure it's an array for consistency
      status: 'ASSIGNED'
    });
    
    // Release responder availability
    await User.update({ is_available: false }, { where: { id: responderId } });

    const enriched = (await enrichIncidentsList([incident]))[0];
    const io = getIo();
    if (io) {
      io.emit('INCIDENT_ASSIGNED', enriched);
      io.emit('NEW_INCIDENT', enriched);
    }

    res.json(enriched);
  } catch (error) {
    console.error("CLAIM_ERROR:", error);
    res.status(500).json({ error: error.message });
  }
});

// Update Status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const incident = await Incident.findByPk(req.params.id);

    if (!incident) return res.status(404).json({ error: 'Incident not found' });

    await incident.update({ status });
    
    const enriched = (await enrichIncidentsList([incident]))[0];

    const io = getIo();
    if (io) {
      io.emit('INCIDENT_ASSIGNED', enriched);
      io.emit('NEW_INCIDENT', enriched);
    }

    res.json(enriched);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Resolve Incident
router.patch('/:id/resolve', async (req, res) => {
  try {
    const { people_saved, resources_used, notes } = req.body;
    const incident = await Incident.findByPk(req.params.id);

    if (!incident) return res.status(404).json({ error: 'Incident not found' });

    await incident.update({
      people_saved,
      status: 'RESOLVED',
      ai_summary: notes // Store final notes in summary for now
    });

    // Mark responders as available again
    const assignedIds = Array.isArray(incident.assigned_to) ? incident.assigned_to : (incident.assigned_to ? [incident.assigned_to] : []);
    if (assignedIds.length > 0) {
        await User.update({ is_available: true }, { where: { id: assignedIds } });
    }
    await Facility.update({ is_available: true }, { where: { name: incident.assigned_unit } });

    const enriched = (await enrichIncidentsList([incident]))[0];

    const io = getIo();
    if (io) {
      io.emit('INCIDENT_ASSIGNED', enriched);
      io.emit('NEW_INCIDENT', enriched);
    }

    res.json(enriched);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Citizen confirmation of resolution
router.patch('/:id/citizen-confirm', async (req, res) => {
  try {
    const { confirmed, notes, photo_url } = req.body;
    const incident = await Incident.findByPk(req.params.id);

    if (!incident) return res.status(404).json({ error: 'Incident not found' });

    const newStatus = confirmed ? 'COMPLETED' : 'UNCOMPLETED';

    await incident.update({
      status: newStatus,
      ai_summary: notes ? `${incident.ai_summary || ''}\n\n[Citizen Feedback]: ${notes}` : incident.ai_summary,
      photo_url: photo_url || incident.photo_url
    });

    const enriched = (await enrichIncidentsList([incident]))[0];

    const io = getIo();
    if (io) {
      io.emit('INCIDENT_ASSIGNED', enriched);
      io.emit('NEW_INCIDENT', enriched);
    }

    res.json(enriched);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin Force Complete (Mark as Closed/Failed by Admin)
router.patch('/:id/admin-complete', async (req, res) => {
  try {
    const { reason } = req.body;
    const incident = await Incident.findByPk(req.params.id);
    if (!incident) return res.status(404).json({ error: 'Incident not found' });

    // Admin force close = COMPLETED (definitively closed, removed from active list)
    // Note: UNCOMPLETED is only for citizen-escalated cases that need redeployment
    await incident.update({ 
      status: 'COMPLETED',
      ai_summary: `${incident.ai_summary || ''}\n\n[ADMIN FORCE CLOSE - FAILED]: ${reason || 'No reason provided.'}`
    });

    const assignedIds = Array.isArray(incident.assigned_to) ? incident.assigned_to : (incident.assigned_to ? [incident.assigned_to] : []);
    if (assignedIds.length > 0) {
      await User.update({ is_available: true }, { where: { id: assignedIds } });
    }

    const enriched = (await enrichIncidentsList([incident]))[0];
    const io = getIo();
    if (io) {
      io.emit('INCIDENT_ASSIGNED', enriched);
      io.emit('NEW_INCIDENT', enriched);
    }
    res.json(enriched);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Help Not Arriving - Escalation
router.post('/:id/escalate', async (req, res) => {
  try {
    const incident = await Incident.findByPk(req.params.id);
    if (!incident) return res.status(404).json({ error: 'Incident not found' });

    await incident.update({ 
      ai_urgency: 'CRITICAL',
      ai_summary: `${incident.ai_summary || ''}\n\n[TACTICAL ALERT]: Citizen reported rescue squad not arriving!`
    });

    const enriched = (await enrichIncidentsList([incident]))[0];
    const io = getIo();
    if (io) {
      io.emit('TACTICAL_ALERT', { 
        message: `CRITICAL: Help not arriving for mission ${incident.title || incident.id}`,
        incident: enriched 
      });
      io.emit('NEW_INCIDENT', enriched);
    }
    res.json(enriched);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
