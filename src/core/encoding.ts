import { createHash } from 'node:crypto'

export function canonicalJson(value: unknown): string {
  if (value === null) return 'null'
  const t = typeof value
  if (t === 'number' || t === 'boolean') return JSON.stringify(value)
  if (t === 'string') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map((v) => canonicalJson(v)).join(',')}]`
  if (t === 'object') {
    const obj = value as Record<string, unknown>
    const keys = Object.keys(obj).sort()
    return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalJson(obj[k])}`).join(',')}}`
  }
  throw new Error(`canonicalJson: cannot serialize value of type ${t}`)
}

export function sha256Hex(data: string | Uint8Array): string {
  return createHash('sha256').update(data).digest('hex')
}

export function toBase64(data: Uint8Array | string): string {
  return Buffer.from(data).toString('base64')
}

export function fromBase64(b64: string): Buffer {
  return Buffer.from(b64, 'base64')
}
