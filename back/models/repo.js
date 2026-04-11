import mongoose from "mongoose";

const repoSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    gitUrl: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    Branch: {
      type: String,
      default: null,
    },
    LastScanned: {
      type: String,
      default: null,
    },
    Status: {
      type: String,
      default: "Not Scanned",
    },
    VerifiedRepositories: {
      type: Number,
      default: 0,
    },
    UnverifiedRepositories: {
      type: Number,
      default: 0,
    },
    TotalSecrets: {
      type: Number,
      default: 0,
    },
    LastScanFindings: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
  },
  { timestamps: true },
);

const Repository = mongoose.model("Repository", repoSchema);
export default Repository;
