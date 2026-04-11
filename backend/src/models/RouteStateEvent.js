const mongoose = require('mongoose');

const routeStateEventSchema = new mongoose.Schema(
  {
    scopeType: { type: String, enum: ['building', 'floor', 'node', 'edge'], required: true },
    scopeId: { type: String, required: true },
    status: {
      type: String,
      enum: ['blocked', 'caution', 'lift_outage', 'temporary_closure'],
      required: true,
    },
    expiresAt: { type: Date, default: null },
    createdBy: { type: String, default: 'system' },
    note: { type: String, default: '' },
  },
  { timestamps: true },
);

module.exports = mongoose.model('RouteStateEvent', routeStateEventSchema);
