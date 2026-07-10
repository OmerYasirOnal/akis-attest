import { describe, expect, it } from 'vitest'
import { runInit } from '../../src/commands/init.js'
import { runVerify } from '../../src/commands/verify.js'
import { attestDir } from '../../src/core/config.js'
import { readLedger } from '../../src/core/ledger.js'
import { fixtureRepo, tmpDir } from '../helpers.js'

describe('attest verify', () => {
  it('appends a passing verify event and exits 0', async () => {
    process.env.AKIS_ATTEST_HOME = tmpDir()
    const repo = fixtureRepo()
    runInit(['--test-command', 'echo "Tests  2 passed (2)"'], repo)
    expect(await runVerify([], repo)).toBe(0)
    const last = readLedger(attestDir(repo)).at(-1)!
    expect(last.kind).toBe('verify')
    expect(last.payload.pass).toBe(true)
  })
  it('records a FAILING run honestly and exits 1', async () => {
    process.env.AKIS_ATTEST_HOME = tmpDir()
    const repo = fixtureRepo()
    runInit(['--test-command', 'exit 1'], repo)
    expect(await runVerify([], repo)).toBe(1)
    const last = readLedger(attestDir(repo)).at(-1)!
    expect(last.kind).toBe('verify')
    expect(last.payload.pass).toBe(false)
  })
})
