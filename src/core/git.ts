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
  return git(cwd, 'status', '--porcelain') !== ''
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
