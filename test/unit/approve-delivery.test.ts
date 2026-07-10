import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { runApprove } from '../../src/commands/approve.js'
import { runInit } from '../../src/commands/init.js'
import { runVerify } from '../../src/commands/verify.js'
import { attestDir } from '../../src/core/config.js'
import { readLedger } from '../../src/core/ledger.js'
import { fixtureRepo, tmpDir } from '../helpers.js'

async function readyRepo(): Promise<string> {
  process.env.AKIS_ATTEST_HOME = tmpDir()
  const repo = fixtureRepo()
  runInit(['--test-command', 'echo "Tests  1 passed (1)"'], repo)
  await runVerify([], repo)
  return repo
}

describe('attest approve delivery (fail-closed)', () => {
  it('approves when HEAD has a clean passing verify', async () => {
    const repo = await readyRepo()
    expect(runApprove(['delivery', '-m', 'v1 to client'], repo)).toBe(0)
    expect(readLedger(attestDir(repo)).at(-1)!.kind).toBe('approve_delivery')
  })
  it('refuses on a dirty tree', async () => {
    const repo = await readyRepo()
    writeFileSync(join(repo, 'junk.txt'), 'x')
    expect(runApprove(['delivery', '-m', 'x'], repo)).toBe(1)
  })
  it('refuses without any verify for HEAD', () => {
    process.env.AKIS_ATTEST_HOME = tmpDir()
    const repo = fixtureRepo()
    runInit([], repo)
    expect(runApprove(['delivery', '-m', 'x'], repo)).toBe(1)
  })
  it('refuses when the only verify for HEAD failed', async () => {
    process.env.AKIS_ATTEST_HOME = tmpDir()
    const repo = fixtureRepo()
    runInit(['--test-command', 'exit 1'], repo)
    await runVerify([], repo)
    expect(runApprove(['delivery', '-m', 'x'], repo)).toBe(1)
  })
})
