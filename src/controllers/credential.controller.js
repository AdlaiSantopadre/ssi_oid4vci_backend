import { issueVerifiableCredential } from "../services/vc-issuance.service.js"

export function issueCredential(req, res) {
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
    issuerDid: process.env.OID4VCI_ISSUER_DID || "did:example:issuer"
  })

  res.json(vc)
}
