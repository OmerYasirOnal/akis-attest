import { execFileSync } from 'node:child_process'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { main } from '../../src/cli.js'
import { fixtureRepo, tmpDir } from '../helpers.js'

describe('full flow via CLI dispatch', () => {
  it('init → approve plan → verify → approve delivery → export → check', async () => {
    process.env.AKIS_ATTEST_HOME = tmpDir()
    const repo = fixtureRepo()
    const cwd = process.cwd()
    process.chdir(repo)
    try {
      expect(await main(['init', '--project', 'flow', '--test-command', 'echo "Tests  1 passed (1)"'])).toBe(0)
      execFileSync('git', ['add', '-A'], { cwd: repo })
      execFileSync('git', ['commit', '-m', 'attest setup'], { cwd: repo })
      expect(await main(['approve', 'plan', '-m', 'scope'])).toBe(0)
      expect(await main(['verify'])).toBe(0)
      expect(await main(['approve', 'delivery', '-m', 'ship'])).toBe(0)
      expect(await main(['export'])).toBe(0)
      expect(await main(['check', join(repo, 'proof.html')])).toBe(0)
      expect(await main(['bogus'])).toBe(2)
    } finally {
      process.chdir(cwd)
    }
  })
})
