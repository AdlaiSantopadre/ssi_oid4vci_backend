// src/persistence/issuer-state.model.js
import mongoose from "mongoose";

const IssuerStateSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, index: true },
    state: { type: String, required: true, unique: true, index: true },
    nonce: { type: String, required: true },
    status: { type: String, enum: ["pending", "issued", "consumed"], default: "pending", index: true },
    subjectDid: { type: String, default: null, index: true },
    credentialId: { type: String, default: null, index: true },
    expiresAt: { type: Date, required: true },
  },

  { timestamps: true }
);

IssuerStateSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const IssuerState =
  mongoose.models.IssuerState || mongoose.model("IssuerState", IssuerStateSchema);
