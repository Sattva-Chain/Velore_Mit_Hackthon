import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, trim: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: "developer" },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "companydata",
  },
  TotalRepositories: { type: Number, default: 0 },
  VerifiedRepositories: { type: Number, default: 0 },
  UnverifiedRepositories: { type: Number, default: 0 },
  userType: { type: String, default: "developer" }
}, { timestamps: true });

export default mongoose.model("User", userSchema);
