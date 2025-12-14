// In-memory store for issuer states
const issuerStates = new Map()

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
}
