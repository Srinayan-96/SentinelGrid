const { z } = require('zod');

const citizenLoginSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    state: z.string().optional(),
    phone: z.string().optional(),
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1),
  }),
});

const demoLoginSchema = z.object({
  body: z.object({
    role: z.enum(['ADMIN', 'COMMAND', 'RESPONDER', 'CITIZEN']),
  }),
});

const broadcastSchema = z.object({
  body: z.object({
    message: z.string().min(1),
  }),
});

module.exports = {
  citizenLoginSchema,
  loginSchema,
  demoLoginSchema,
  broadcastSchema,
};
