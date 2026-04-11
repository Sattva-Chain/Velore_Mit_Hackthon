const mongoose = require('mongoose');

const navNodeSchema = new mongoose.Schema(
  {
    floorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Floor', required: true, index: true },
    type: {
      type: String,
      enum: ['entrance', 'intersection', 'room', 'lift', 'stairs', 'helpdesk', 'landmark'],
      required: true,
    },
    name: { type: String, required: true, trim: true },
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    headingHint: { type: Number, default: 0 },
    qrOptional: { type: Boolean, default: true },
    accessible: { type: Boolean, default: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Node', navNodeSchema);
