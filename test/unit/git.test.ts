import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { gitUser, headSha, isDirty, isGitRepo } from '../../src/core/git.js'
import { fixtureRepo, tmpDir } from '../helpers.js'

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
})
