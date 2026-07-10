import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { execFileSync } from 'node:child_process'
import { runApprove } from '../../src/commands/approve.js'
import { runExport } from '../../src/commands/export.js'
import { runInit } from '../../src/commands/init.js'
import { runVerify } from '../../src/commands/verify.js'
import { fixtureRepo, tmpDir } from '../helpers.js'

async function deliveredRepo(): Promise<string> {
  process.env.AKIS_ATTEST_HOME = tmpDir()
  const repo = fixtureRepo()
  runInit(['--project', 'demo', '--test-command', 'echo "Tests  1 passed (1)"'], repo)
  execFileSync('git', ['add', '-A'], { cwd: repo })
  execFileSync('git', ['commit', '-m', 'setup'], { cwd: repo })
  runApprove(['plan', '-m', 'scope'], repo)
  await runVerify([], repo)
  runApprove(['delivery', '-m', 'ship'], repo)
  return repo
}

describe('attest export', () => {
  it('writes a self-contained proof.html embedding the signed bundle', async () => {
    const repo = await deliveredRepo()
    expect(runExport([], repo)).toBe(0)
    const html = readFileSync(join(repo, 'proof.html'), 'utf8')
    expect(html).toContain('id="attest-bundle"')
    const embedded = /<script id="attest-bundle" type="application\/json">([\s\S]*?)<\/script>/.exec(html)!
    const bundle = JSON.parse(embedded[1]!)
    expect(bundle.schema).toBe('akis-attest/proof-bundle/v1')
    expect(bundle.envelope.signatures[0].sig.length).toBeGreaterThan(10)
    expect(bundle.draft).toBe(false)
    expect(html).not.toContain('src="http')
  })
  it('refuses full export before delivery, allows --draft with null envelope', async () => {
    process.env.AKIS_ATTEST_HOME = tmpDir()
    const repo = fixtureRepo()
    runInit([], repo)
    expect(runExport([], repo)).toBe(1)
    expect(runExport(['--draft'], repo)).toBe(0)
    const html = readFileSync(join(repo, 'proof.html'), 'utf8')
    const bundle = JSON.parse(/<script id="attest-bundle" type="application\/json">([\s\S]*?)<\/script>/.exec(html)![1]!)
    expect(bundle.draft).toBe(true)
    expect(bundle.envelope).toBeNull()
  })
})
