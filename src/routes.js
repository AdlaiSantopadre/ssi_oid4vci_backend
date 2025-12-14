import express from "express"
import { getIssuerMetadata } from "./controllers/metadata.controller.js"
import { createCredentialOffer } from "./controllers/credential-offer.controller.js"
import { issueToken } from "./controllers/token.controller.js"
import { issueCredential } from "./controllers/credential.controller.js"

const router = express.Router()

router.get("/.well-known/openid-credential-issuer", getIssuerMetadata)
router.get("/credential-offer", createCredentialOffer)
router.post("/token", issueToken)
router.post("/credential", issueCredential)

export default router

//test curl -X POST http://localhost:3000/token -H "Content-Type: application/json" -d '{"grant_type":"urn:ietf:params:oauth:grant-type:pre-authorized_code"}'
// test da powershell Invoke-WebRequest -Uri http://localhost:3000/token -Method POST -Headers @{ContentType "application/json"} -Body '{"grant_type":"urn:ietf:params:oauth:grant-type:pre-authorized_code"}'
/* test Invoke-WebRequest -Uri Invoke-WebRequest http://localhost:3000/credential `
  -Method POST `
  -UseBasicParsing `
  -Headers @{
    "Content-Type"="application/json"
    "Authorization"="Bearer demo-access-token"
  } `
  -Body '{ "subject_did": "did:example:subject" }'*/