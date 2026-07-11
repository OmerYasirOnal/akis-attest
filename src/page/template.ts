import type { DsseEnvelope } from '../core/dsse.js'
import type { LedgerEvent } from '../core/ledger.js'
import { STRINGS } from './i18n.js'

export interface ProofBundle {
  schema: 'akis-attest/proof-bundle/v1'
  project: string
  lang: 'en' | 'tr'
  generatedAt: string
  draft: boolean
  envelope: DsseEnvelope | null
  ledger: LedgerEvent[]
}

export function renderProofPage(bundle: ProofBundle): string {
  const json = JSON.stringify(bundle).replaceAll('<', '\\u003c')
  const i18nJson = JSON.stringify(STRINGS).replaceAll('<', '\\u003c')
  return `<!doctype html>
<html lang="${bundle.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>akis-attest — ${escapeHtml(bundle.project)}</title>
<style>
:root { color-scheme: light dark; --ok:#1a7f37; --fail:#b91c1c; --warn:#b45309; --muted:#6b7280; }
body { font: 16px/1.55 system-ui, sans-serif; max-width: 760px; margin: 2rem auto; padding: 0 1rem; }
.badge { padding: .6rem 1rem; border-radius: .5rem; font-weight: 600; }
body[data-verify-state="ok"] .badge { background: color-mix(in srgb, var(--ok) 12%, transparent); color: var(--ok); }
body[data-verify-state="fail"] .badge { background: color-mix(in srgb, var(--fail) 12%, transparent); color: var(--fail); }
body[data-verify-state="unsupported"] .badge, body[data-verify-state="draft"] .badge { background: color-mix(in srgb, var(--warn) 12%, transparent); color: var(--warn); }
.draft-banner { position: sticky; top: 0; background: var(--warn); color: white; text-align: center; padding: .4rem; font-weight: 700; }
table { border-collapse: collapse; width: 100%; } td, th { text-align: left; padding: .3rem .6rem 0; vertical-align: top; }
code, .mono { font-family: ui-monospace, monospace; font-size: .85em; word-break: break-all; }
.box { border: 1px solid var(--muted); border-radius: .5rem; padding: .8rem 1rem; margin: 1rem 0; }
.muted { color: var(--muted); } button { cursor: pointer; }
</style>
</head>
<body data-verify-state="${bundle.draft ? 'draft' : 'pending'}">
${bundle.draft ? '<div class="draft-banner" data-i18n="draft"></div>' : ''}
<header>
  <button id="lang-toggle">EN / TR</button>
  <h1>${escapeHtml(bundle.project)} — <span data-i18n="title"></span></h1>
  <p class="badge" id="badge" data-i18n="verifying"></p>
</header>
<main>
  <section><h2 data-i18n="gates"></h2><div id="gates"></div></section>
  <section><h2 data-i18n="tests"></h2><div id="tests"></div></section>
  <section><h2 data-i18n="fingerprint"></h2>
    <p class="mono" id="fingerprint"></p><p class="muted" data-i18n="fingerprintNote"></p></section>
  <section class="box"><h2 data-i18n="honestyTitle"></h2>
    <ul><li data-i18n="proves1"></li><li data-i18n="proves2"></li><li data-i18n="proves3"></li></ul>
    <ul class="muted"><li data-i18n="not1"></li><li data-i18n="not2"></li><li data-i18n="not3"></li></ul></section>
  <section><h2 data-i18n="checkTitle"></h2><p data-i18n="checkBody"></p>
    <pre><code>npx akis-attest check proof.html</code></pre></section>
</main>
<script id="attest-bundle" type="application/json">${json}</script>
<script id="attest-i18n" type="application/json">${i18nJson}</script>
<script>
const bundle = JSON.parse(document.getElementById('attest-bundle').textContent)
const STRINGS = JSON.parse(document.getElementById('attest-i18n').textContent)
let lang = bundle.lang
function applyI18n() {
  document.documentElement.lang = lang
  for (const el of document.querySelectorAll('[data-i18n]')) el.textContent = STRINGS[el.dataset.i18n][lang]
  const badge = document.getElementById('badge')
  const state = document.body.dataset.verifyState
  const key = { ok: 'verified', fail: 'failed', unsupported: 'unsupported', draft: 'draft', pending: 'verifying' }[state]
  badge.dataset.i18n = key
  badge.textContent = STRINGS[key][lang]
}
document.getElementById('lang-toggle').addEventListener('click', () => { lang = lang === 'en' ? 'tr' : 'en'; applyI18n() })

const b64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0))
function canonicalJson(v) {
  if (v === null || typeof v === 'number' || typeof v === 'boolean' || typeof v === 'string') return JSON.stringify(v)
  if (Array.isArray(v)) return '[' + v.map(canonicalJson).join(',') + ']'
  return '{' + Object.keys(v).sort().map((k) => JSON.stringify(k) + ':' + canonicalJson(v[k])).join(',') + '}'
}
async function sha256Hex(text) {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, '0')).join('')
}
function pae(type, payload) {
  const t = new TextEncoder().encode(type)
  const h = new TextEncoder().encode('DSSEv1 ' + t.length + ' ' + type + ' ' + payload.length + ' ')
  const out = new Uint8Array(h.length + payload.length); out.set(h); out.set(payload, h.length); return out
}
async function verifyChain(events) {
  let prev = '0'.repeat(64)
  for (const e of events) {
    const { hash, ...rest } = e
    if (e.prevHash !== prev) return false
    if (await sha256Hex(canonicalJson(rest)) !== hash) return false
    prev = hash
  }
  return true
}
async function verifyAll() {
  if (bundle.draft) { document.body.dataset.verifyState = 'draft'; applyI18n(); render(); return }
  try {
    const sig = bundle.envelope.signatures[0]
    const keyBytes = b64(sig.publicKeySpki)
    let key
    try {
      // Feature-detect FIRST: only a failed Ed25519 import of the real embedded key
      // means the browser is too old. Everything after a successful import is tamper.
      key = await crypto.subtle.importKey('spki', keyBytes, { name: 'Ed25519' }, false, ['verify'])
    } catch (e) {
      document.body.dataset.verifyState = 'unsupported'
      applyI18n()
      return
    }
    const payload = b64(bundle.envelope.payload)
    const sigOk = await crypto.subtle.verify('Ed25519', key, b64(sig.sig), pae(bundle.envelope.payloadType, payload))
    const statement = JSON.parse(new TextDecoder().decode(payload))
    const chainOk = await verifyChain(bundle.ledger)
    const rootOk = bundle.ledger.length > 0 && statement.predicate.ledger.root === bundle.ledger[bundle.ledger.length - 1].hash
    document.body.dataset.verifyState = sigOk && chainOk && rootOk ? 'ok' : 'fail'
    document.getElementById('fingerprint').textContent = sig.keyid
    render(statement)
  } catch (e) {
    // The key imported (or the bundle structure itself is broken): any exception here
    // is a bad proof, not an old browser.
    document.body.dataset.verifyState = 'fail'
  }
  applyI18n()
}
function render(statement) {
  const gates = document.getElementById('gates')
  const rows = []
  for (const e of bundle.ledger) {
    if (e.kind === 'approve_plan') rows.push([STRINGS.gatePlan[lang], e.ts, e.actor, e.payload.message ?? ''])
    if (e.kind === 'verify') rows.push([STRINGS.gateVerify[lang], e.ts, e.actor, e.payload.pass ? 'PASS' : 'FAIL'])
    if (e.kind === 'approve_delivery') rows.push([STRINGS.gateDelivery[lang], e.ts, e.actor, e.payload.message ?? ''])
  }
  gates.innerHTML = '<table>' + rows.map((r) => '<tr>' + r.map((c) => '<td>' + String(c).replace(/</g, '&lt;') + '</td>').join('') + '</tr>').join('') + '</table>'
  if (statement) {
    const v = statement.predicate.gates.verify
    document.getElementById('tests').innerHTML =
      '<p><code>' + String(v.command).replace(/</g, '&lt;') + '</code> — ' +
      (v.tests === 'unparsed' ? 'exit ' + v.exitCode : v.tests.passed + ' passed, ' + v.tests.failed + ' failed') +
      ' (' + v.durationMs + 'ms, node ' + v.env.node + ', ' + v.env.platform + ')</p>'
  }
}
applyI18n(); verifyAll()
</script>
</body>
</html>
`
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
