import { describe, expect, it } from 'vitest'
import { pae, signEnvelope, verifyEnvelope } from '../../src/core/dsse.js'
import { toBase64 } from '../../src/core/encoding.js'
import { tmpDir } from '../helpers.js'

describe('dsse', () => {
  it('pae matches the DSSE v1 spec shape', () => {
    const out = new TextDecoder().decode(pae('t', new TextEncoder().encode('pp')))
    expect(out).toBe('DSSEv1 1 t 2 pp')
  })

  it('sign/verify round-trips and detects payload tampering', () => {
    process.env.AKIS_ATTEST_HOME = tmpDir()
    const env = signEnvelope('application/vnd.in-toto+json', new TextEncoder().encode('{"a":1}'))
    expect(verifyEnvelope(env)).toBe(true)
    expect(verifyEnvelope({ ...env, payload: toBase64('{"a":2}') })).toBe(false)
  })
})
