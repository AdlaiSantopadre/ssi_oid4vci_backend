//
/*export function issueToken(req, res) {
  const { grant_type } = req.body

  if (grant_type !== "urn:ietf:params:oauth:grant-type:pre-authorized_code") {
    return res.status(400).json({ error: "unsupported_grant_type" })
  }

  res.json({
    access_token: "demo-access-token",
    token_type: "Bearer",
    expires_in: 600
  })
}
*/
// src/controllers/token.controller.js
import { getByState, consumeState } from "../services/issuer-state.service.js";

export async function issueToken(req, res) {
  try {
    // DEBUG temporaneo
    console.log("[TOKEN] content-type:", req.headers["content-type"]);
    console.log("[TOKEN] body:", req.body);

    const grantType = req.body?.grant_type;
    const code = req.body?.["pre-authorized_code"];

    if (
      grantType !== "urn:ietf:params:oauth:grant-type:pre-authorized_code" ||
      !code
    ) {
      return res.status(400).json({ error: "invalid_request" });
    }

    const session = await getByState(code);
    if (!session) return res.status(400).json({ error: "invalid_grant" });
    if (new Date(session.expiresAt).getTime() < Date.now())
      return res.status(400).json({ error: "invalid_grant" });

    const consumed = await consumeState(code);
    if (!consumed) return res.status(400).json({ error: "invalid_grant" });

    console.log("[TOKEN] issued:", code);

    return res.json({
      access_token: code, // token = state (coerente con implementazione precedente)
      token_type: "bearer",
      expires_in: 600,
      c_nonce: session.nonce,
      c_nonce_expires_in: 600,
    });
  } catch (e) {
    console.error("[TOKEN] error:", e);
    return res.status(500).json({ error: "server_error" });
  }
}
