// src/models/audit.model.js
import mongoose from "mongoose";

const AuditSchema = new mongoose.Schema(
  {
    event: { type: String, required: true, index: true }, // issue|revoke|suspend|unsuspend
    vcId: { type: String, required: true, index: true },
    subjectDid: { type: String, required: true, index: true },
    issuerDid: { type: String, required: true, index: true },
    actor: { type: String, default: "system" }, // future: user/admin id
    meta: { type: Object, default: {} },
  },
  { timestamps: true }
);

export const AuditLog = mongoose.model("AuditLog", AuditSchema);
