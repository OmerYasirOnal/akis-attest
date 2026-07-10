import { generateKeyPairSync, createPrivateKey, createPublicKey, sign, verify } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { fromBase64, sha256Hex, toBase64 } from './encoding.js'

export interface KeyPair {
  privateKeyPem: string
  publicKeySpkiB64: string
  fingerprint: string
}

export function attestHome(): string {
  return process.env.AKIS_ATTEST_HOME ?? join(homedir(), '.config', 'akis-attest')
}

function derive(privateKeyPem: string): KeyPair {
  const publicKey = createPublicKey(createPrivateKey(privateKeyPem))
  const spkiDer = publicKey.export({ type: 'spki', format: 'der' })
  return { privateKeyPem, publicKeySpkiB64: toBase64(spkiDer), fingerprint: sha256Hex(spkiDer) }
}

export function ensureKeyPair(): KeyPair {
  const home = attestHome()
  const keyPath = join(home, 'key.pem')
  if (existsSync(keyPath)) return derive(readFileSync(keyPath, 'utf8'))
  const { privateKey, publicKey } = generateKeyPairSync('ed25519')
  const privateKeyPem = privateKey.export({ type: 'pkcs8', format: 'pem' }).toString()
  mkdirSync(home, { recursive: true })
  writeFileSync(keyPath, privateKeyPem, { mode: 0o600 })
  writeFileSync(join(home, 'key.pub.pem'), publicKey.export({ type: 'spki', format: 'pem' }).toString())
  return derive(privateKeyPem)
}

export function signBytes(data: Uint8Array, privateKeyPem: string): string {
  return toBase64(sign(null, data, createPrivateKey(privateKeyPem)))
}

export function verifyBytes(data: Uint8Array, sigB64: string, publicKeySpkiB64: string): boolean {
  try {
    const publicKey = createPublicKey({ key: fromBase64(publicKeySpkiB64), format: 'der', type: 'spki' })
    return verify(null, data, publicKey, fromBase64(sigB64))
  } catch {
    return false
  }
}
