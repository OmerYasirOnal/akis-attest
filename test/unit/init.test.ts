import { existsSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { runInit } from '../../src/commands/init.js'
import { attestDir, loadConfig } from '../../src/core/config.js'
import { readLedger } from '../../src/core/ledger.js'
import { fixtureRepo, tmpDir } from '../helpers.js'

describe('attest init', () => {
  it('creates config, keypair and genesis event', () => {
    process.env.AKIS_ATTEST_HOME = tmpDir()
    const repo = fixtureRepo()
    expect(runInit(['--project', 'demo', '--test-command', 'echo ok'], repo)).toBe(0)
    const cfg = loadConfig(repo)
    expect(cfg.project).toBe('demo')
    expect(cfg.actor).toBe('Fixture <fx@test>')
    const events = readLedger(attestDir(repo))
    expect(events).toHaveLength(1)
    expect(events[0]!.kind).toBe('init')
  })
  it('refuses outside a git repo and refuses double init', () => {
    process.env.AKIS_ATTEST_HOME = tmpDir()
    expect(runInit([], tmpDir())).toBe(1)
    const repo = fixtureRepo()
    expect(runInit([], repo)).toBe(0)
    expect(runInit([], repo)).toBe(1)
  })
  it('cleans up .attest when init fails partway, so retry works', () => {
    const home = tmpDir()
    const repo = fixtureRepo()
    // Make ensureKeyPair fail: point AKIS_ATTEST_HOME at a FILE so mkdir inside it throws
    const blocker = join(home, 'not-a-dir')
    writeFileSync(blocker, 'x')
    process.env.AKIS_ATTEST_HOME = join(blocker, 'nested')
    expect(runInit([], repo)).toBe(1)
    expect(existsSync(join(repo, '.attest'))).toBe(false)
    process.env.AKIS_ATTEST_HOME = tmpDir()
    expect(runInit([], repo)).toBe(0)
  })
})
