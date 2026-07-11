#!/usr/bin/env node
import { realpathSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { runApprove } from './commands/approve.js'
import { runCheck } from './commands/check.js'
import { runExport } from './commands/export.js'
import { runInit } from './commands/init.js'
import { runVerify } from './commands/verify.js'

const USAGE = `attest — ship AI-built work with proof

Usage:
  attest init [--project X] [--actor "Name <email>"] [--test-command CMD]
  attest approve <plan|delivery> -m "message"
  attest verify
  attest export [--draft] [--out proof.html]
  attest check [path]
`

export async function main(argv: string[]): Promise<number> {
  const [command, ...rest] = argv
  switch (command) {
    case 'init':
      return runInit(rest, process.cwd())
    case 'approve':
      return runApprove(rest, process.cwd())
    case 'verify':
      return runVerify(rest, process.cwd())
    case 'export':
      return runExport(rest, process.cwd())
    case 'check':
      return runCheck(rest, process.cwd())
    default:
      console.error(USAGE)
      return 2
  }
}

// npm installs the bin as a SYMLINK named `attest` (node_modules/.bin/attest), so a
// name-based argv[1] check silently no-ops there. Compare real paths instead: argv[1]
// resolved through symlinks must be this very module.
const entry = process.argv[1]
let invokedDirectly = false
if (entry !== undefined) {
  try {
    invokedDirectly = realpathSync(entry) === fileURLToPath(import.meta.url)
  } catch {
    invokedDirectly = false
  }
}
if (invokedDirectly) {
  main(process.argv.slice(2))
    .then((code) => process.exit(code))
    .catch((err: unknown) => {
      console.error(`error: ${err instanceof Error ? err.message : String(err)}`)
      process.exit(1)
    })
}
