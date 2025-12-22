// src/models/vc-status.model.js
import mongoose from "mongoose";

const VcStatusSchema = new mongoose.Schema(
  {
    vcId: { type: String, required: true, unique: true, index: true },
    subjectDid: { type: String, required: true, index: true },
    issuerDid: { type: String, required: true, index: true },
    status: { type: String, enum: ["issued", "revoked", "suspended"], required: true, index: true },
    reason: { type: String, default: null },
  },
  { timestamps: true }
);

export const VcStatus = mongoose.model("VcStatus", VcStatusSchema);


