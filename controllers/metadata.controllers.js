export function getIssuerMetadata(req, res) {
  res.json({
    issuer: process.env.OID4VCI_ISSUER_URL,
    credential_endpoint: `${process.env.OID4VCI_ISSUER_URL}/credential`,
    token_endpoint: `${process.env.OID4VCI_ISSUER_URL}/token`,
    credentials_supported: {
      VerifiableCredential: {
        format: "jwt_vc"
      }
    }
  })
}
