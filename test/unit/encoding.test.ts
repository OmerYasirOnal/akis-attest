import { describe, expect, it } from 'vitest'
import { canonicalJson, fromBase64, sha256Hex, toBase64 } from '../../src/core/encoding.js'

describe('canonicalJson', () => {
  it('sorts object keys recursively and emits no whitespace', () => {
    expect(canonicalJson({ b: 1, a: { d: [2, 'x'], c: null } })).toBe('{"a":{"c":null,"d":[2,"x"]},"b":1}')
  })
  it('is stable regardless of insertion order', () => {
    expect(canonicalJson({ x: 1, y: 2 })).toBe(canonicalJson({ y: 2, x: 1 }))
  })
  it('throws on undefined and functions', () => {
    expect(() => canonicalJson({ a: undefined })).toThrow()
    expect(() => canonicalJson({ a: () => 1 })).toThrow()
  })
})

describe('sha256Hex / base64', () => {
  it('hashes known vector', () => {
    expect(sha256Hex('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')
  })
  it('round-trips base64', () => {
    expect(fromBase64(toBase64('hello')).toString('utf8')).toBe('hello')
  })
})
