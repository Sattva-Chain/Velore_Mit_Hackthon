const mongoose = require("mongoose");

const inviteSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, trim: true, lowercase: true },
    role: { type: String, enum: ["EMPLOYEE"], default: "EMPLOYEE" },
    token: { type: String, required: true },
    status: { type: String, enum: ["PENDING", "ACCEPTED", "EXPIRED"], default: "PENDING" },
    invitedAt: { type: Date, default: Date.now },
    acceptedAt: { type: Date, default: null },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { _id: true }
);

const organizationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, unique: true },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    invites: [inviteSchema],
  },
  { timestamps: true }
);

organizationSchema.index({ slug: 1 }, { unique: true });

module.exports =
  mongoose.models.Organization || mongoose.model("Organization", organizationSchema);
