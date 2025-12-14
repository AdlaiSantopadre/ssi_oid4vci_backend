// ssi-oid4vci/src/services/vc-issuance.service.js <- new file that implements stub function for issuing VCs
export function issueVerifiableCredential({ subjectDid, issuerDid }) {
  return {
    "@context": ["https://www.w3.org/2018/credentials/v1"],
    type: ["VerifiableCredential"],
    issuer: { id: issuerDid },
    issuanceDate: new Date().toISOString(),
    credentialSubject: {
      id: subjectDid
    }
  }
}
