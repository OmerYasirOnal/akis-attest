import { execFileSync, spawnSync } from 'node:child_process'
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, symlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, test } from '@playwright/test'

// These tests exercise the CLI exactly the way npm runs it: through a bin SYMLINK
// (node_modules/.bin/attest -> dist/cli.js). No browser involved.
const CLI = join(process.cwd(), 'dist/cli.js')

function makeBinSymlink(): string {
  // dist/cli.js is rebuilt by `pnpm e2e` (tsc emits mode 644) — make it executable so the
  // shebang path is what actually runs, exactly like npm's chmod on install.
  chmodSync(CLI, 0o755)
  const dir = mkdtempSync(join(tmpdir(), 'attest-bin-'))
  mkdirSync(join(dir, 'bin'))
  const link = join(dir, 'bin', 'attest')
  symlinkSync(CLI, link)
  return link
}

function freshRepo(): { repo: string; env: NodeJS.ProcessEnv } {
  const home = mkdtempSync(join(tmpdir(), 'attest-home-'))
  const repo = mkdtempSync(join(tmpdir(), 'attest-cli-'))
  const env = {
    ...process.env,
    AKIS_ATTEST_HOME: home,
    GIT_CONFIG_GLOBAL: '/dev/null',
    GIT_CONFIG_SYSTEM: '/dev/null',
  }
  const git = (...a: string[]) => execFileSync('git', a, { cwd: repo, env })
  git('init', '-b', 'main')
  git('config', 'user.name', 'E2E')
  git('config', 'user.email', 'e2e@test')
  git('commit', '--allow-empty', '-m', 'initial')
  return { repo, env }
}

test('the npm bin symlink really runs the CLI (not a silent no-op)', () => {
  // The whole point is invoking the SYMLINK itself via its shebang — `node <symlink>`
  // would not reproduce the argv[1]-name bug. Guard that the shebang exists.
  expect(readFileSync(CLI, 'utf8').startsWith('#!/usr/bin/env node')).toBe(true)
  const link = makeBinSymlink()
  const { repo, env } = freshRepo()
  execFileSync(link, ['init', '--project', 'p', '--test-command', 'echo ok'], { cwd: repo, env })
  expect(existsSync(join(repo, '.attest', 'config.json'))).toBe(true)
})

test('an unknown flag exits 1 with a clean error line, not a raw crash', () => {
  const link = makeBinSymlink()
  const { repo, env } = freshRepo()
  const res = spawnSync(link, ['init', '--bogus'], { cwd: repo, env, encoding: 'utf8' })
  expect(res.status).toBe(1)
  expect(res.stderr.startsWith('error:')).toBe(true)
  expect(res.stderr).not.toContain('ERR_PARSE_ARGS')
})
