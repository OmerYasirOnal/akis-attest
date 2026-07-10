import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { canonicalJson, sha256Hex } from './encoding.js'

export type EventKind = 'init' | 'approve_plan' | 'verify' | 'approve_delivery'

export interface LedgerEvent {
  seq: number
  ts: string
  kind: EventKind
  gitSha: string
  dirty: boolean
  actor: string
  payload: Record<string, unknown>
  prevHash: string
  hash: string
}

export const GENESIS_HASH = '0'.repeat(64)

function ledgerPath(attestDir: string): string {
  return join(attestDir, 'ledger.jsonl')
}

function computeHash(event: Omit<LedgerEvent, 'hash'>): string {
  return sha256Hex(canonicalJson(event))
}

export function readLedger(attestDir: string): LedgerEvent[] {
  const path = ledgerPath(attestDir)
  if (!existsSync(path)) return []
  return readFileSync(path, 'utf8')
    .split('\n')
    .filter((line) => line.trim() !== '')
    .map((line) => JSON.parse(line) as LedgerEvent)
}

export function appendEvent(
  attestDir: string,
  input: { kind: EventKind; gitSha: string; dirty: boolean; actor: string; payload: Record<string, unknown>; ts?: string },
): LedgerEvent {
  mkdirSync(attestDir, { recursive: true })
  const events = readLedger(attestDir)
  const prev = events[events.length - 1]
  const unhashed: Omit<LedgerEvent, 'hash'> = {
    seq: (prev?.seq ?? 0) + 1,
    ts: input.ts ?? new Date().toISOString(),
    kind: input.kind,
    gitSha: input.gitSha,
    dirty: input.dirty,
    actor: input.actor,
    payload: input.payload,
    prevHash: prev?.hash ?? GENESIS_HASH,
  }
  const event: LedgerEvent = { ...unhashed, hash: computeHash(unhashed) }
  appendFileSync(ledgerPath(attestDir), JSON.stringify(event) + '\n')
  return event
}

export function verifyChain(events: LedgerEvent[]): { ok: true } | { ok: false; brokenAtSeq: number; reason: string } {
  let prevHash = GENESIS_HASH
  for (const event of events) {
    const { hash, ...unhashed } = event
    if (event.prevHash !== prevHash) {
      return { ok: false, brokenAtSeq: event.seq, reason: 'prevHash does not match previous event hash' }
    }
    if (computeHash(unhashed) !== hash) {
      return { ok: false, brokenAtSeq: event.seq, reason: 'event content does not match its hash' }
    }
    prevHash = hash
  }
  return { ok: true }
}
