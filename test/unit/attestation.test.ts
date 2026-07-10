import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { runApprove } from '../../src/commands/approve.js'
import { runInit } from '../../src/commands/init.js'
import { runVerify } from '../../src/commands/verify.js'
import { buildStatement, writeAttestation } from '../../src/core/attestation.js'
import { loadConfig, saveConfig } from '../../src/core/config.js'
import { verifyEnvelope } from '../../src/core/dsse.js'
import { execFileSync } from 'node:child_process'
import { fixtureRepo, tmpDir } from '../helpers.js'

async function deliveredRepo(): Promise<string> {
  process.env.AKIS_ATTEST_HOME = tmpDir()
  const repo = fixtureRepo()
  runInit(['--project', 'demo', '--test-command', 'echo "Tests  1 passed (1)"'], repo)
  const cfg = loadConfig(repo)
  saveConfig(repo, { ...cfg, artifacts: ['app.txt'] })
  execFileSync('git', ['add', '-A'], { cwd: repo })
  execFileSync('git', ['commit', '-m', 'attest setup'], { cwd: repo })
  runApprove(['plan', '-m', 'scope'], repo)
  await runVerify([], repo)
  runApprove(['delivery', '-m', 'ship it'], repo)
  return repo
}

describe('attestation', () => {
  it('builds a statement with git subject, artifact digest and gate chain', async () => {
    const repo = await deliveredRepo()
    const st = buildStatement(repo)
    expect(st._type).toBe('https://in-toto.io/Statement/v1')
    expect(st.subject[0]!.digest.gitCommit).toMatch(/^[0-9a-f]{40}$/)
    expect(st.subject[1]).toMatchObject({ name: 'app.txt' })
    expect(st.predicate.gates.plan.message).toBe('scope')
    expect(st.predicate.gates.delivery.message).toBe('ship it')
    expect(st.predicate.ledger.root).toMatch(/^[0-9a-f]{64}$/)
  })
  it('writes a DSSE envelope that verifies', async () => {
    const repo = await deliveredRepo()
    const { envelope } = writeAttestation(repo)
    expect(verifyEnvelope(envelope)).toBe(true)
  })
  it('throws when gates are incomplete', () => {
    process.env.AKIS_ATTEST_HOME = tmpDir()
    const repo = fixtureRepo()
    runInit([], repo)
    expect(() => buildStatement(repo)).toThrow(/gates incomplete/)
  })
})
