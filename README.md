# Implementazione
L'implementazione della SSI è avvenuta progettando un modulo di servizio dedicato per la gestione dell'identità decentralizzata e 
dell'emissione di Verifiable Credentials (VC), separato al livello logico dal backend applicativo DCMS.

## Prerequisiti
In ambiente Windows 11, per installare il package manager,  è stato fatto ricorso al file 
di gestione delle versioni *nvm-setup.exe*.
Nel riuso del codice ci si è basati sugli *ECMAScript Modules*; per il routing  sul framework  Express 5.
### Veramo
Veramo, abbreviazione di *VERifiable information And MObility* è un framework nato per trattare le DID (identità decentralizzate), le Verifiable Credentials, per la portabilità delle identità, l'interoperabilità multi-blockchain e la compatibilità.

Veramo è stato sviluppato in conformità al World Wide Web Consortium (W3C) ed è stato uno dei primi progetti all'interno della comunità Decentralized Identity Foundation (DIF).

I riferimenti per la implementazione di Veramo sono stati cercati nel repository GitHub https://github.com/decentralized-identity/veramo


**Nota:Nel corso delle sezioni successive appaiono termini tecnici definiti nel vasto lavoro delle specifiche e linee guida del W3C" (W3C_TR_Specifications}**

## SDK Sphereon
//L'implementazione della SSI è avvenuta progettando un modulo di servizio dedicato per la gestione dell'identità decentralizzata e dell'emissione di Verifiable Credentials (VC), separato al livello logico dal backend applicativo DCMS.//
 
Approfondendo la documentazione di Veramo e confrontandola con la piattaforma Verifiable Data Infrustructure Sphereon {*Sphereon_SSI_SDK*} che fa uso di parte della libreria Veramo, abbiamo  riscontrato alcune difficoltà nella implementazione di un agente Veramo.  

Nel tutorial dimostrativo di Veramo abbiamo constatato che esso nella sua ultima versione è un agente monolitico locale, con un archivio SQLite * embedded *, che fa  uso del metodo * DID ethr * uno dei metodi di DID possibili, mappato in questo caso con una identità conformata agli indirizzi di Ethereum} senza quelle caratteristiche di "separazione per tenant" e "binding applicativo DID <-> utente <-> ruolo" da adottare nel nostro caso.

Le API  “di Veramo” esistono, ma non sono automaticamente un interfaccia diretta con il protocollo http;  
sono piuttosto API JavaScript/TypeScript presenti nei pacchetti SDK (@veramo/core e plugin) e non diventano automaticamente API in stile Representational state transfer (REST)/http.

L'idea è stata considerare Sphereon che fornisce una implementazione in cui Veramo è usato come una dipendenza incapsulata. 

Sphereon è servito come guida per implementare un issuer OID4VCI (*OpenID for Verifiable Credential Issuance*) guidato dagli standard,  
indipendente da SDK specifici, anche quelli messi a disposizione da Sphereon stesso.

OID4VCI  definisce un *issuer* che agisce come *OAuth 2.0 Resource Server*, un' entità che emette VC.

Seguendo quanto prefigurato  dal protocollo,  il soggetto titolare del wallet scopre l'issuer attraverso la route */ .well-known/openid-credential-issuer*,   
dove trova *credential_endpoin*, *token_endpoint* e le *credentials_supported* (i formati e i profili).

In sequenza prevede che venga ricevuta  una  *Credential Offer* (o URL o JSON) che contiene *credential issuer* e un tipo di grant, spesso un *pre-authorized_code*,  
eventualmente fornito insieme all'*issuer state* che serve a correlare la sessione lato issuer.
(L'eventuale PIN issuer è opzionale e aggiunge una verifica Out-Of-Band ovvero con una comunicazione  che avviene tramite un canale logico separato,  
indipendente dalla rete principale o dal flusso di dati standard.

Il wallet chiama la route */token* per ottenere l' *access_token* usando il grant
quindi chiama la route */credential* con *{Bearer token* e, nei profili reali, una proof legata ad un *nonce*  
(in crittografia si fa uso del nonce un numero pseudo casuale utilizzato una sola volta a garantire la univocità}.
La risposta è la VC, nei possibili formati *IETF SD-JWT VC* , *ISO mdoc* , e *W3C VCDM* [VC_DATA].) 
L'issuer può esporre anche meccanismi di stato/revoca a seconda dei profili. 
### Issues affrontate
In prima battuta utilizzando  gli SDK Sphereon / OID4VCI non era possibile  superare il disallineamento tra l'astrazione del protocollo OpenID Connect  e le necessità del nostro modello backend.
OpenID Connect è un protocollo di autenticazione interoperabile costruito sulle basi di OAuth 2.0 per semplificare il modo in cui si verificano 
le identità presso un server che fornisce la autorizzazione.}

Le difficoltà principali nascevano nella configurazione rigorosa dei metadati, nella gestione di issuer stateful,
e nella integrazione che necessitava di persistenza e ruoli applicativi.

Ci siamo posti come obiettivo una nuova fattorizzazione degli esempi implementando prima issuer metadata + credential offer, poi token endpoint, infine un adapter basato sul modello di agent Veramo.\\
**Abbiamo in definitiva utilizzato  gli standard OID4VCI usati da Sphereon, non l'SDK Sphereon, mantenendo l'agente Veramo nel ruolo di adattatore interno**, 
appoggiandoci a un database di servizio redatto con la libreria *mongoose.js* per la persistenza di issuer state, DID ,VCstatus e binding applicativo.  


# Tappe dettagliate della Implementazione 
Il percorso di implementazione ha previsto la creazione iniziale dei servizi:

* issuer-state.service.js per la gestione stato issuer (in-memory)
* vc-issuance.service.js  per la generazione di VC minimale

e degli endpoint
    
*   GET */.well-known/openid-credential-issuer* → metadata issuer
*    GET */credential-offer* → credential offer (pre-authorized code)
*    POST */token* → token endpoint OAuth (mock)
*    POST */credential* → issuance VC (mock)
   

Il flusso "Metadata → Offer → Token → Credential" è stato chiuso permettendo di avere un servizio logico interno al backend senza scendere nel dettaglio degli oggetti.

Il passo successivo è stata l'implementazione dell'adapter Veramo. 
La scelta della versione di Veramo è ricaduta sulla versione 4.2  utilizzata da Sphereon.

Il codice *veramo.adapter.js* è stato concepito e testato come componente interno di firma della VC e di gestione del DID.
Le caratteristiche del codice mutuato dall'agente Veramo permettono di:

* Firmare JWT-VC (standard di interscambio dati con intestazione e contenuto della VC in formato JSON} conformi a OID4VCI
* Gestire un issuer DID persistente
* Non esporre Veramo come API pubblica
* Isolare la complessità SSI dal resto del backend.
}

L'adapter inizializza un agente Veramo 4.2 che  gestisce direttamente *KeyStore*,*PrivateKeyStore* e *DIDStore*; 
crea una tantum la *did:key issuer*   e 
espone le funzioni

 * getIssuerDid()
 * signCredential(vc)


Durante i test locali sono emerse necessità di ulteriori sviluppi del codice.
Veramo 4.2 richiede già in fase iniziale  la **persistenza obbligatoria dei suoi dati con un database SQLite comprendente  KeyStore e PrivateKeyStore**,
**DiDstore** più una *SecretBox*} contenente  una chiave valida di tipo Hex 32 byte (64 caratteri esadecimali preceduti da "0x")

Quanto al *resolver capace di interpretare il DID è stato introdotto il plugin *DIDResolverPlugin* aggiunto al *CredentialPlugin* per riconoscere i DID gestiti.
## Da VC mock a VC firmata
Una volta implementato l'adapter la route */credential* è passata da gestire una VC  mock ( non firmata) alla delega della firma a Veramo.
In questo passo la VC è stata resa valida a tutti gli effetti  per *did-jwt-vc* ovvero dotata di un *credentialSubject* che *includesse già un attributo oltre a un id*.

Dopo i test si è potuto concludee di avere a disposizione un layer per la gestione del flusso 
**DID persistente → firma JWT-VC → verifica**.  
### Caratteristiche della implementazione  OID4VCI
L'implementazione OID4VCI ottenuta gestisce i tre endpoint minimi (metadata, offer e token) in modo coerente e con la  separazione  giusta:

* controllers e routes sono dedicati al protocollo,
* services  sono relativi alla semantica VC,
* agent-adapter si occupa della crittografia/SSI.



# Migrazione da stato in-memory a stato persistente
Per la persistenza dei dati sono stati utilizzati modelli del database MongoDB per issuer state, DID , VC status e binding applicativo.

In questa fase  di implementazione l'issuer espone gli stessi tre endpoint che corrispondono alle tre fasi logiche (ottenere un'offerta, ottenere un token, ottenere la credenziale).

La differenza rispetto al passo precedente è che lo “stato di sessione” non vive più in RAM ma  viene salvato in MongoDB  
e scade da solo grazie a un tempo di rimanenza in vita (TTL).

Il modello MongoDB introdotto allo scopo è *issuer-state.model.js* 


Diamo illustrazione di come il flusso è stato modificato con la persistenza descrivendo i test end-to-end effettuati.

La prima richiesta  parte con una GET sulla route */credential-offer*.
Quando un wallet o un client chiede l'offerta, il backend crea una nuova “sessione di emissione” chiamando *createSession()*. 
Questa funzione genera un codice casuale che usiamo come *pre-authorized_code*  e un secondo valore casuale che usiamo come *c_nonce*. 
Entrambi vengono salvati in Mongo con status="pending" e con una data di scadenza *expiresAt* calcolata con la TTL configurata.   
La risposta al client costruita dal controller credential-offer.controller.js include  l'URL dell'issuer *credential\_issuer*, il grant di tipo pre-authorized code (indicato anche come state
state), e i campi c_nonce e c_nonce_expires_in.  
In questo modo l'offerta non dipende dalla continuità del processo applicativo Node: se il servizio si riavvia, lo stato conservato resta disponibile.  
 
 *formazione dell`offer*
```
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
```

La seconda richiesta è di tipo POST sulla route */token*. 
Il client invia grant_type e il pre-authorized_code ricevuto dall'offerta.

Aggiungiamo  che il pre-authorized_code viene scambiato con un access_token  avendo cura di gestire correttamente il software che analizza la struttura dati, 
il parsing *application/x-www-form-urlencoded*. 
Infatti OID4VCI richiede che */token* riceva *grant_type* e *pre-authorized_code* in formato {url-encoded}, non JSON. 
La libreria Express poi lo legge con *express.urlencoded()*.

Il controller valida che il grant_type sia quello corretto e poi recupera la sessione dal database con *getByState(code)*. Se la sessione non esiste o è scaduta,
risponde con "invalid_grant".
Altrimenti, se esiste, applica il meccanismo anti-replay:
chiama la funzione *consumeState(code)*, che fa un aggiornamento atomico sul documento (solo se lo stato è ancora utilizzabile) e lo porta a status="consumed".

Se l'aggiornamento fallisce, significa che quel codice è già stato usato e quindi viene restituito ancora "invalid\_grant".

Se l'operazione riesce, il server emette una risposta token json: restituisce un access_token che nel nostro caso coincide col codice senza aggiunte, 
perché stiamo mantenendo il profilo minimale  e ripropone c_nonce e la sua scadenza.


Il traguardo acquisito con questo passo è che lo stesso pre-authorized\_code non può più essere riutilizzato, effettivamente ciò che è stato verificato con un test, dove una seconda chiamata a \textit{/token} ritorna sempre "invalid\_grant". Anche per questo meccanismo anti-replay di trova in appendice A1 il codice.

La terza richiesta  è di tipo POST sulla route \textit{/credential}.//
Adesso il client chiama l'endpoint passando Authorization: Bearer <access\_token> e un body con il credentialSubject (almeno con l'id).\\
Il controller estrae il Bearer token, lo usa per recuperare la sessione in MongoDB e verifica che sia nello stato previsto (nel nostro flusso: consumed).

Se il token non è associato a una sessione valida, oppure se non è nello stato corretto, siamo di nuovo alla risposta "invalid\_token".


Quando la sessione è valida, il server costruisce la VC in forma W3C minimale (@context, type, issuanceDate, credentialSubject) e la passa all'adapter SSI *signCredential* in veramo.adapter.js

L'adapter assicuratosi che ci sia un DID issuer  firma la credenziale nel formato JWT-VC.
Il controller quindi marca la sessione come “issued” per tracciamento (*markIssued*) e restituisce la risposta finale: ``{ format: "jwt\_vc", credential: <JWT> }.``

`Riassumendo, la persistenza dello stato dell'issuer  rende il flusso robusto ai riavvii, il TTL pulisce automaticamente le sessioni scadute, 
e la transizione atomica da status pending a consumed sul */token* endpoint implementa la proprietà più importante del pre-authorized flow, ovvero 
**un codice può valere  una sola volta**.  
*Meccanismo  anti replay*

```
export async function consumeState(state) {
  const res = await IssuerState.findOneAndUpdate(
    { state, status: { $in: ["pending", "issued"] } },
    { $set: { status: "consumed" } },
    { new: true }
  ).lean();
  return res;
}
```
## Binding applicativo 
Per l`acquisizione del binding applicativo  nel modello *binding.model.js* lo schema contiene i campi *subjectDid*, *issuerDid*, *vcId*, *credentialType*, *issuedAt*, 
con indice unico su (subjectDid, vcId) e facente riferimento all'issuer DID di Veramo.
**Il binding applicativo viene creato subito dopo l'emissione della VC e non viene mai modificato, fungendo da riferimento stabile per stato e audit.**

Tramite il modello *binding.model.js* il  binding applicativo viene salvato prima della risposta OID4VCI che realizza  il  collegamento immutabile tra gli oggetti in gioco
*vcId*,Did del client,Did dell'issuer,tipo di credenziale.
Per distinguere tra il contenuto della credenziale e il suo  stato operativo, è stato introdotto il modello *vc-status.model.js* tramite cui lo status viene ricondotto a tre sole possibilità alternative: 

* issued    
* suspended
* revoked


Lo stato iniziale (issued) viene creato all'emissione; le successive transizioni sono gestite tramite un endpoint  amministrativo.

Il controller *vc-status.controller.js* adotta un approccio idempotente findOneAndUpdate con Upsert - "UPdate" (aggiornare) e "inSERT" (inserire)- 
per evitare inconsistenze tra scrittura e lettura.

È stato anche implementato l'endpoint pubblico di tipo GET su route */vc-status* con filtro su *vcId*,   
che restituisce *vcId, stato corrente, motivazione,timestamp di aggiornamento*.

Al software implementato è stato aggiunto l'*audit.model.js* e con esso in  MongoDB si è creata una collezione , denominata auditlogs, con le caratteristiche di essere append-only.
Questa consente la tracciabilità completa di ogni evento rilevante, la separazione tra stato corrente e storico e permette la  integrazione con ancoraggi sul ledger di Fabric.


Per evitare la rigenerazione dell'issuer a ogni riavvio del servizio si è ricorsi ad un datastore persistente (precisamente con SQLite)  per Veramo.
Su tale datastore KeyManager e DIDManager sono stati inizializzati e l'**issuer DID è stato creato una sola volta per essere poi
riutilizzato tramite lookup** persistente. Questa soluzione  garantisce la continuità crittografica dell'issuer,
una  condizione essenziale per la validità a lungo termine delle VC emesse.

Poiché l'archivio *veramo.sqlite* contiene le chiavi private dell'issuer, è stato trattato come *root of trust* del sistema ed è stato previsto uno script di backup cifrato AES-256-GCM - 
standard di crittografia simmetrica capace di garantire riservatezza e integrità con algoritmo Galois-Counter-Mode e chiavi a 256 bit-
così da separare il runtime e backup crittografato *veramo.sqlite.enc*.

# Struttura  filesystem  del progetto

Ricapitolando, nella adozione  degli standard OID4VCI (OpenID for Verifiable Credential Issuance) è stato scelto l'uso di JWT-VC,
privilegiando la interoperabilità con wallet esistenti,
semplicità di integrazione secondo OAuth2 e riduzione della complessità operativa,  in alternativa alle VC JSON-LD con Linked Data Proofs.
Come detto, il codice Veramo è stato utilizzato come dipendenza incapsulata, per creare un adapter interno, mentre il codice che segue lo standard OID4VCI di Sphereon è stato "rifattorizzato" per creare un flusso completo end-to-end.

La struttura  contempera tutti i files utilizzati.
```

ssi-oid4vci/
       |_ package.json
       |_ pnpm-lock.yaml
       |_ .env
       |_ scripts/
       |    |---- backup-veramo.js/
       |    |---- restore-veramo.js/       
       |_ src/
       |    |---- agent-adapter/
       |    |                |_ veramo.adapter.js
       |    |---services/
       |    |         |- issuer-state.service.js
       |    |         |_ vc-issuance.service.js
       |    |---middleware/
       |    |         |- vc-auth-middleware.js
       |    |---models/
       |    |         |- audit.model.js 
       |    |         |- binding.model.js        
       |    |         |- issuer-state.model.js        
       |    |         |_ vc-status.model.js      
       |    |- controllers/
       |           |- metadata.controller.js
       |           |- token.controller.js
       |           |- credential-offer.controller.js
       |           |- credential.controller.js
       |           |- vc-status-read.controller.js
       |           |_ vc-status.controller.js   
       |- app.js
       |- index.js
       |- routes.js
       |- veramo.sqlite
```
## Test da Power Shell
Concludiamo  con  il listato dei comandi di invio delle richieste da PowerShell utilizzati per verificare la correttezza del codice.

Sequenza comandi bash per il test del modulo
```

1) Credential Offer
\$r = Invoke-WebRequest http://localhost:3000/credential-offer -Method GET

\$offer = \$r.Content | ConvertFrom-Json

\$code = \$offer.grants."urn:ietf:params:oauth:grant-type:pre-authorized\_code"."pre-authorized\_code"

2) Token (pre-authorized\_code -> access\_token)

\$t = Invoke-WebRequest http://localhost:3000/token `
  -Method POST `
  -Headers @{ "Content-Type"="application/x-www-form-urlencoded" } `
  -Body "grant\_type=urn:ietf:params:oauth:grant-type:pre-authorized\_code\&pre-authorized\_code=\$code"

\$token = (\$t.Content | ConvertFrom-Json).access\_token

3) Issue Credential

\$c = Invoke-WebRequest http://localhost:3000/credential `
  -Method POST `
  -Headers @{
    "Content-Type"="application/json"
    "Authorization"="Bearer \$token"
  } `
  -Body '{ "credentialSubject": { "id": "did:example:subject" } }'
  
\$vc = (\$c.Content | ConvertFrom-Json).credential

4) (Opzionale) Suspend / Revoke sostituendo <VC\_ID> con il vcId (hash) salvato in Mongo

Invoke-WebRequest http://localhost:3000/vc-status/<VC\_ID> `
  -Method PATCH `
  -Headers @{ "Content-Type"="application/json" } `
  -Body '{ "status": "suspended", "reason": "test" }'
```
