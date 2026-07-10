import { describe, expect, it } from 'vitest'
import { runApprove } from '../../src/commands/approve.js'
import { runInit } from '../../src/commands/init.js'
import { attestDir } from '../../src/core/config.js'
import { readLedger } from '../../src/core/ledger.js'
import { fixtureRepo, tmpDir } from '../helpers.js'

describe('attest approve plan', () => {
  it('records an approve_plan event with the message', () => {
    process.env.AKIS_ATTEST_HOME = tmpDir()
    const repo = fixtureRepo()
    runInit([], repo)
    expect(runApprove(['plan', '-m', 'Build the contact form'], repo)).toBe(0)
    const events = readLedger(attestDir(repo))
    expect(events[1]!.kind).toBe('approve_plan')
    expect(events[1]!.payload).toEqual({ message: 'Build the contact form' })
  })
  it('requires -m and a known gate', () => {
    process.env.AKIS_ATTEST_HOME = tmpDir()
    const repo = fixtureRepo()
    runInit([], repo)
    expect(runApprove(['plan'], repo)).toBe(1)
    expect(runApprove(['nope', '-m', 'x'], repo)).toBe(1)
  })
})
