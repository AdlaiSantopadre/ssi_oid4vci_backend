export function createCredentialOffer(req, res) {
  const offer = {
    credential_issuer: process.env.OID4VCI_ISSUER_URL,
    credentials: ["VerifiableCredential"],
    grants: {
      "urn:ietf:params:oauth:grant-type:pre-authorized_code": {
        "pre-authorized_code": "demo-code",
        user_pin_required: false
      }
    }
  }

  res.json(offer)
}
