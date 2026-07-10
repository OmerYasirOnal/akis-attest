#!/usr/bin/env node
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

const invokedDirectly = process.argv[1]?.endsWith('cli.js') || process.argv[1]?.endsWith('cli.ts')
if (invokedDirectly) {
  main(process.argv.slice(2)).then((code) => process.exit(code))
}
