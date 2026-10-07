const asyncHandler = require('express-async-handler');
const Message = require('../models/Message');
const { getIo } = require('../socket/gateway');

exports.getMessages = asyncHandler(async (req, res) => {
  const whereClause = { incident_id: req.params.incidentId };
  if (req.query.channel) {
    whereClause.channel = req.query.channel;
  }
  const messages = await Message.findAll({
    where: whereClause,
    order: [['created_at', 'ASC']],
  });
  
  res.json(
    messages.map((m) => ({
      ...m.toJSON(),
      content: m.text,
      incidentId: m.incident_id,
    }))
  );
});

exports.sendMessage = asyncHandler(async (req, res) => {
  const {
    incidentId,
    incident_id,
    content,
    text,
    sender_id,
    sender_name,
    sender_role,
    channel,
    is_ai,
  } = req.body;

  const finalIncidentId = incident_id || incidentId;
  const finalText = text || content || '';

  const finalSenderId = sender_id || req.auth?.id;
  const finalSenderName = sender_name || req.auth?.name || (is_ai ? 'Tactical AI' : 'Operator');
  const finalSenderRole = sender_role || req.auth?.role || (is_ai ? 'AI' : 'SYSTEM');

  const message = await Message.create({
    incident_id: finalIncidentId,
    sender_id: finalSenderId,
    sender_name: finalSenderName,
    sender_role: finalSenderRole,
    text: finalText,
    channel: channel || 'GENERAL',
  });

  const safePayload = {
    ...message.toJSON(),
    content: finalText,
    incidentId: finalIncidentId,
    is_ai: !!is_ai,
  };

  const io = getIo();
  if (io) {
    io.emit('message.created', safePayload);
    io.emit('CHAT_MESSAGE', safePayload); // Legacy support
  }

  res.status(201).json(safePayload);
});
