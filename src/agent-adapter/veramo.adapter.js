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

export const agent = createAgent({
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
// Ottiene o crea un DID per l'issuer
export async function getIssuerDid() {
  if (issuerDid) return issuerDid;

  const existing = await agent.didManagerFind({});
  if (existing.length > 0) {
    issuerDid = existing[0].did;
    console.log("[SSI] issuer DID:", issuerDid);
    return issuerDid;
  }

  const created = await agent.didManagerCreate({ provider: "did:key" });
  issuerDid = created.did;
  console.log("[SSI] issuer DID:", issuerDid);
  return issuerDid;
}


// Firma una Verifiable Credential in formato JWT
export async function signCredential(vc) {
  try {
    // Assicura che l'issuer sia impostato
    const issuer = await getIssuerDid();
    // Imposta l'issuer nella VC
    vc.issuer = { id: issuer };

    console.log("[SSI] signing with issuer:", issuer);
    // Crea la VC firmata in formato JWT
    const res = await agent.createVerifiableCredential({
      credential: vc,
      proofFormat: "jwt",
    });

    console.log("[SSI] VC created");
    return res;
  } catch (e) {
    console.error("[SSI] signCredential error:", e);
    throw e;
  }
}
