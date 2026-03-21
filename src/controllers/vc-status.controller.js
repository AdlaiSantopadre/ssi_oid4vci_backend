// src/controllers/vc-status.controller.js 
import { VcStatus } from "../models/vc-status.model.js";
import { AuditLog } from "../models/audit.model.js";
// Set or update the status of a Verifiable Credential
export async function setVcStatus(req, res) {
  try {
    // Extract vcId from params and status from body
    const { vcId } = req.params;
    // Extract status and reason from request body
    const { status, reason } = req.body; // revoked|suspended|issued
    if (!["issued", "suspended", "revoked"].includes(status)) {
      return res.status(400).json({ error: "invalid_status" });
    }
    // Upsert VC status
    const doc = await VcStatus.findOneAndUpdate(
      // filter //
      { vcId },
      { // update //
        $set: {
          vcId,// in case of insert
          status, // new status
          reason: reason ?? null, // set reason or null
        },
      },
      {
        new: true,// return the updated document
        upsert: true,// insert if not found
        runValidators: true,// validate before update
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
