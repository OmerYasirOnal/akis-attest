import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { parseArgs } from 'node:util'
import { writeAttestation } from '../core/attestation.js'
import { attestDir, loadConfig } from '../core/config.js'
import { readLedger } from '../core/ledger.js'
import { renderProofPage, type ProofBundle } from '../page/template.js'

export function runExport(argv: string[], cwd: string): number {
  const { values } = parseArgs({
    args: argv,
    options: { draft: { type: 'boolean', default: false }, out: { type: 'string', default: 'proof.html' } },
  })
  const cfg = loadConfig(cwd)
  let envelope: ProofBundle['envelope'] = null
  if (!values.draft) {
    try {
      envelope = writeAttestation(cwd).envelope
    } catch (e) {
      console.error(`error: ${(e as Error).message} — complete the gates or use --draft`)
      return 1
    }
  }
  const bundle: ProofBundle = {
    schema: 'akis-attest/proof-bundle/v1',
    project: cfg.project,
    lang: cfg.lang ?? 'en',
    generatedAt: new Date().toISOString(),
    draft: values.draft === true,
    envelope,
    ledger: readLedger(attestDir(cwd)),
  }
  const outPath = join(cwd, values.out ?? 'proof.html')
  writeFileSync(outPath, renderProofPage(bundle))
  console.log(`${values.draft ? 'DRAFT proof' : 'proof'} written to ${outPath}`)
  return 0
}
