//
/* in memory
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
}*/
import { createSession } from "../services/issuer-state.service.js";

export async function createCredentialOffer(req, res) {
  const { state, nonce } = await createSession();

  const issuer = process.env.OID4VCI_ISSUER_URL ?? `${req.protocol}://${req.get("host")}`// es. http://localhost:3000
  const credential_issuer = `${issuer}`;
  const token_endpoint = `${issuer}/token`;
  const credential_endpoint = `${issuer}/credential`;

  const offer = {
    credential_issuer,
    grants: {
      "urn:ietf:params:oauth:grant-type:pre-authorized_code": {
        "pre-authorized_code": state,
        user_pin_required: false,
      },
    },
    c_nonce: nonce,
    c_nonce_expires_in: Number(process.env.OID4VCI_STATE_TTL_SEC ?? 600),
  };

  return res.json(offer);
}

