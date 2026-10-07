const { z } = require('zod');

const createIncidentSchema = z.object({
  body: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    type: z.string().optional(),
    severity: z.string().optional(),
    people_affected: z.number().int().min(1).default(1),
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    address: z.string().optional(),
    state: z.string().optional(),
    reporter_id: z.string().uuid().optional().nullable(),
  })
});

const getIncidentsSchema = z.object({
  query: z.object({
    state: z.string().optional(),
    status: z.string().optional(),
    assignedTo: z.string().uuid().optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
  body: z.object({}),
  params: z.object({})
});

const assignIncidentSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    responderId: z.string().uuid().optional(),
    responder_id: z.string().uuid().optional(),
    facilityId: z.string().uuid().optional(),
    assignedUnit: z.string().optional(),
  }).refine(data => data.responderId || data.responder_id || data.facilityId, {
    message: "Must provide responderId, responder_id, or facilityId"
  })
});

const claimIncidentSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    responderId: z.string().uuid().optional(),
    responder_id: z.string().uuid().optional(),
  }),
});

const statusUpdateSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    status: z.enum(['OPEN', 'ASSIGNED', 'EN_ROUTE', 'ARRIVED', 'IN_PROGRESS', 'RESOLVED', 'COMPLETED', 'UNCOMPLETED']),
  }),
});

const resolveIncidentSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    people_saved: z.number().int().min(0).default(0),
    resources_used: z.array(z.string()).optional(),
    notes: z.string().optional(),
  }),
});

const citizenConfirmSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    confirmed: z.boolean(),
    notes: z.string().optional(),
    photo_url: z.string().url().optional().nullable(),
  }),
});

const adminCompleteSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    reason: z.string().min(1),
  }),
});

module.exports = {
  createIncidentSchema,
  getIncidentsSchema,
  assignIncidentSchema,
  claimIncidentSchema,
  statusUpdateSchema,
  resolveIncidentSchema,
  citizenConfirmSchema,
  adminCompleteSchema,
};
