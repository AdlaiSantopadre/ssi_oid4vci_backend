import express from "express"
import { getIssuerMetadata } from "./controllers/metadata.controller.js"
import { createCredentialOffer } from "./controllers/credential-offer.controller.js"

const router = express.Router()

router.get("/.well-known/openid-credential-issuer", getIssuerMetadata)
router.get("/credential-offer", createCredentialOffer)

export default router
