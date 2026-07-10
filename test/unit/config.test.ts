import { describe, expect, it } from 'vitest'
import { attestDir, loadConfig, saveConfig, type AttestConfig } from '../../src/core/config.js'
import { tmpDir } from '../helpers.js'

describe('config', () => {
  it('round-trips config and errors when missing', () => {
    const cwd = tmpDir()
    expect(() => loadConfig(cwd)).toThrow(/attest init/)
    const cfg: AttestConfig = { version: 1, project: 'demo', actor: 'A <a@x>', test: { command: 'npm test' } }
    saveConfig(cwd, cfg)
    expect(loadConfig(cwd)).toEqual(cfg)
    expect(attestDir(cwd).endsWith('.attest')).toBe(true)
  })
})
