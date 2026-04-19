const mongoose = require("mongoose");

const remediationTaskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    remediationRecommendation: { type: String, default: "", trim: true },
    vulnerabilityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vulnerability",
      default: null,
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      default: null,
      index: true,
    },
    repoName: { type: String, default: null, trim: true },
    repoUrl: { type: String, default: null, trim: true },
    branch: { type: String, default: null, trim: true },
    filePath: { type: String, default: null, trim: true },
    lineNumber: { type: Number, default: null },
    secretType: { type: String, default: null, trim: true },
    severity: { type: String, default: "MEDIUM", trim: true },
    assignedToEmail: { type: String, default: null, trim: true, lowercase: true },
    assignedToUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    assignedByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    assignedByName: { type: String, default: null, trim: true },
    asanaTaskGid: { type: String, default: null, trim: true },
    asanaTaskUrl: { type: String, default: null, trim: true },
    asanaAssignmentResolved: { type: Boolean, default: false },
    asanaAssignmentMessage: { type: String, default: null, trim: true },
    asanaSyncStatus: {
      type: String,
      enum: ["PENDING", "SYNCED", "FAILED", "SKIPPED"],
      default: "PENDING",
    },
    dueDate: { type: Date, default: null, index: true },
    status: {
      type: String,
      enum: ["OPEN", "IN_PROGRESS", "DONE", "FAILED", "OVERDUE"],
      default: "OPEN",
      index: true,
    },
    emailNotificationSent: { type: Boolean, default: false },
    emailNotificationError: { type: String, default: null },
  },
  { timestamps: true }
);

remediationTaskSchema.index({ organizationId: 1, status: 1, dueDate: 1 });
remediationTaskSchema.index({ assignedToEmail: 1, status: 1 });
remediationTaskSchema.index({ repoName: 1, branch: 1 });
remediationTaskSchema.index({ vulnerabilityId: 1, createdAt: -1 });

module.exports =
  mongoose.models.RemediationTask ||
  mongoose.model("RemediationTask", remediationTaskSchema);
