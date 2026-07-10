import { spawn, spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { platform } from 'node:os'
import { sha256Hex } from './encoding.js'
import type { AttestConfig } from './config.js'

export interface TestRunResult {
  command: string
  exitCode: number
  durationMs: number
  pass: boolean
  tests: { passed: number; failed: number } | 'unparsed'
  outputDigest: string
  env: { node: string; platform: string; lockfileSha256: string | null }
}

function lockfileSha256(cwd: string): string | null {
  for (const name of ['pnpm-lock.yaml', 'package-lock.json', 'yarn.lock']) {
    const path = join(cwd, name)
    if (existsSync(path)) return sha256Hex(readFileSync(path))
  }
  return null
}

function parseSummary(output: string): TestRunResult['tests'] {
  const passed = /(\d+)\s+passed/.exec(output)
  if (!passed) return 'unparsed'
  const failed = /(\d+)\s+failed/.exec(output)
  return { passed: Number(passed[1]), failed: failed ? Number(failed[1]) : 0 }
}

export function runTests(cwd: string, command: string, timeoutMs = 600_000): TestRunResult {
  const started = Date.now()
  const res = spawnSync(command, { cwd, shell: true, encoding: 'utf8', timeout: timeoutMs })
  const output = `${res.stdout ?? ''}${res.stderr ?? ''}`
  const exitCode = res.status ?? -1
  return {
    command,
    exitCode,
    durationMs: Date.now() - started,
    pass: exitCode === 0,
    tests: parseSummary(output),
    outputDigest: sha256Hex(output),
    env: { node: process.version, platform: `${platform()}`, lockfileSha256: lockfileSha256(cwd) },
  }
}

export interface BootSmokeResult {
  command: string
  url: string
  status: number | null
  pass: boolean
  durationMs: number
}

export async function runBootSmoke(
  cwd: string,
  cfg: NonNullable<AttestConfig['bootSmoke']>,
): Promise<BootSmokeResult> {
  const started = Date.now()
  const expect = cfg.expectStatus ?? 200
  const deadline = started + (cfg.timeoutMs ?? 30_000)
  const child = spawn(cfg.command, { cwd, shell: true, detached: true, stdio: 'ignore' })
  let status: number | null = null
  try {
    while (Date.now() < deadline) {
      try {
        const res = await fetch(cfg.url)
        status = res.status
        if (status === expect) break
      } catch {
        /* server not up yet */
      }
      await new Promise((r) => setTimeout(r, 250))
    }
  } finally {
    if (child.pid !== undefined) {
      try {
        process.kill(-child.pid, 'SIGTERM')
      } catch {
        /* already gone */
      }
    }
  }
  return { command: cfg.command, url: cfg.url, status, pass: status === expect, durationMs: Date.now() - started }
}
