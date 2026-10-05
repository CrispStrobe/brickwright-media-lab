#!/usr/bin/env node
/**
 * Proof: PicoBB (BBC BASIC for the Pico) boots on bw-board's rp2040js machine
 * and runs programs over the RP2040 UART0 console.
 *
 * WHY NOT runMediaBundle(). The 6502/Z80 media projects boot through
 * bw-board's runMediaBundle(manifest, files). That path has no rp2040 machine
 * factory, and its entry/slot logic assumes an 8/16-bit core (`machine.cpu.pc
 * = … & 0xffff`, `machine.mem[0xfffc]`). The RP2040 is a 32-bit Cortex-M0+
 * reached through a different, equally-canonical bw-board surface: the
 * `createRp2040jsAdapter()` adapter (the one lite's
 * `scripts/probe-pico-micropython.mjs` drives, and bw-board's own
 * `test/pico-blink-full-chain.test.mjs`). This proof uses that adapter:
 * boot the UF2 from flash, capture UART0 TX via `adapter.onSerial`, and type
 * into the console via `rp2040.uart[0].feedByte`.
 *
 * SINGLE CORE. The adapter's `advanceNs` steps core0 only, so the firmware
 * must not launch core1 (the PicoBB config here is built SOUND=NONE for
 * exactly that reason — see README.md). A core1-launching build hangs in the
 * SIO inter-core FIFO handshake.
 *
 * Resolving the engine: set BW_INTEGRATED_ROOT to a tree that has both
 * node_modules/bw-board and node_modules/rp2040js (e.g. lite's
 * packages/scratch-gui), or BW_BOARD_DIR to a bw-board checkout that has
 * node_modules/rp2040js installed.
 *
 *   BW_INTEGRATED_ROOT=/path/to/lite/packages/scratch-gui \
 *     node projects/picobb-rp2040/proof.mjs
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const manifest = JSON.parse(readFileSync(join(here, 'brickwright-media.json'), 'utf8'));

const FLASH_BASE = 0x10000000;

/** Flatten a pico-sdk UF2 into one contiguous flash image (byte 0 @ FLASH_BASE). */
function parseUF2(uf2) {
  const view = new DataView(uf2.buffer, uf2.byteOffset, uf2.byteLength);
  const nblocks = Math.floor(uf2.length / 512);
  let base = null, image = new Uint8Array(0);
  for (let i = 0; i < nblocks; i++) {
    const o = i * 512;
    if (view.getUint32(o, true) !== 0x0a324655 || view.getUint32(o + 4, true) !== 0x9e5d5157)
      throw new Error(`UF2 block ${i} has bad magic`);
    const addr = view.getUint32(o + 12, true);
    const size = view.getUint32(o + 16, true);
    if (base === null) base = addr;
    const off = addr - base;
    if (off + size > image.length) { const g = new Uint8Array(off + size); g.set(image); image = g; }
    image.set(uf2.subarray(o + 32, o + 32 + size), off);
  }
  return { blocks: nblocks, base, image };
}

/** Find the bw-board rp2040js adapter + a resolvable rp2040js next to it. */
function resolveAdapterFile() {
  const candidates = [];
  if (process.env.BW_INTEGRATED_ROOT)
    candidates.push(join(process.env.BW_INTEGRATED_ROOT, 'node_modules/bw-board/src/rp2040js-adapter.js'));
  if (process.env.BW_BOARD_DIR)
    candidates.push(join(process.env.BW_BOARD_DIR, 'src/rp2040js-adapter.js'));
  // common sibling layouts
  candidates.push(join(here, '..', '..', '..', 'bw-board', 'src', 'rp2040js-adapter.js'));
  candidates.push(join(here, '..', '..', '..', 'brickwright-lite', 'packages', 'scratch-gui',
    'node_modules/bw-board/src/rp2040js-adapter.js'));
  for (const c of candidates) if (existsSync(c)) return c;
  throw new Error('no rp2040js-adapter.js found. Set BW_INTEGRATED_ROOT (a tree with ' +
    'node_modules/bw-board + node_modules/rp2040js) or BW_BOARD_DIR. Tried:\n  ' +
    candidates.join('\n  '));
}

const adapterFile = resolveAdapterFile();
const { createRp2040jsAdapter } = await import(pathToFileURL(adapterFile).href);

// Load the firmware named by the manifest's flash slot.
const fwName = manifest.slots.flash;
const uf2 = new Uint8Array(readFileSync(join(here, fwName)));
const { blocks, base, image } = parseUF2(uf2);
console.log(`UF2 ${fwName}: ${blocks} blocks, base=0x${base.toString(16)}, image=${image.length} bytes`);
if (base !== FLASH_BASE) throw new Error(`UF2 base 0x${base.toString(16)} != FLASH_BASE`);

const adapter = createRp2040jsAdapter();
const { rp2040 } = adapter;
let out = '';
adapter.onSerial(b => { out += String.fromCharCode(b); });
adapter.bootFromFlash(image);

const CHUNK_MS = 2, QUIET_MS = 24;
const feed = (s) => { for (const ch of s) rp2040.uart[0].feedByte(ch.charCodeAt(0)); };

// Emulate a VT100 terminal: PicoBB probes terminal size with ESC[6n (DSR) and
// waits for an ESC[row;colR reply. Answer every outstanding query (24x80).
let dsrAnswered = 0;
function serviceTerminal() {
  const n = (out.match(/\x1b\[6n/g) || []).length;
  while (dsrAnswered < n) { feed('\x1b[24;80R'); dsrAnswered++; }
}

/** Advance sim time, servicing DSR, until output goes quiet for QUIET_MS or maxMs elapses. */
function advance(maxMs, { stopOnQuiet = true } = {}) {
  let ms = 0, last = out.length, quiet = 0;
  while (ms < maxMs) {
    adapter.advanceNs(CHUNK_MS * 1e6); ms += CHUNK_MS;
    serviceTerminal();
    if (out.length !== last) { last = out.length; quiet = 0; }
    else if (stopOnQuiet && out.length > 0) { quiet += CHUNK_MS; if (quiet >= QUIET_MS) break; }
  }
  return ms;
}
function type(s) {
  for (const ch of s) { feed(ch); advance(ch === '\r' ? 500 : 80); }
}

// Boot to the "Waiting for connection" prompt, then press the start key (Enter)
// so the console starts, then let the banner + '>' prompt print.
advance(manifest.program?.bootMs || 400);
const startKey = manifest.program?.startKey ?? '\r';
if (startKey && out.includes('Waiting for connection')) {
  feed(startKey);
  // The connection-wait loop sleeps 1s between polls, so do NOT early-stop on
  // quiet: run the full window to let it wake, read the CR, and print the banner.
  advance(2400, { stopOnQuiet: false });
}

let bad = 0;
const check = (label, expects) => {
  for (const w of expects) {
    const ok = out.includes(w);
    if (!ok) bad++;
    console.log(`${ok ? 'ok  ' : 'FAIL'} [${label}] ${JSON.stringify(w)}`);
  }
};
check('boot', manifest.expect);

// Scripted interactive sessions (each resets by replaying from boot output;
// PicoBB is a live REPL, so we just keep typing into the same session).
for (const prog of manifest.programs || []) {
  const before = out.length;
  type(prog.input);
  const slice = out.slice(before);
  for (const w of prog.expect) {
    const ok = slice.includes(w) || out.includes(w);
    if (!ok) bad++;
    console.log(`${ok ? 'ok  ' : 'FAIL'} [${prog.title || 'program'}] ${JSON.stringify(w)}`);
  }
}

console.log('\n=== TRANSCRIPT (JSON) ===');
console.log(JSON.stringify(out));
console.log('\n=== TRANSCRIPT (readable) ===');
console.log(out);
console.log(bad
  ? `\n${bad} expectation(s) MISSING`
  : `\nPASS — PicoBB BBC BASIC is alive on rp2040js (${(adapter.timeNs() / 1000000n)} machine-ms).`);
process.exit(bad ? 1 : 0);
