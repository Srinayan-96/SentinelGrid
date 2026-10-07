const asyncHandler = require('express-async-handler');
const Assignment = require('../models/Assignment');
const Incident = require('../models/Incident');
const Facility = require('../models/Facility');
const User = require('../models/User');
const { triageIncident } = require('../services/triage');
const { enrichIncidentsList } = require('../services/incidentService');
const { fetchAndSeedNearbyFacilities } = require('../services/placesService');
const { getIo } = require('../socket/gateway');
const { NotFoundError, ConflictError } = require('../errors/AppError');
const sequelize = require('../config/database');

function clampNum(x, fallback) {
  const n = Number(x);
  return Number.isFinite(n) ? n : fallback;
}

exports.createIncident = asyncHandler(async (req, res) => {
  const { title, description, type, severity, people_affected, lat, lng, state, reporter_id } = req.body;
  const finalType = type || (title ? 'RESCUE' : 'OTHER');
  const finalSeverity = severity || 'MEDIUM';
  const finalDescription = description || title || '';

  const triageResult = await triageIncident({
    type: finalType,
    people_affected: people_affected,
    description: finalDescription,
    state,
  });

  const incident = await Incident.create({
    title,
    type: finalType,
    severity: finalSeverity,
    description: finalDescription,
    people_affected: people_affected,
    location: { type: 'Point', coordinates: [lng, lat] },
    state,
    reporter_id,
    ...triageResult,
  });

  const enriched = (await enrichIncidentsList([incident]))[0];
  
  // Seed nearby facilities dynamically from Google API (Async)
  fetchAndSeedNearbyFacilities(lat, lng, state).then(async (newFacilities) => {
    if (newFacilities.length > 0) {
      const io = getIo();
      if (io) io.emit('facilities.updated', newFacilities);
    }
  });

  const io = getIo();
  if (io) io.emit('incident.created', enriched);

  res.status(201).json(enriched);
});

exports.getIncidents = asyncHandler(async (req, res) => {
  const { state, status, assignedTo, page, limit } = req.query;
  const where = {};
  if (state) where.state = state;
  if (status) where.status = status;
  if (assignedTo) where.assigned_to = assignedTo;

  const offset = (page - 1) * limit;

  const { rows, count } = await Incident.findAndCountAll({
    where,
    order: [['created_at', 'DESC']],
    limit,
    offset,
  });

  const enriched = await enrichIncidentsList(rows);
  res.json(enriched);
});

exports.getIncidentById = asyncHandler(async (req, res) => {
  const incident = await Incident.findByPk(req.params.id);
  if (!incident) throw new NotFoundError('Incident not found');
  const enriched = (await enrichIncidentsList([incident]))[0];
  res.json(enriched);
});
exports.assignIncident = asyncHandler(async (req, res) => {
  const { facilityId, assignedUnit, responderId, responder_id } = req.body;
  let rId = responderId || responder_id;

  if (assignedUnit && !rId) {
    const responderUser = await User.findOne({ where: { unit_name: assignedUnit, role: 'RESPONDER' } });
    if (responderUser) {
      rId = responderUser.id;
    }
  }

  const result = await sequelize.transaction(async (t) => {
    const incident = await Incident.findByPk(req.params.id, { lock: t.LOCK.UPDATE, transaction: t });
    if (!incident) throw new NotFoundError('Incident not found');
    if (incident.status !== 'OPEN' && incident.status !== 'UNCOMPLETED') {
      throw new ConflictError(`Mission already ${incident.status}`);
    }

    const currentAssigned = Array.isArray(incident.assigned_to) ? incident.assigned_to : (incident.assigned_to ? [incident.assigned_to] : []);

    if (rId && !currentAssigned.includes(rId)) {
      await incident.update(
        {
          assigned_unit: assignedUnit || incident.assigned_unit,
          assigned_to: [...currentAssigned, rId],
          status: 'ASSIGNED',
        },
        { transaction: t }
      );
      
      const responder = await User.findByPk(rId, { transaction: t });
      await responder.update({ is_available: false }, { transaction: t });

      await Assignment.create({
        incident_id: incident.id,
        responder_id: rId,
        force_id: responder.force_id,
        status: 'ASSIGNED'
      }, { transaction: t });
    }

    if (facilityId) {
      await Facility.update({ is_available: false }, { where: { id: facilityId }, transaction: t });
    }

    return incident;
  });

  const enriched = (await enrichIncidentsList([result]))[0];
  const io = getIo();
  if (io) {
    io.emit('incident.assigned', enriched);
    io.emit('incident.updated', enriched);
  }
  res.json(enriched);
});

exports.claimIncident = asyncHandler(async (req, res) => {
  let responderId = req.auth?.id || req.body?.responderId || req.body?.responder_id;
  if (!responderId) {
    const fallbackUser = await User.findOne({ where: { role: 'RESPONDER' } });
    if (fallbackUser) responderId = fallbackUser.id;
  }
  if (!responderId) throw new NotFoundError('Unauthorized: No Responder ID');

  const result = await sequelize.transaction(async (t) => {
    const incident = await Incident.findByPk(req.params.id, { lock: t.LOCK.UPDATE, transaction: t });
    if (!incident) throw new NotFoundError('Incident not found');
    if (incident.status !== 'OPEN' && incident.status !== 'UNCOMPLETED') {
      throw new ConflictError(`Mission already ${incident.status}`);
    }

    await incident.update(
      {
        assigned_to: [responderId],
        status: 'ASSIGNED',
      },
      { transaction: t }
    );
    
    const responder = await User.findByPk(responderId, { transaction: t });
    await responder.update({ is_available: false }, { transaction: t });
    
    await Assignment.create({
      incident_id: incident.id,
      responder_id: responderId,
      force_id: responder.force_id,
      status: 'ASSIGNED'
    }, { transaction: t });

    return incident;
  });

  const enriched = (await enrichIncidentsList([result]))[0];
  const io = getIo();
  if (io) {
    io.emit('incident.assigned', enriched);
    io.emit('incident.updated', enriched);
  }
  res.json(enriched);
});

exports.updateStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const incident = await Incident.findByPk(req.params.id);
  if (!incident) throw new NotFoundError('Incident not found');

  await incident.update({ status });
  const enriched = (await enrichIncidentsList([incident]))[0];

  const io = getIo();
  if (io) io.emit('incident.status_changed', enriched);

  res.json(enriched);
});

exports.resolveIncident = asyncHandler(async (req, res) => {
  const { people_saved, resources_used, notes } = req.body;
  
  const result = await sequelize.transaction(async (t) => {
    const incident = await Incident.findByPk(req.params.id, { lock: t.LOCK.UPDATE, transaction: t });
    if (!incident) throw new NotFoundError('Incident not found');

    await incident.update({
      people_saved,
      status: 'RESOLVED',
      ai_summary: notes,
    }, { transaction: t });

    const assignedIds = Array.isArray(incident.assigned_to) ? incident.assigned_to : (incident.assigned_to ? [incident.assigned_to] : []);
    if (assignedIds.length > 0) {
      await User.update({ is_available: true }, { where: { id: assignedIds }, transaction: t });
      await Assignment.update({ status: 'RESOLVED', resolved_at: new Date(), people_saved, resources_used: resources_used || [], notes }, { where: { incident_id: incident.id, status: 'ASSIGNED' }, transaction: t });
    }
    if (incident.assigned_unit) {
      await Facility.update({ is_available: true }, { where: { name: incident.assigned_unit }, transaction: t });
    }
    return incident;
  });

  const enriched = (await enrichIncidentsList([result]))[0];
  const io = getIo();
  if (io) io.emit('incident.resolved', enriched);
  res.json(enriched);
});

exports.citizenConfirm = asyncHandler(async (req, res) => {
  const { confirmed, notes, photo_url } = req.body;
  const incident = await Incident.findByPk(req.params.id);
  if (!incident) throw new NotFoundError('Incident not found');

  const newStatus = confirmed ? 'COMPLETED' : 'UNCOMPLETED';
  await incident.update({
    status: newStatus,
    ai_summary: notes ? `${incident.ai_summary || ''}\n\n[Citizen Feedback]: ${notes}` : incident.ai_summary,
    photo_url: photo_url || incident.photo_url,
  });

  const enriched = (await enrichIncidentsList([incident]))[0];
  const io = getIo();
  if (io) io.emit('incident.updated', enriched);
  res.json(enriched);
});

exports.adminComplete = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  
  const result = await sequelize.transaction(async (t) => {
    const incident = await Incident.findByPk(req.params.id, { lock: t.LOCK.UPDATE, transaction: t });
    if (!incident) throw new NotFoundError('Incident not found');

    await incident.update({
      status: 'COMPLETED',
      ai_summary: `${incident.ai_summary || ''}\n\n[ADMIN FORCE CLOSE - FAILED]: ${reason || 'No reason provided.'}`,
    }, { transaction: t });

    const assignedIds = Array.isArray(incident.assigned_to) ? incident.assigned_to : (incident.assigned_to ? [incident.assigned_to] : []);
    if (assignedIds.length > 0) {
      await User.update({ is_available: true }, { where: { id: assignedIds }, transaction: t });
    }
    return incident;
  });

  const enriched = (await enrichIncidentsList([result]))[0];
  const io = getIo();
  if (io) io.emit('incident.updated', enriched);
  res.json(enriched);
});

exports.escalateIncident = asyncHandler(async (req, res) => {
  const incident = await Incident.findByPk(req.params.id);
  if (!incident) throw new NotFoundError('Incident not found');

  await incident.update({
    ai_urgency: 'CRITICAL',
    ai_summary: `${incident.ai_summary || ''}\n\n[TACTICAL ALERT]: Citizen reported rescue squad not arriving!`,
  });

  const enriched = (await enrichIncidentsList([incident]))[0];
  const io = getIo();
  if (io) {
    io.emit('system.alert', {
      message: `CRITICAL: Help not arriving for mission ${incident.title || incident.id}`,
      incident: enriched,
    });
    io.emit('incident.updated', enriched);
  }
  res.json(enriched);
});
