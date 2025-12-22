// models/binding.model.js
import mongoose from "mongoose";

const BindingSchema = new mongoose.Schema({
  subjectDid: { type: String, required: true, index: true },
  issuerDid: { type: String, required: true, index: true },
  vcId: { type: String, required: true },
  credentialType: { type: [String], required: true },
  issuedAt: { type: Date, default: Date.now }
});

BindingSchema.index({ subjectDid: 1, vcId: 1 }, { unique: true });

export const Binding = mongoose.model("Binding", BindingSchema);
