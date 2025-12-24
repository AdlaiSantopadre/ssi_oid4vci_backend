// src/middleware/vc-auth.middleware.js
import { agent } from "../agent-adapter/veramo.adapter.js";
import { getVcStatus } from "../controllers/vc-status-read.controller.js";

export function requireVcRole(requiredRole) {
  return async (req, res, next) => {
    try {
      const auth = req.headers.authorization ?? "";
      const jwt = auth.startsWith("Bearer ") ? auth.slice(7) : null;
      if (!jwt) return res.status(401).json({ error: "missing_vc" });

      const verification = await agent.verifyCredential({ credential: jwt });
      if (!verification.verified) return res.status(401).json({ error: "invalid_vc" });

      const vc = verification.credential;
      const vcId = vc.proof?.jwt
        ? crypto.createHash("sha256").update(vc.proof.jwt).digest("hex")
        : null;

      if (!vcId) return res.status(401).json({ error: "invalid_vc" });

      const statusReq = { params: { vcId } };
      const statusRes = {
        json: (s) => s,
        status: () => ({ json: () => null }),
      };
      const status = await getVcStatus(statusReq, statusRes);
      if (!status || status.status !== "issued")
        return res.status(403).json({ error: "vc_not_active" });

      if (vc.credentialSubject?.role !== requiredRole)
        return res.status(403).json({ error: "insufficient_role" });

      req.vc = vc;
      next();
    } catch {
      return res.status(500).json({ error: "server_error" });
    }
  };
}
