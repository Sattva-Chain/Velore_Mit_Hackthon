const mongoose = require('mongoose');

const edgeSchema = new mongoose.Schema(
  {
    floorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Floor', required: true, index: true },
    fromNodeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Node', required: true },
    toNodeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Node', required: true },
    distanceM: { type: Number, required: true },
    accessible: { type: Boolean, default: true },
    defaultDirection: { type: String, default: 'straight' },
    anchorPriority: { type: Number, default: 0.5 },
    landmarkHints: [{ type: String }],
  },
  { timestamps: true },
);

module.exports = mongoose.model('Edge', edgeSchema);
