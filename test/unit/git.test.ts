import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { gitUser, headSha, isDirty, isGitRepo } from '../../src/core/git.js'
import { fixtureRepo, tmpDir } from '../helpers.js'

function gitIn(dir: string, ...args: string[]): void {
  execFileSync('git', args, {
    cwd: dir,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_SYSTEM: '/dev/null' },
  })
}

function repoWithSubdir(): string {
  const repo = fixtureRepo()
  mkdirSync(join(repo, 'sub'))
  writeFileSync(join(repo, 'sub', 'keep.txt'), 'k\n')
  gitIn(repo, 'add', '-A')
  gitIn(repo, 'commit', '-m', 'add subdir')
  return repo
}

describe('git helpers', () => {
  it('detects a repo, reads HEAD sha and user', () => {
    const repo = fixtureRepo()
    expect(isGitRepo(repo)).toBe(true)
    expect(headSha(repo)).toMatch(/^[0-9a-f]{40}$/)
    expect(gitUser(repo)).toBe('Fixture <fx@test>')
  })
  it('detects dirty tree (untracked and modified)', () => {
    const repo = fixtureRepo()
    expect(isDirty(repo)).toBe(false)
    writeFileSync(join(repo, 'new.txt'), 'x')
    expect(isDirty(repo)).toBe(true)
  })
  it('non-repo dir: isGitRepo false', () => {
    expect(isGitRepo(tmpDir())).toBe(false)
  })
  it('sees a dirty repo-root file even when cwd is a subdir', () => {
    const repo = repoWithSubdir()
    expect(isDirty(join(repo, 'sub'))).toBe(false)
    writeFileSync(join(repo, 'rootfile.txt'), 'x')
    expect(isDirty(join(repo, 'sub'))).toBe(true)
  })
  it('still ignores root .attest/ changes from a subdir cwd', () => {
    const repo = repoWithSubdir()
    mkdirSync(join(repo, '.attest'))
    writeFileSync(join(repo, '.attest', 'whatever'), 'x')
    expect(isDirty(join(repo, 'sub'))).toBe(false)
  })
})
