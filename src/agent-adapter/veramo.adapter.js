import { createAgent } from "@veramo/core"
import { CredentialPlugin } from "@veramo/credential-w3c"
import { KeyManager } from "@veramo/key-manager"
import { KeyManagementSystem, SecretBox } from "@veramo/kms-local"

const agent = createAgent({
  plugins: [
    new KeyManager({
      kms: {
        local: new KeyManagementSystem(
          new SecretBox("dev-secret-key")
        )
      }
    }),
    new CredentialPlugin()
  ]
})

export async function signCredential(vc) {
  return agent.createVerifiableCredential({
    credential: vc,
    proofFormat: "jwt"
  })
}
