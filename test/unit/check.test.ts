import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { execFileSync } from 'node:child_process'
import { runApprove } from '../../src/commands/approve.js'
import { runCheck } from '../../src/commands/check.js'
import { runExport } from '../../src/commands/export.js'
import { runInit } from '../../src/commands/init.js'
import { runVerify } from '../../src/commands/verify.js'
import { fixtureRepo, tmpDir } from '../helpers.js'

async function exportedRepo(): Promise<string> {
  process.env.AKIS_ATTEST_HOME = tmpDir()
  const repo = fixtureRepo()
  runInit(['--test-command', 'echo "Tests  1 passed (1)"'], repo)
  execFileSync('git', ['add', '-A'], { cwd: repo })
  execFileSync('git', ['commit', '-m', 'setup'], { cwd: repo })
  runApprove(['plan', '-m', 'scope'], repo)
  await runVerify([], repo)
  runApprove(['delivery', '-m', 'ship'], repo)
  runExport([], repo)
  return repo
}

describe('attest check', () => {
  it('passes on an intact repo and on the exported proof.html', async () => {
    const repo = await exportedRepo()
    expect(runCheck([], repo)).toBe(0)
    expect(runCheck([join(repo, 'proof.html')], repo)).toBe(0)
  })
  it('fails on a tampered proof.html', async () => {
    const repo = await exportedRepo()
    const path = join(repo, 'proof.html')
    writeFileSync(path, readFileSync(path, 'utf8').replace('"message":"ship"', '"message":"HACK"'))
    expect(runCheck([path], repo)).toBe(1)
  })
  it('fails (exit 1) on a repo without a signature', () => {
    process.env.AKIS_ATTEST_HOME = tmpDir()
    const repo = fixtureRepo()
    runInit([], repo)
    expect(runCheck([], repo)).toBe(1)
  })
})
