import { execFileSync } from 'node:child_process'

function git(cwd: string, ...args: string[]): string {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
}

export function isGitRepo(cwd: string): boolean {
  try {
    return git(cwd, 'rev-parse', '--is-inside-work-tree') === 'true'
  } catch {
    return false
  }
}

export function headSha(cwd: string): string {
  return git(cwd, 'rev-parse', 'HEAD')
}

export function isDirty(cwd: string): boolean {
  // Attest's own .attest/ bookkeeping (config + the append-only ledger, which grows on
  // every init/verify/approve) must never make the project read as "dirty" — dirtiness
  // is about the user's CODE state. The delivery gate (and the honesty `dirty` flag
  // recorded on each event) therefore excludes .attest/ from the working-tree check.
  return git(cwd, 'status', '--porcelain', '--', '.', ':(exclude).attest') !== ''
}

export function gitUser(cwd: string): string {
  try {
    const name = git(cwd, 'config', 'user.name')
    const email = git(cwd, 'config', 'user.email')
    if (name === '' || email === '') return 'unknown'
    return `${name} <${email}>`
  } catch {
    return 'unknown'
  }
}
