import { execFileSync } from 'node:child_process'
import { existsSync, rmSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

// A plain `tsc` build emits dist/cli.js at mode 644 — not executable. npm's own bin-links
// step re-chmods it on install/link regardless, so this was never a broken-publish risk,
// but running the built file directly (`./dist/cli.js`, or the e2e test's bin-symlink
// invocation) needs the executable bit set right after `build`, not just after install.
describe('build produces an installable bin', () => {
  it('dist/cli.js is executable after a fresh `pnpm build`', () => {
    const root = process.cwd()
    const cli = join(root, 'dist/cli.js')
    rmSync(join(root, 'dist'), { recursive: true, force: true })
    execFileSync('pnpm', ['run', 'build'], { cwd: root, stdio: 'pipe' })
    expect(existsSync(cli)).toBe(true)
    const mode = statSync(cli).mode
    expect(mode & 0o111).not.toBe(0)
  })
})
