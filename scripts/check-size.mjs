// Fails when the JavaScript the page loads up front grows past its budget.
// Run after `vite build`. Chunks loaded later with import() (Tone, the
// chords-db shapes, the modals) aren't counted.
//
// When a budget is hit on purpose, raise it here in the same change and
// say why in the commit.

import { readFileSync } from "node:fs"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import { gzipSync } from "node:zlib"

// in kB of 1000 bytes, as vite reports them. about 10 kB over the sizes
// when they were set (297 kB entry, 164 kB gzipped): enough to catch the
// chord shapes, Tone, the export or config modal, or the modals together
// landing back in the first load, though not one of the small modals
const BUDGET = {
  // the main app chunk on its own
  entryKb: 310,
  // every script index.html loads or preloads, gzipped
  initialGzipKb: 175,
}

const dist = fileURLToPath(new URL("../dist/", import.meta.url))
const html = readFileSync(join(dist, "index.html"), "utf8")

// the page's own scripts: its entry module and the chunks it preloads
const scripts = [...html.matchAll(/(?:src|href)="\/?(assets\/[^"]+\.js)"/g)].map((match) => match[1])
const entry = html.match(/<script[^>]+src="\/?(assets\/[^"]+\.js)"/)?.[1]

if (!entry || !scripts.length) {
  console.error("check-size: no scripts found in dist/index.html; run the build first")
  process.exit(1)
}

const kb = (bytes) => bytes / 1000
let initialGzip = 0
let entryRaw = 0

for (const script of scripts) {
  const code = readFileSync(join(dist, script))
  const gzip = gzipSync(code, { level: 9 }).length
  initialGzip += gzip
  if (script === entry) entryRaw = code.length
  console.log(`${script.padEnd(40)} ${kb(code.length).toFixed(1).padStart(8)} kB  gzip ${kb(gzip).toFixed(1).padStart(7)} kB`)
}

const failures = []
if (kb(entryRaw) > BUDGET.entryKb) {
  failures.push(`entry chunk is ${kb(entryRaw).toFixed(1)} kB, over its ${BUDGET.entryKb} kB budget`)
}
if (kb(initialGzip) > BUDGET.initialGzipKb) {
  failures.push(`initial scripts are ${kb(initialGzip).toFixed(1)} kB gzipped, over their ${BUDGET.initialGzipKb} kB budget`)
}

console.log(`\nentry ${kb(entryRaw).toFixed(1)} / ${BUDGET.entryKb} kB, initial gzip ${kb(initialGzip).toFixed(1)} / ${BUDGET.initialGzipKb} kB`)

if (failures.length) {
  failures.forEach((failure) => console.error(`check-size: ${failure}`))
  process.exit(1)
}
