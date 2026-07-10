import { parseArgs } from 'node:util'
import { attestDir, loadConfig } from '../core/config.js'
import { headSha, isDirty } from '../core/git.js'
import { appendEvent } from '../core/ledger.js'

export function runApprove(argv: string[], cwd: string): number {
  const { values, positionals } = parseArgs({
    args: argv,
    options: { message: { type: 'string', short: 'm' } },
    allowPositionals: true,
  })
  const gate = positionals[0]
  if (gate !== 'plan' && gate !== 'delivery') {
    console.error('error: unknown gate — use `attest approve plan` or `attest approve delivery`')
    return 1
  }
  if (values.message === undefined || values.message.trim() === '') {
    console.error('error: -m "message" is required (what are you approving?)')
    return 1
  }
  const cfg = loadConfig(cwd)
  if (gate === 'plan') {
    const event = appendEvent(attestDir(cwd), {
      kind: 'approve_plan',
      gitSha: headSha(cwd),
      dirty: isDirty(cwd),
      actor: cfg.actor,
      payload: { message: values.message },
    })
    console.log(`plan approved (seq ${event.seq}) — "${values.message}"`)
    return 0
  }
  console.error('error: delivery gate not implemented yet')
  return 1
}
