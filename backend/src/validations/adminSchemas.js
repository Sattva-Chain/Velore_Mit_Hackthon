const { z } = require('zod');

const buildingSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    address: z.string().min(1),
    description: z.string().optional(),
    status: z.enum(['active', 'inactive', 'draft']).optional(),
  }),
});

const floorSchema = z.object({
  body: z.object({
    buildingId: z.string().min(1),
    levelCode: z.string().min(1),
    mapImageUrl: z.string().optional(),
    isPublished: z.boolean().optional(),
  }),
});

const nodeSchema = z.object({
  body: z.object({
    floorId: z.string().min(1),
    type: z.enum(['entrance', 'intersection', 'room', 'lift', 'stairs', 'helpdesk', 'landmark']),
    name: z.string().min(1),
    x: z.number(),
    y: z.number(),
    headingHint: z.number().optional(),
    qrOptional: z.boolean().optional(),
    accessible: z.boolean().optional(),
  }),
});

const edgeSchema = z.object({
  body: z.object({
    floorId: z.string().min(1),
    fromNodeId: z.string().min(1),
    toNodeId: z.string().min(1),
    distanceM: z.number().positive(),
    accessible: z.boolean().optional(),
    defaultDirection: z.string().optional(),
    anchorPriority: z.number().optional(),
    landmarkHints: z.array(z.string()).optional(),
  }),
});

const anchorSchema = z.object({
  body: z.object({
    nodeId: z.string().min(1),
    qrCodeValue: z.string().min(1),
    active: z.boolean().optional(),
    mountHeightCm: z.number().optional(),
  }),
});

const landmarkSchema = z.object({
  body: z.object({
    nodeId: z.string().optional(),
    edgeId: z.string().optional(),
    label: z.string().min(1),
    optionalAudioNote: z.string().optional(),
    sideHint: z.string().optional(),
  }),
});

const routeStateSchema = z.object({
  body: z.object({
    scopeType: z.enum(['building', 'floor', 'node', 'edge']),
    scopeId: z.string().min(1),
    status: z.enum(['blocked', 'caution', 'lift_outage', 'temporary_closure']),
    expiresAt: z.string().datetime().optional(),
    createdBy: z.string().optional(),
    note: z.string().optional(),
  }),
});

const destinationAliasSchema = z.object({
  body: z.object({
    nodeId: z.string().min(1),
    aliasText: z.string().min(1),
  }),
});

const adminLoginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1),
  }),
});

const publishFloorSchema = z.object({
  params: z.object({
    floorId: z.string().min(1),
  }),
});

module.exports = {
  anchorSchema,
  adminLoginSchema,
  buildingSchema,
  destinationAliasSchema,
  edgeSchema,
  floorSchema,
  landmarkSchema,
  nodeSchema,
  publishFloorSchema,
  routeStateSchema,
};
