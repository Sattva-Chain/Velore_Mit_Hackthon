const mongoose = require('mongoose');

const recoveryEventSchema = new mongoose.Schema(
  {
    sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'NavigationSession', required: true, index: true },
    state: { type: String, required: true, trim: true },
    anchorNodeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Node', default: null },
    timestamp: { type: Date, default: Date.now },
    note: { type: String, default: '' },
  },
  { timestamps: true },
);

module.exports = mongoose.model('RecoveryEvent', recoveryEventSchema);
