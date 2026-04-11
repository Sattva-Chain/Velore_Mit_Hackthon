const mongoose = require('mongoose');

const buildingSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    status: { type: String, enum: ['active', 'inactive', 'draft'], default: 'active' },
    description: { type: String, default: '' },
    floors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Floor' }],
  },
  { timestamps: true },
);

module.exports = mongoose.model('Building', buildingSchema);
