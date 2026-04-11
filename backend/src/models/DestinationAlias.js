const mongoose = require('mongoose');

const destinationAliasSchema = new mongoose.Schema(
  {
    nodeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Node', required: true, index: true },
    aliasText: { type: String, required: true, trim: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model('DestinationAlias', destinationAliasSchema);
