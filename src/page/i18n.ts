export type Lang = 'en' | 'tr'

export const STRINGS: Record<string, { en: string; tr: string }> = {
  title: { en: 'Delivery proof', tr: 'Teslimat kanıtı' },
  verifying: { en: 'Verifying in your browser…', tr: 'Tarayıcınızda doğrulanıyor…' },
  verified: { en: 'Signature and ledger verified in your browser', tr: 'İmza ve defter tarayıcınızda doğrulandı' },
  failed: { en: 'VERIFICATION FAILED — do not trust this page', tr: 'DOĞRULAMA BAŞARISIZ — bu sayfaya güvenmeyin' },
  unsupported: { en: 'Your browser cannot verify Ed25519 — use the CLI check below', tr: 'Tarayıcınız Ed25519 doğrulayamıyor — aşağıdaki CLI kontrolünü kullanın' },
  draft: { en: 'DRAFT — GATES INCOMPLETE, UNSIGNED', tr: 'TASLAK — KAPILAR TAMAMLANMADI, İMZASIZ' },
  gates: { en: 'Approval gates', tr: 'Onay kapıları' },
  gatePlan: { en: 'Plan approved', tr: 'Plan onaylandı' },
  gateVerify: { en: 'Tests really ran', tr: 'Testler gerçekten koştu' },
  gateDelivery: { en: 'Delivery approved', tr: 'Teslimat onaylandı' },
  tests: { en: 'Test run', tr: 'Test koşumu' },
  env: { en: 'Environment', tr: 'Ortam' },
  fingerprint: { en: 'Signer key fingerprint', tr: 'İmzacı anahtar parmak izi' },
  fingerprintNote: {
    en: 'Compare this fingerprint with the one your contractor gave you through another channel.',
    tr: 'Bu parmak izini, yükleniciden başka bir kanaldan aldığınız parmak iziyle karşılaştırın.',
  },
  honestyTitle: { en: 'What this proves — and what it does not', tr: 'Bu neyi kanıtlar — neyi kanıtlamaz' },
  proves1: { en: 'This ledger was produced by the holder of the key whose fingerprint is shown above, and has not been modified since signing.', tr: 'Bu defter, yukarıdaki parmak izine sahip anahtarın sahibince üretildi ve imzadan sonra değiştirilmedi.' },
  proves2: { en: 'The recorded test command really ran and exited with the recorded result.', tr: 'Kayıtlı test komutu gerçekten çalıştı ve kayıtlı sonuçla tamamlandı.' },
  proves3: { en: 'Each approval was recorded at the stated time against the stated git commit.', tr: 'Her onay, belirtilen zamanda ve belirtilen git commit\'ine karşı kaydedildi.' },
  not1: { en: 'That the key holder is who they claim to be — compare the fingerprint through a channel you trust.', tr: 'Anahtar sahibinin iddia ettiği kişi olduğunu — parmak izini güvendiğiniz bir kanaldan karşılaştırın.' },
  not2: { en: 'That the tests are meaningful or complete.', tr: 'Testlerin anlamlı veya eksiksiz olduğunu.' },
  not3: { en: 'Any third-party or independent endorsement (v1 signatures are self-issued).', tr: 'Herhangi bir üçüncü taraf veya bağımsız onayı (v1 imzaları öz-imzalıdır).' },
  checkTitle: { en: 'Verify independently', tr: 'Bağımsız doğrulayın' },
  checkBody: { en: 'Skeptical? Run this against this very file:', tr: 'Şüpheci misiniz? Bu komutu bu dosyanın kendisi üzerinde çalıştırın:' },
}

export function catalogFor(lang: Lang): Record<string, string> {
  return Object.fromEntries(Object.entries(STRINGS).map(([k, v]) => [k, v[lang]]))
}
