import { existsSync } from 'node:fs'
import { basename, join } from 'node:path'
import { parseArgs } from 'node:util'
import { attestDir, saveConfig, type AttestConfig } from '../core/config.js'
import { gitUser, headSha, isDirty, isGitRepo } from '../core/git.js'
import { ensureKeyPair } from '../core/keys.js'
import { appendEvent } from '../core/ledger.js'

export function runInit(argv: string[], cwd: string): number {
  const { values } = parseArgs({
    args: argv,
    options: {
      project: { type: 'string' },
      actor: { type: 'string' },
      'test-command': { type: 'string' },
    },
  })
  if (!isGitRepo(cwd)) {
    console.error('error: not a git repo — attest binds proofs to git commits, run `git init` first')
    return 1
  }
  if (existsSync(join(attestDir(cwd), 'config.json'))) {
    console.error('error: already initialized (.attest/config.json exists)')
    return 1
  }
  const cfg: AttestConfig = {
    version: 1,
    project: values.project ?? basename(cwd),
    actor: values.actor ?? gitUser(cwd),
    test: { command: values['test-command'] ?? 'npm test' },
  }
  saveConfig(cwd, cfg)
  const kp = ensureKeyPair()
  appendEvent(attestDir(cwd), {
    kind: 'init',
    gitSha: headSha(cwd),
    dirty: isDirty(cwd),
    actor: cfg.actor,
    payload: { keyFingerprint: kp.fingerprint, project: cfg.project },
  })
  console.log(`initialized .attest for "${cfg.project}" (key ${kp.fingerprint.slice(0, 16)}…)`)
  return 0
}
