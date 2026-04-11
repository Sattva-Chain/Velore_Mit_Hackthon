const mongoose = require('mongoose');

const landmarkSchema = new mongoose.Schema(
  {
    nodeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Node', default: null },
    edgeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Edge', default: null },
    label: { type: String, required: true, trim: true },
    optionalAudioNote: { type: String, default: '' },
    sideHint: { type: String, default: '' },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Landmark', landmarkSchema);
