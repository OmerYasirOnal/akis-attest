import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

export interface AttestConfig {
  version: 1
  project: string
  actor: string
  test: { command: string; timeoutMs?: number }
  bootSmoke?: { command: string; url: string; expectStatus?: number; timeoutMs?: number }
  artifacts?: string[]
  lang?: 'en' | 'tr'
}

export function attestDir(cwd: string): string {
  return join(cwd, '.attest')
}

function configPath(cwd: string): string {
  return join(attestDir(cwd), 'config.json')
}

export function loadConfig(cwd: string): AttestConfig {
  const path = configPath(cwd)
  if (!existsSync(path)) throw new Error('not initialized — run `attest init` first')
  return JSON.parse(readFileSync(path, 'utf8')) as AttestConfig
}

export function saveConfig(cwd: string, cfg: AttestConfig): void {
  mkdirSync(attestDir(cwd), { recursive: true })
  writeFileSync(configPath(cwd), JSON.stringify(cfg, null, 2) + '\n')
}
