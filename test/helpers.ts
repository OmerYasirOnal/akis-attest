import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync as wf } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach } from 'vitest'

const created: string[] = []

export function tmpDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'attest-'))
  created.push(dir)
  return dir
}

afterEach(() => {
  while (created.length > 0) rmSync(created.pop()!, { recursive: true, force: true })
})

export function fixtureRepo(): string {
  const dir = tmpDir()
  const git = (...args: string[]) => execFileSync('git', args, { cwd: dir, encoding: 'utf8' })
  git('init', '-b', 'main')
  git('config', 'user.name', 'Fixture')
  git('config', 'user.email', 'fx@test')
  wf(`${dir}/app.txt`, 'v1\n')
  git('add', '-A')
  git('commit', '-m', 'initial')
  return dir
}
