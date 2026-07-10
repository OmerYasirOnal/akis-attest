import { describe, expect, it } from 'vitest'
import { attestHome, ensureKeyPair, signBytes, verifyBytes } from '../../src/core/keys.js'
import { tmpDir } from '../helpers.js'

describe('keys', () => {
  it('generates once, then reloads the same key', () => {
    process.env.AKIS_ATTEST_HOME = tmpDir()
    const a = ensureKeyPair()
    const b = ensureKeyPair()
    expect(a.fingerprint).toBe(b.fingerprint)
    expect(a.fingerprint).toMatch(/^[0-9a-f]{64}$/)
    expect(attestHome()).toBe(process.env.AKIS_ATTEST_HOME)
  })

  it('signs and verifies; rejects tampered data and wrong key', () => {
    process.env.AKIS_ATTEST_HOME = tmpDir()
    const kp = ensureKeyPair()
    const data = new TextEncoder().encode('payload')
    const sig = signBytes(data, kp.privateKeyPem)
    expect(verifyBytes(data, sig, kp.publicKeySpkiB64)).toBe(true)
    expect(verifyBytes(new TextEncoder().encode('tampered'), sig, kp.publicKeySpkiB64)).toBe(false)
    process.env.AKIS_ATTEST_HOME = tmpDir()
    const other = ensureKeyPair()
    expect(verifyBytes(data, sig, other.publicKeySpkiB64)).toBe(false)
  })
})
