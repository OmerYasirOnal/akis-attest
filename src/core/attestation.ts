import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { attestDir, loadConfig } from './config.js'
import { canonicalJson, sha256Hex } from './encoding.js'
import { signEnvelope, type DsseEnvelope } from './dsse.js'
import { readLedger, type LedgerEvent } from './ledger.js'

export const STATEMENT_TYPE = 'https://in-toto.io/Statement/v1'
export const PREDICATE_TYPE = 'https://omeryasironal.com/akis-attest/predicate/v1'
export const PAYLOAD_TYPE = 'application/vnd.in-toto+json'
const TOOL_VERSION = '0.1.0'

export interface InTotoStatement {
  _type: string
  subject: Array<{ name: string; digest: Record<string, string> }>
  predicateType: string
  predicate: {
    gates: {
      plan: { ts: string; actor: string; message: string }
      verify: Record<string, unknown>
      delivery: { ts: string; actor: string; message: string }
    }
    ledger: { root: string; length: number }
    tool: { name: string; version: string }
  }
}

function lastOf(events: LedgerEvent[], kind: LedgerEvent['kind']): LedgerEvent | undefined {
  return [...events].reverse().find((e) => e.kind === kind)
}

export function buildStatement(cwd: string): InTotoStatement {
  const cfg = loadConfig(cwd)
  const events = readLedger(attestDir(cwd))
  const plan = lastOf(events, 'approve_plan')
  const delivery = lastOf(events, 'approve_delivery')
  const missing = [!plan && 'plan approval', !delivery && 'delivery approval'].filter(Boolean)
  if (!plan || !delivery) throw new Error(`gates incomplete: missing ${missing.join(', ')}`)
  const verifySeq = delivery.payload.verifySeq as number
  const verifyEvent = events.find((e) => e.seq === verifySeq)
  if (!verifyEvent) throw new Error('gates incomplete: delivery references a missing verify event')
  const last = events[events.length - 1]!
  const subject: InTotoStatement['subject'] = [
    { name: cfg.project, digest: { gitCommit: delivery.gitSha } },
    ...(cfg.artifacts ?? []).map((rel) => ({
      name: rel,
      digest: { sha256: sha256Hex(readFileSync(join(cwd, rel))) },
    })),
  ]
  return {
    _type: STATEMENT_TYPE,
    subject,
    predicateType: PREDICATE_TYPE,
    predicate: {
      gates: {
        plan: { ts: plan.ts, actor: plan.actor, message: String(plan.payload.message) },
        verify: { ts: verifyEvent.ts, actor: verifyEvent.actor, ...verifyEvent.payload },
        delivery: { ts: delivery.ts, actor: delivery.actor, message: String(delivery.payload.message) },
      },
      ledger: { root: last.hash, length: events.length },
      tool: { name: 'akis-attest', version: TOOL_VERSION },
    },
  }
}

export function writeAttestation(cwd: string): { statement: InTotoStatement; envelope: DsseEnvelope } {
  const statement = buildStatement(cwd)
  const envelope = signEnvelope(PAYLOAD_TYPE, new TextEncoder().encode(canonicalJson(statement)))
  const dir = attestDir(cwd)
  writeFileSync(join(dir, 'attestation.json'), JSON.stringify(statement, null, 2) + '\n')
  writeFileSync(join(dir, 'envelope.json'), JSON.stringify(envelope, null, 2) + '\n')
  return { statement, envelope }
}
