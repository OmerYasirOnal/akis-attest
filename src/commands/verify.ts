import { attestDir, loadConfig } from '../core/config.js'
import { headSha, isDirty } from '../core/git.js'
import { appendEvent } from '../core/ledger.js'
import { runBootSmoke, runTests, type BootSmokeResult } from '../core/testRun.js'

export async function runVerify(_argv: string[], cwd: string): Promise<number> {
  const cfg = loadConfig(cwd)
  console.log(`running: ${cfg.test.command}`)
  const result = runTests(cwd, cfg.test.command, cfg.test.timeoutMs)
  let bootSmoke: BootSmokeResult | undefined
  if (cfg.bootSmoke) {
    console.log(`boot-smoke: ${cfg.bootSmoke.command} → ${cfg.bootSmoke.url}`)
    bootSmoke = await runBootSmoke(cwd, cfg.bootSmoke)
  }
  const pass = result.pass && (bootSmoke?.pass ?? true)
  appendEvent(attestDir(cwd), {
    kind: 'verify',
    gitSha: headSha(cwd),
    dirty: isDirty(cwd),
    actor: cfg.actor,
    payload: { ...result, pass, ...(bootSmoke ? { bootSmoke } : {}) },
  })
  console.log(pass ? `verify PASS (${result.durationMs}ms)` : `verify FAIL (exit ${result.exitCode})`)
  return pass ? 0 : 1
}
