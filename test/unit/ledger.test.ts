import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { GENESIS_HASH, appendEvent, readLedger, verifyChain } from '../../src/core/ledger.js'
import { tmpDir } from '../helpers.js'

function seed(dir: string) {
  appendEvent(dir, { kind: 'init', gitSha: 'a'.repeat(40), dirty: false, actor: 'Tester <t@x>', payload: {} })
  appendEvent(dir, { kind: 'approve_plan', gitSha: 'a'.repeat(40), dirty: false, actor: 'Tester <t@x>', payload: { message: 'scope' } })
}

describe('ledger', () => {
  it('chains events: seq increments, prevHash links, genesis is zeros', () => {
    const dir = tmpDir()
    seed(dir)
    const events = readLedger(dir)
    expect(events).toHaveLength(2)
    expect(events[0]!.seq).toBe(1)
    expect(events[0]!.prevHash).toBe(GENESIS_HASH)
    expect(events[1]!.prevHash).toBe(events[0]!.hash)
    expect(verifyChain(events)).toEqual({ ok: true })
  })

  it('detects a tampered payload', () => {
    const dir = tmpDir()
    seed(dir)
    const path = join(dir, 'ledger.jsonl')
    const lines = readFileSync(path, 'utf8').trimEnd().split('\n')
    const ev = JSON.parse(lines[1]!)
    ev.payload.message = 'tampered'
    lines[1] = JSON.stringify(ev)
    writeFileSync(path, lines.join('\n') + '\n')
    const res = verifyChain(readLedger(dir))
    expect(res).toMatchObject({ ok: false, brokenAtSeq: 2 })
  })

  it('detects a deleted event (broken prevHash link)', () => {
    const dir = tmpDir()
    seed(dir)
    appendEvent(dir, { kind: 'verify', gitSha: 'a'.repeat(40), dirty: false, actor: 'Tester <t@x>', payload: { pass: true } })
    const path = join(dir, 'ledger.jsonl')
    const lines = readFileSync(path, 'utf8').trimEnd().split('\n')
    writeFileSync(path, [lines[0], lines[2]].join('\n') + '\n')
    const res = verifyChain(readLedger(dir))
    expect(res.ok).toBe(false)
  })

  it('readLedger returns [] when file does not exist', () => {
    expect(readLedger(tmpDir())).toEqual([])
  })
})
