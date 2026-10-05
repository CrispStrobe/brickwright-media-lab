#!/usr/bin/env node
/**
 * Proof: PicoBB (BBC BASIC for the Pico) boots on bw-board's rp2040js machine
 * and runs programs over the RP2040 UART0 console.
 *
 * This bundle boots through bw-board's CANONICAL rp2040 media-bundle runner,
 * `runRp2040Bundle` (src/machine-media-rp2040.js) — the same shape of runner the
 * 6502/Z80 projects use (`runMediaBundle`) and the i8086 projects use
 * (`runI8086FloppyBundle`). The runner owns the RP2040 boot/console dance:
 * flatten the UF2, boot it from flash on `createRp2040jsAdapter()`, capture
 * UART0 TX, answer the console's VT100 DSR size probes, and type into the REPL.
 * This proof just supplies the manifest + firmware and checks the transcript, so
 * the boot logic lives in ONE place instead of being copied per consumer.
 *
 * SINGLE CORE. The adapter steps core0 only, so the firmware must not launch
 * core1 (the PicoBB config here is built SOUND=NONE for exactly that reason —
 * see README.md). A core1-launching build hangs in the SIO inter-core FIFO
 * handshake.
 *
 * Resolving the engine: set BW_INTEGRATED_ROOT to a tree that has both
 * node_modules/bw-board and node_modules/rp2040js (e.g. lite's
 * packages/scratch-gui), or BW_BOARD_DIR to a bw-board checkout (with
 * node_modules/rp2040js installed) that has the rp2040 media-bundle runner.
 *
 *   BW_INTEGRATED_ROOT=/path/to/lite/packages/scratch-gui \
 *     node projects/picobb-rp2040/proof.mjs
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const manifest = JSON.parse(readFileSync(join(here, 'brickwright-media.json'), 'utf8'));

/** Find bw-board's rp2040 media-bundle runner (its sibling rp2040js resolves next to it). */
function resolveRunnerFile() {
  const candidates = [];
  if (process.env.BW_INTEGRATED_ROOT)
    candidates.push(join(process.env.BW_INTEGRATED_ROOT, 'node_modules/bw-board/src/machine-media-rp2040.js'));
  if (process.env.BW_BOARD_DIR)
    candidates.push(join(process.env.BW_BOARD_DIR, 'src/machine-media-rp2040.js'));
  // common sibling layouts
  candidates.push(join(here, '..', '..', '..', 'bw-board', 'src', 'machine-media-rp2040.js'));
  candidates.push(join(here, '..', '..', '..', 'brickwright-lite', 'packages', 'scratch-gui',
    'node_modules/bw-board/src/machine-media-rp2040.js'));
  for (const c of candidates) if (existsSync(c)) return c;
  throw new Error('no machine-media-rp2040.js found (needs a bw-board with the rp2040 media-bundle ' +
    'runner). Set BW_INTEGRATED_ROOT (a tree with node_modules/bw-board + node_modules/rp2040js) ' +
    'or BW_BOARD_DIR. Tried:\n  ' + candidates.join('\n  '));
}

const { runRp2040Bundle } = await import(pathToFileURL(resolveRunnerFile()).href);

// Load the firmware named by the manifest's flash slot.
const fwName = manifest.slots.flash;
const files = { [fwName]: new Uint8Array(readFileSync(join(here, fwName))) };

// One call: boot the bundle and run its scripted REPL sessions.
const r = runRp2040Bundle(manifest, files);

let bad = 0;
const report = (label, checks) => {
  for (const e of checks) {
    if (!e.ok) bad++;
    console.log(`${e.ok ? 'ok  ' : 'FAIL'} [${label}] ${JSON.stringify(e.text)}`);
  }
};
report('boot', r.expect);
for (const p of r.programs) report(p.title, p.expect);

console.log('\n=== TRANSCRIPT (JSON) ===');
console.log(JSON.stringify(r.output));
console.log('\n=== TRANSCRIPT (readable) ===');
console.log(r.output);
console.log(bad
  ? `\n${bad} expectation(s) MISSING`
  : `\nPASS — PicoBB BBC BASIC is alive on rp2040js (${r.machineMs} machine-ms).`);
process.exit(bad ? 1 : 0);
