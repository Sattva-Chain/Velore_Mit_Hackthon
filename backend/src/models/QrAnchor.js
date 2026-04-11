const mongoose = require('mongoose');

const qrAnchorSchema = new mongoose.Schema(
  {
    nodeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Node', required: true, index: true },
    qrCodeValue: { type: String, required: true, unique: true, trim: true },
    active: { type: Boolean, default: true },
    mountHeightCm: { type: Number, default: 140 },
  },
  { timestamps: true },
);

module.exports = mongoose.model('QrAnchor', qrAnchorSchema);
