
import { VcStatus } from "../models/vc-status.model.js";

export async function getVcStatus(req, res) {
  try {
    const { vcId } = req.params;

    const doc = await VcStatus.findOne({ vcId }).lean();
    if (!doc) return res.status(404).json({ error: "not_found" });

    return res.json({
      vcId: doc.vcId,
      status: doc.status,
      reason: doc.reason ?? null,
      updatedAt: doc.updatedAt,
    });
  } catch (e) {
    return res.status(500).json({ error: "server_error" });
  }
}

