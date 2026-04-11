const { z } = require('zod');

const startNavigationSchema = z.object({
  body: z.object({
    buildingId: z.string().optional(),
    floorId: z.string().optional(),
    startNodeId: z.string().optional(),
    qrCodeValue: z.string().optional(),
    deviceId: z.string().optional(),
  }),
});

const destinationSchema = z.object({
  params: z.object({
    sessionId: z.string().min(1),
  }),
  body: z.object({
    destinationText: z.string().min(1).optional(),
    destinationNodeId: z.string().optional(),
  }),
});

const progressSchema = z.object({
  params: z.object({
    sessionId: z.string().min(1),
  }),
  body: z.object({
    estimatedDeltaMeters: z.number().nonnegative().optional(),
    stepCount: z.number().nonnegative().optional(),
    confidenceHint: z.enum(['high', 'medium', 'low']).optional(),
    confidenceLevel: z.enum(['high', 'medium', 'low', 'HIGH', 'MEDIUM', 'LOW']).optional(),
    offRoute: z.boolean().optional(),
    forceRecovery: z.boolean().optional(),
  }),
});

const anchorSchema = z.object({
  params: z.object({
    sessionId: z.string().min(1),
  }),
  body: z.object({
    qrCodeValue: z.string().min(1),
  }),
});

const recoverySchema = z.object({
  params: z.object({
    sessionId: z.string().min(1),
  }),
  body: z.object({
    reason: z.string().optional(),
    action: z
        .enum([
          'trigger',
          'enter',
          'repeat_last',
          'repeat',
          'nearest_helpdesk',
          'helpdesk',
          'return_to_anchor',
          'return_last_confirmed',
          'resolve',
        ])
        .optional(),
  }),
});

const sessionSchema = z.object({
  params: z.object({
    sessionId: z.string().min(1),
  }),
});

const assistantSchema = z.object({
  params: z.object({
    sessionId: z.string().min(1),
  }),
  body: z.object({
    query: z.string().min(1),
  }),
});

module.exports = {
  anchorSchema,
  assistantSchema,
  destinationSchema,
  progressSchema,
  recoverySchema,
  sessionSchema,
  startNavigationSchema,
};
