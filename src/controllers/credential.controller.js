/*import { signCredential } from "../agent-adapter/veramo.adapter.js"
import { issueVerifiableCredential } from "../services/vc-issuance.service.js"

export async function issueCredential(req, res) {
  const auth = req.headers.authorization
  if (!auth || !auth.startsWith("Bearer ")) {
    return res.status(401).json({ error: "invalid_token" })
  }

  const { subject_did } = req.body
  if (!subject_did) {
    return res.status(400).json({ error: "missing_subject_did" })
  }

  const vc = issueVerifiableCredential({
    subjectDid: subject_did,
//issuerDid: process.env.OID4VCI_ISSUER_DID || "did:example:issuer"
  })
   const signed = await signCredential(vc)
  res.json(signed)
}*/
// src/controllers/credential.controller.js
import { getByState, markIssued } from "../services/issuer-state.service.js";
import { signCredential } from "../agent-adapter/veramo.adapter.js";

export async function issueCredential(req, res) {
  try {
    const auth = req.headers.authorization ?? "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ error: "invalid_token" });

    const session = await getByState(token);
    if (!session || session.status !== "consumed") return res.status(401).json({ error: "invalid_token" });

    const subject = req.body?.credentialSubject;
    if (!subject?.id) return res.status(400).json({ error: "invalid_request" });

    const vc = {
      "@context": ["https://www.w3.org/2018/credentials/v1"],
      type: ["VerifiableCredential"],
      issuanceDate: new Date().toISOString(),
      credentialSubject: subject,
    };

    const jwtVc = await signCredential(vc);
    await markIssued(token, "jwt_vc");

    return res.json({ format: "jwt_vc", credential: jwtVc });
  } catch {
    return res.status(500).json({ error: "server_error" });
  }
}
