const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const { getIo } = require('../socket/gateway');
const authOptional = require('../middleware/authOptional');

router.get('/:incidentId', async (req, res) => {
  try {
    const whereClause = { incident_id: req.params.incidentId };
    if (req.query.channel) {
      whereClause.channel = req.query.channel;
    }
    const messages = await Message.findAll({
      where: whereClause,
      order: [['created_at', 'ASC']]
    });
    // Return objects with both text and content mapped safely for legacy frontend components
    res.json(messages.map(m => ({
      ...m.toJSON(),
      content: m.text,
      incidentId: m.incident_id
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', authOptional, async (req, res) => {
  try {
    const { incidentId, incident_id, content, text, sender_id, sender_name, sender_role, channel, is_ai } = req.body;
    const finalIncidentId = incident_id || incidentId;
    const finalText = text || content || '';
    
    // Support JWT auth info or payload fallback
    const finalSenderId = sender_id || req.auth?.id;
    const finalSenderName = sender_name || req.auth?.name || (is_ai ? 'Tactical AI' : 'Operator');
    const finalSenderRole = sender_role || req.auth?.role || (is_ai ? 'AI' : 'SYSTEM');

    const message = await Message.create({
      incident_id: finalIncidentId,
      sender_id: finalSenderId,
      sender_name: finalSenderName,
      sender_role: finalSenderRole,
      text: finalText,
      channel: channel || 'GENERAL'
    });

    const safePayload = {
      ...message.toJSON(),
      content: finalText,
      incidentId: finalIncidentId,
      is_ai: !!is_ai
    };

    const io = getIo();
    if (io) {
      io.emit('CHAT_MESSAGE', safePayload);
    }

    res.status(201).json(safePayload);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
