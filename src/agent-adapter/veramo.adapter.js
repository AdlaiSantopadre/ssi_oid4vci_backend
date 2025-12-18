import { createAgent } from "@veramo/core"
import { CredentialPlugin } from "@veramo/credential-w3c"
import { KeyManager } from "@veramo/key-manager"
import { KeyManagementSystem, SecretBox } from "@veramo/kms-local"
import { DIDManager } from "@veramo/did-manager"
import { KeyDIDProvider } from "@veramo/did-provider-key"
import { DIDResolverPlugin } from "@veramo/did-resolver"
import { Resolver } from "did-resolver"

import {
  Entities,
  KeyStore,
  PrivateKeyStore,
  DIDStore,
  migrations
} from "@veramo/data-store"
import { DataSource } from "typeorm"

const db = new DataSource({
  type: "sqlite",
  database: "veramo.sqlite",
  synchronize: false,
  migrations,
  migrationsRun: true,
  entities: Entities
})
await db.initialize()

const agent = createAgent({
  plugins: [
    new KeyManager({
      store: new KeyStore(db),
      kms: {
        local: new KeyManagementSystem(
          new PrivateKeyStore(
            db,
            new SecretBox(
              "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef"
            )
          )
        )
      }
    }),
    new DIDManager({
      store: new DIDStore(db),
      defaultProvider: "did:key",
      providers: {
        "did:key": new KeyDIDProvider({
          defaultKms: "local"
        })
      }
    }),
    new DIDResolverPlugin({
      resolver: new Resolver({})
    }),
    new CredentialPlugin()
  ]
})

let issuerDid

export async function getIssuerDid() {
  if (!issuerDid) {
    const did = await agent.didManagerCreate()
    issuerDid = did.did
  }
  return issuerDid
}

export async function signCredential(vc) {
  const issuer = await getIssuerDid()
  vc.issuer = { id: issuer }

  return agent.createVerifiableCredential({
    credential: vc,
    proofFormat: "jwt"
  })
}
