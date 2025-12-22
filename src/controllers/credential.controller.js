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
import { signCredential, getIssuerDid } from "../agent-adapter/veramo.adapter.js";
import { Binding } from "../models/binding.model.js";
import crypto from "crypto";
import { VcStatus } from "../models/vc-status.model.js";
import { AuditLog } from "../models/audit.model.js";

export async function issueCredential(req, res) {
  try {
    const auth = req.headers.authorization ?? "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ error: "invalid_token" });

    const session = await getByState(token);
    if (!session || session.status !== "consumed")
      return res.status(401).json({ error: "invalid_token" });

    const subject = req.body?.credentialSubject;
    if (!subject?.id)
      return res.status(400).json({ error: "invalid_request" });
    console.log("[OID4VCI] issuing VC for subjectDid:", subject.id);

    const vc = {
      "@context": ["https://www.w3.org/2018/credentials/v1"],
      type: ["VerifiableCredential"],
      issuanceDate: new Date().toISOString(),
      credentialSubject: {
        id: subject.id,
        role: "operator" //almeno una claim di esempio
      },
    };
    console.log("[OID4VCI] signing VC");
    const signedVc = await signCredential(vc);
    console.log("[OID4VCI] VC signed:", signedVc);

    console.log("[OID4VCI] saving binding");
    const vcJwt = signedVc.proof.jwt;
    const vcId = crypto.createHash("sha256").update(vcJwt).digest("hex");

    await Binding.create({
      subjectDid: subject.id,
      issuerDid: await getIssuerDid(),
      vcId,
      credentialType: signedVc.type,
    });
    console.log("[OID4VCI] binding saved");
    await VcStatus.create({
      vcId,
      subjectDid: subject.id,
      issuerDid: await getIssuerDid(),
      status: "issued"
    });
    console.log("[VC-STATUS] create issued:", vcId);
    await AuditLog.create({
      event: "issue",
      vcId,
      subjectDid: subject.id,
      issuerDid: await getIssuerDid(),
      meta: { format: "jwt_vc" }
    });
    await markIssued(token, "jwt_vc");

    return res.json({ format: "jwt_vc", credential: signedVc });
  } catch {
    return res.status(500).json({ error: "server_error" });
  }
}
