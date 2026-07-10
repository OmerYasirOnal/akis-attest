import { fromBase64, toBase64 } from './encoding.js'
import { ensureKeyPair, signBytes, verifyBytes } from './keys.js'

export interface DsseEnvelope {
  payloadType: string
  payload: string
  signatures: Array<{ keyid: string; sig: string; publicKeySpki: string }>
}

export function pae(payloadType: string, payload: Uint8Array): Uint8Array {
  const typeBytes = new TextEncoder().encode(payloadType)
  const header = new TextEncoder().encode(`DSSEv1 ${typeBytes.length} ${payloadType} ${payload.length} `)
  const out = new Uint8Array(header.length + payload.length)
  out.set(header)
  out.set(payload, header.length)
  return out
}

export function signEnvelope(payloadType: string, payloadBytes: Uint8Array): DsseEnvelope {
  const kp = ensureKeyPair()
  const sig = signBytes(pae(payloadType, payloadBytes), kp.privateKeyPem)
  return {
    payloadType,
    payload: toBase64(payloadBytes),
    signatures: [{ keyid: kp.fingerprint, sig, publicKeySpki: kp.publicKeySpkiB64 }],
  }
}

export function verifyEnvelope(env: DsseEnvelope): boolean {
  const first = env.signatures[0]
  if (!first) return false
  return verifyBytes(pae(env.payloadType, fromBase64(env.payload)), first.sig, first.publicKeySpki)
}
