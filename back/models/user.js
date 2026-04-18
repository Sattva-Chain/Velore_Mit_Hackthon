import mongoose from "mongoose";

const ROLE_VALUES = ["SOLO_DEVELOPER", "ORG_OWNER", "EMPLOYEE", "developer"];

const userSchema = new mongoose.Schema({
  name: { type: String, trim: true, default: null },
  email: { type: String, required: true, trim: true, unique: true },
  password: { type: String, required: false, default: null },
  role: { type: String, enum: ROLE_VALUES, default: "SOLO_DEVELOPER" },
  organizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Organization",
    default: null,
  },
  isActive: { type: Boolean, default: true },
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "companydata",
    default: null,
  },
  TotalRepositories: { type: Number, default: 0 },
  VerifiedRepositories: { type: Number, default: 0 },
  UnverifiedRepositories: { type: Number, default: 0 },
  userType: { type: String, default: "developer" }
}, { timestamps: true });

userSchema.pre("save", function normalizeEmail(next) {
  if (this.email) {
    this.email = String(this.email).trim().toLowerCase();
  }
  next();
});

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ organizationId: 1, role: 1 });

export default mongoose.models.User || mongoose.model("User", userSchema);
