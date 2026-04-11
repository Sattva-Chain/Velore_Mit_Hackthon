const mongoose = require('mongoose');

const floorSchema = new mongoose.Schema(
  {
    buildingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Building', required: true, index: true },
    levelCode: { type: String, required: true, trim: true },
    mapImageUrl: { type: String, default: '' },
    isPublished: { type: Boolean, default: false },
  },
  { timestamps: true },
);

module.exports = mongoose.model('Floor', floorSchema);
