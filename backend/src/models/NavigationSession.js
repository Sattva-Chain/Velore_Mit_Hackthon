const mongoose = require('mongoose');

const navigationSessionSchema = new mongoose.Schema(
  {
    deviceId: { type: String, default: 'demo-device' },
    buildingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Building', required: true, index: true },
    floorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Floor', required: true, index: true },
    startNodeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Node', required: true },
    currentNodeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Node', required: true },
    destinationNodeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Node', default: null },
    confidence: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
    status: { type: String, enum: ['active', 'recovering', 'arrived', 'cancelled'], default: 'active' },
    lastAnchorNodeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Node', default: null },
    progressEstimate: { type: Number, default: 0 },
    currentInstruction: { type: String, default: 'Where would you like to go?' },
    route: { type: mongoose.Schema.Types.Mixed, default: null },
    spokenDestinationText: { type: String, default: '' },
    entranceMode: {
      type: String,
      enum: ['qr', 'selected_entrance', 'voice_entrance'],
      default: 'selected_entrance',
    },
    startedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

module.exports = mongoose.model('NavigationSession', navigationSessionSchema);
