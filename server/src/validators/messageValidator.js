const { z } = require('zod');

const getMessagesSchema = z.object({
  params: z.object({
    incidentId: z.string().uuid(),
  }),
  query: z.object({
    channel: z.string().optional(),
  }),
});

const sendMessageSchema = z.object({
  body: z.object({
    incidentId: z.string().uuid().optional(),
    incident_id: z.string().uuid().optional(),
    content: z.string().optional(),
    text: z.string().optional(),
    sender_id: z.string().uuid().optional(),
    sender_name: z.string().optional(),
    sender_role: z.string().optional(),
    channel: z.string().optional(),
    is_ai: z.boolean().optional(),
  }).refine(data => data.incidentId || data.incident_id, {
    message: "Must provide incidentId or incident_id"
  }).refine(data => data.content || data.text, {
    message: "Must provide content or text"
  }),
});

module.exports = {
  getMessagesSchema,
  sendMessageSchema,
};
