import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { attestDir } from '../core/config.js'
import { verifyEnvelope, type DsseEnvelope } from '../core/dsse.js'
import { fromBase64 } from '../core/encoding.js'
import { verifyChain, type LedgerEvent } from '../core/ledger.js'

interface Checkable {
  ledger: LedgerEvent[]
  envelope: DsseEnvelope | null
}

function fromRepo(cwd: string): Checkable {
  const dir = attestDir(cwd)
  const ledgerPath = join(dir, 'ledger.jsonl')
  const envPath = join(dir, 'envelope.json')
  const ledger = existsSync(ledgerPath)
    ? readFileSync(ledgerPath, 'utf8').split('\n').filter((l) => l.trim() !== '').map((l) => JSON.parse(l) as LedgerEvent)
    : []
  const envelope = existsSync(envPath) ? (JSON.parse(readFileSync(envPath, 'utf8')) as DsseEnvelope) : null
  return { ledger, envelope }
}

function fromHtml(path: string): Checkable {
  const html = readFileSync(path, 'utf8')
  const match = /<script id="attest-bundle" type="application\/json">([\s\S]*?)<\/script>/.exec(html)
  if (!match) throw new Error('no embedded attest bundle found in this file')
  const bundle = JSON.parse(match[1]!) as { ledger: LedgerEvent[]; envelope: DsseEnvelope | null }
  return { ledger: bundle.ledger, envelope: bundle.envelope }
}

export function runCheck(argv: string[], cwd: string): number {
  const target = argv[0]
  let subject: Checkable
  try {
    subject = target !== undefined && target.endsWith('.html') ? fromHtml(target) : fromRepo(cwd)
  } catch (e) {
    console.error(`error: ${(e as Error).message}`)
    return 1
  }
  let ok = true
  const chain = verifyChain(subject.ledger)
  console.log(chain.ok ? 'chain: OK' : `chain: FAIL at seq ${chain.brokenAtSeq} (${chain.reason})`)
  if (!chain.ok) ok = false
  if (subject.envelope === null) {
    console.log('signature: absent (draft or not exported)')
    ok = false
  } else {
    const sigOk = verifyEnvelope(subject.envelope)
    console.log(sigOk ? 'signature: OK' : 'signature: FAIL')
    if (!sigOk) ok = false
    const statement = JSON.parse(fromBase64(subject.envelope.payload).toString('utf8')) as {
      predicate: { ledger: { root: string } }
    }
    const last = subject.ledger[subject.ledger.length - 1]
    const rootOk = last !== undefined && statement.predicate.ledger.root === last.hash
    console.log(rootOk ? 'root: OK' : 'root: FAIL (attestation does not match this ledger)')
    if (!rootOk) ok = false
  }
  console.log(ok ? 'PASS' : 'FAIL')
  return ok ? 0 : 1
}
