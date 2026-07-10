import { execFileSync, execSync } from 'node:child_process'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from '@playwright/test'

// Drive the BUILT CLI (dist/cli.js), not tsx: `pnpm e2e` runs `pnpm build` first, and the
// SDK repo (process.cwd() when playwright runs) is the tool source. This exercises the real
// build artifact. Resolved once at module scope; each buildProof() uses its own temp repo/home.
const CLI = join(process.cwd(), 'dist/cli.js')

function buildProof(): string {
  const home = mkdtempSync(join(tmpdir(), 'attest-home-'))
  const repo = mkdtempSync(join(tmpdir(), 'attest-e2e-'))
  const env = { ...process.env, AKIS_ATTEST_HOME: home }
  // Isolate the fixture from the machine's global/system git config (gpgsign, hooksPath, …),
  // same hardening as test/helpers.ts — the local user.name/user.email config below still applies.
  const gitEnv = { ...process.env, GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_SYSTEM: '/dev/null' }
  const git = (...a: string[]) => execFileSync('git', a, { cwd: repo, env: gitEnv })
  git('init', '-b', 'main')
  git('config', 'user.name', 'E2E')
  git('config', 'user.email', 'e2e@test')
  writeFileSync(join(repo, 'app.txt'), 'hello')
  git('add', '-A')
  git('commit', '-m', 'initial')
  const attest = (args: string) => execSync(`node "${CLI}" ${args}`, { cwd: repo, env })
  attest('init --project e2e --test-command "echo \\"Tests  1 passed (1)\\""')
  git('add', '-A')
  git('commit', '-m', 'attest setup')
  attest('approve plan -m scope')
  attest('verify')
  attest('approve delivery -m ship')
  attest('export')
  return join(repo, 'proof.html')
}

test('proof.html verifies itself in a real browser', async ({ page }) => {
  const proofPath = buildProof()
  await page.goto(`file://${proofPath}`)
  await expect(page.locator('body')).toHaveAttribute('data-verify-state', 'ok', { timeout: 10_000 })
  await page.click('#lang-toggle')
  await expect(page.locator('h1')).toContainText('Teslimat kanıtı')
})

test('a tampered proof.html fails in the browser', async ({ page }) => {
  const proofPath = buildProof()
  const tampered = proofPath.replace('proof.html', 'tampered.html')
  writeFileSync(tampered, readFileSync(proofPath, 'utf8').replace('"message":"ship"', '"message":"HACK"'))
  await page.goto(`file://${tampered}`)
  await expect(page.locator('body')).toHaveAttribute('data-verify-state', 'fail', { timeout: 10_000 })
})
