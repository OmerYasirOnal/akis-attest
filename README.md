# akis-attest

Ship AI-built work with proof: human-approved gates, really-run tests, a signed attestation, one shareable link.

## Why

Clients don't trust AI-built deliveries — they can't see what a human actually approved or whether anything was really tested. `akis-attest` records what was approved, what really ran, and signs it into a tamper-evident ledger. The proof is one static HTML file you can host anywhere and hand to anyone.

## Requirements

- Node.js >= 22
- git (attest binds every proof to a git commit)
- Zero runtime dependencies.

## Install

Not yet published to npm. Install from a source checkout:

```bash
pnpm install
pnpm build
npm link          # exposes the `attest` command
```

The examples below use `attest`. Without `npm link`, run `node dist/cli.js <command>` instead.

## Quickstart

Run inside your project's git repo, with your work committed:

```bash
attest init --project my-app --test-command "npm test"
attest approve plan -m "Scope: dashboard with CSV export"
attest verify
attest approve delivery -m "Delivered; client demo passed"
attest export
attest check proof.html
```

That produces `proof.html` — a single self-verifying file. Open it in a browser to see the gates, the test run, and the signer fingerprint; the page re-checks its own signature and ledger client-side. Anyone can re-run `attest check proof.html` offline to confirm it.

## Commands

| Command | What it does |
| --- | --- |
| `attest init [--project X] [--actor "Name <email>"] [--test-command CMD]` | Create `.attest/`, generate a signing key if needed, record the first ledger event. |
| `attest approve <plan\|delivery> -m "message"` | Record an approval gate. `delivery` is fail-closed: it requires a clean tree and a passing `verify` for the current commit. |
| `attest verify` | Really run the recorded test command and record its exit code, parsed result, and environment. |
| `attest export [--draft] [--out proof.html]` | Build, sign, and write the proof page. Without the gates complete it fails closed; `--draft` writes an unsigned, watermarked page. |
| `attest check [path]` | Verify the chain, signature, and root — offline. Pass a `proof.html`, or run inside an attested repo with no argument. |

## What the proof means

Every proof page carries an honesty box. It states plainly what a valid signature does and does not establish.

**What this proves — and what it does not**

This proves:

- This ledger was produced by the holder of the key whose fingerprint is shown above, and has not been modified since signing.
- The recorded test command really ran and exited with the recorded result.
- Each approval was recorded at the stated time against the stated git commit.

It does not prove:

- That the key holder is who they claim to be — compare the fingerprint through a channel you trust.
- That the tests are meaningful or complete.
- Any third-party or independent endorsement (v1 signatures are self-issued).

## Threat model in one paragraph

In v1 the signature is self-issued: the tool mints an Ed25519 key on first use and signs with it, so a valid signature only means "the holder of this key produced this proof" — you must compare the key fingerprint out-of-band (through a channel you already trust) to tie it to a person. The hash-chained ledger and the signed root detect tampering after signing — edit any recorded event and `attest check` fails — but they cannot vouch for intent, for the quality of the tests, or for who the signer really is. Note that "dirty" deliberately excludes attest's own `.attest/` directory: the append-only ledger changes every time attest records a step, so counting it would make every repo read as dirty; dirtiness is about your code, not the tool's bookkeeping. The planned v1.1 adds an independent root — Sigstore / CI countersigning — so a proof can be anchored to something other than the signer's own word.

## Signing key

The private key lives at `~/.config/akis-attest/key.pem` (override the directory with `AKIS_ATTEST_HOME`). Back it up: lose it and you can no longer produce attestations under the same fingerprint, so a client comparing fingerprints will not recognize new proofs. The key never leaves your machine and is not embedded in the proof — only its public key and fingerprint are.

## Development

```bash
pnpm install      # install dev dependencies
pnpm test         # unit + integration (vitest)
pnpm e2e          # builds first, then browser E2E (Playwright)
pnpm build        # compile to dist/
```

`pnpm typecheck` runs `tsc --noEmit`. CI runs typecheck, tests, E2E, and build on every push and pull request.

## License

Apache-2.0
