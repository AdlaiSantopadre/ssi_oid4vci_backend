// In-memory store for issuer states
/*const issuerStates = new Map()

export function createIssuerState(data = {}) {
  const stateId = crypto.randomUUID()
  issuerStates.set(stateId, { stateId, status: "created", data })
  return issuerStates.get(stateId)
}

export function getIssuerState(stateId) {
  return issuerStates.get(stateId)
}

export function updateIssuerState(stateId, updates) {
  const state = issuerStates.get(stateId)
  if (!state) return null
  Object.assign(state, updates)
  return state
}*/
// src/services/issuer-state.service.js
import { nanoid } from "nanoid";
import { IssuerState } from "../models/issuer-state.model.js";

const DEFAULT_TTL_SEC = Number(process.env.OID4VCI_STATE_TTL_SEC ?? 600);

function expiresAtFromNow(ttlSec = DEFAULT_TTL_SEC) {
  return new Date(Date.now() + ttlSec * 1000);
}

export async function createSession({ ttlSec } = {}) {
  const sessionId = nanoid();
  const state = nanoid(32);
  const nonce = nanoid(32);

  const doc = await IssuerState.create({
    sessionId,
    state,
    nonce,
    status: "pending",
    expiresAt: expiresAtFromNow(ttlSec),
  });

  return { sessionId: doc.sessionId, state: doc.state, nonce: doc.nonce, expiresAt: doc.expiresAt };
}
// Retrieves the issuer state by its state value
export async function getByState(state) {
  console.log("[STATE] lookup token:", state);
  return await IssuerState.findOne({ state }).lean();

}
// Marks the state as consumed, preventing further use
export async function consumeState(state) {
  // atomic operation to avoid race conditions
  const res = await IssuerState.findOneAndUpdate(
    // only pending or issued states can be consumed
    { state, status: { $in: ["pending", "issued"] } },
    // mark as consumed
    { $set: { status: "consumed" } },

    { new: true }

  ).lean(); //.lean() to get a plain JS object  
  return res;
}

export async function bindSubject(state, subjectDid) {
  const res = await IssuerState.findOneAndUpdate(
    { state, status: "pending" },
    { $set: { subjectDid } },
    { new: true }
  ).lean();
  return res;
}

export async function markIssued(state, credentialId) {
  const res = await IssuerState.findOneAndUpdate(
    { state, status: "pending" },
    { $set: { status: "issued", credentialId } },
    { new: true }
  ).lean();
  return res;
}

