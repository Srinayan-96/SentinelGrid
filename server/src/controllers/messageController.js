const Message = require('../models/Message');
const { getIo } = require('../socket/gateway');
const axios = require('axios');

exports.sendMessage = async (req, res) => {
  try {
    const { incidentId, content } = req.body;
    const senderId = req.user.id;
    const role = req.user.role;

    // Save User message
    const msg = await Message.create({
      incident_id: incidentId,
      sender_id: senderId,
      content,
      is_ai: false,
      role
    });

    const io = getIo();
    if (io) {
      io.to(incidentId).emit('CHAT_MESSAGE', msg);
    }

    // AI Mediation Logic: Proactive help on every message for demo
    setTimeout(async () => {
      try {
        const aiMsg = await Message.create({
          incident_id: incidentId,
          sender_id: null,
          content: `[Tactical AI Copilot]: I am monitoring this frequency. Responder is ${Math.floor(Math.random()*10)} mins out. Citizen, maintain high ground. Responder, confirm oxygen kit is ready.`,
          is_ai: true,
          role: 'AI'
        });
        if (io) io.to(incidentId).emit('CHAT_MESSAGE', aiMsg);
      } catch (aiErr) {
        console.error('AI Mediator failed to save message:', aiErr.message);
      }
    }, 1500);

    res.json(msg);
  } catch (err) {
    res.status(500).json({ error: 'Chat failed' });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const { incidentId } = req.params;
    const messages = await Message.findAll({
      where: { incident_id: incidentId },
      order: [['created_at', 'ASC']]
    });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Fetch messages failed' });
  }
};
