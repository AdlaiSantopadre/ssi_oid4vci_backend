export function issueToken(req, res) {
  const { grant_type } = req.body

  if (grant_type !== "urn:ietf:params:oauth:grant-type:pre-authorized_code") {
    return res.status(400).json({ error: "unsupported_grant_type" })
  }

  res.json({
    access_token: "demo-access-token",
    token_type: "Bearer",
    expires_in: 600
  })
}
