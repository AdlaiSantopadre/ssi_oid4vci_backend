// src/controllers/vc-status.controller.js
import { VcStatus } from "../models/vc-status.model.js";
import { AuditLog } from "../models/audit.model.js";

export async function setVcStatus(req, res) {
  try {
    const { vcId } = req.params;
    const { status, reason } = req.body; // revoked|suspended|issued
    if (!["issued", "suspended", "revoked"].includes(status)) {
      return res.status(400).json({ error: "invalid_status" });
    }
    const doc = await VcStatus.findOneAndUpdate(
  { vcId },
  {
    $set: {
      vcId,
      status,
      reason: reason ?? null,
    },
  },
  {
    new: true,
    upsert: true,
    runValidators: true,
  }
);

console.log("[VC-STATUS] persisted:", doc._id, doc.vcId, doc.status);

console.log("[AUDIT] creating log for", vcId, status);
    await AuditLog.create({
      event: status,
      vcId,
      subjectDid: doc.subjectDid,
      issuerDid: doc.issuerDid,
      meta: { reason: reason ?? null },
    });

    return res.json(doc);
  } catch (e) {
    console.error("[VC-STATUS] error:", e);
    return res.status(500).json({ error: "server_error" });
  }
}
