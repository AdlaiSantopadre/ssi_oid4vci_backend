import express from "express"
import { getIssuerMetadata } from "./controllers/metadata.controller.js"

const router = express.Router()

router.get("/.well-known/openid-credential-issuer", getIssuerMetadata)

export default router
