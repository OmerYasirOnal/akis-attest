import { describe, expect, it } from 'vitest'
import { runTests } from '../../src/core/testRun.js'
import { fixtureRepo } from '../helpers.js'

describe('runTests', () => {
  it('captures a passing run and parses a vitest-style summary', () => {
    const repo = fixtureRepo()
    const res = runTests(repo, 'echo "Tests  3 passed (3)"')
    expect(res.pass).toBe(true)
    expect(res.exitCode).toBe(0)
    expect(res.tests).toEqual({ passed: 3, failed: 0 })
    expect(res.outputDigest).toMatch(/^[0-9a-f]{64}$/)
    expect(res.env.node).toBe(process.version)
  })
  it('captures a failing run', () => {
    const res = runTests(fixtureRepo(), 'exit 1')
    expect(res.pass).toBe(false)
    expect(res.exitCode).toBe(1)
  })
  it('marks unparsable output as unparsed', () => {
    const res = runTests(fixtureRepo(), 'echo "all good"')
    expect(res.tests).toBe('unparsed')
    expect(res.pass).toBe(true)
  })
})
