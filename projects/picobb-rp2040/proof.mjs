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
import { createHash } from 'node:crypto';
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
const expectedSha = manifest.components.find((component) => component.file === fwName)?.sha256;
if (!expectedSha || createHash('sha256').update(files[fwName]).digest('hex') !== expectedSha)
  throw new Error('selected flash fixture does not match its manifest SHA-256');

/**
 * Reuse the reviewed UF2 headers to transfer only flash to another machine.
 * prepare-filesystem.sh's -e merge covers the entire prefix through 0x70000:
 * firmware, padding, and the 128 KiB LittleFS store at 0x50000. Refuse gaps,
 * reordered/duplicate blocks or truncation rather than silently losing sectors.
 */
function flashSnapshotUf2(template, flash) {
  const flashBase = 0x10000000, prefixBytes = 0x70000, payloadBytes = 256;
  const blocks = prefixBytes / payloadBytes;
  if (!(flash instanceof Uint8Array) || flash.length < prefixBytes || template.length !== blocks * 512)
    throw new Error('flash snapshot requires the complete firmware and LittleFS prefix');
  const snapshot = new Uint8Array(template);
  const header = new DataView(snapshot.buffer);
  for (let i = 0; i < blocks; i++) {
    const offset = i * 512;
    if (header.getUint32(offset, true) !== 0x0a324655 ||
        header.getUint32(offset + 4, true) !== 0x9e5d5157 ||
        header.getUint32(offset + 508, true) !== 0x0ab16f30 ||
        header.getUint32(offset + 12, true) !== flashBase + i * payloadBytes ||
        header.getUint32(offset + 16, true) !== payloadBytes ||
        header.getUint32(offset + 20, true) !== i ||
        header.getUint32(offset + 24, true) !== blocks)
      throw new Error(`flash snapshot requires contiguous complete UF2 coverage (block ${i})`);
    snapshot.set(flash.subarray(i * payloadBytes, (i + 1) * payloadBytes), offset + 32);
  }
  return snapshot;
}

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
const visibleOutput = (output) => output.replace(/\x1b\[[\d;]*[A-Za-z]/g, '');
const markerPrinted = (output) => /[\r\n]PICO-DISK-ROUNDTRIP[\r\n]/.test(visibleOutput(output));
const filesystemMounted = (output) =>
  visibleOutput(output).includes('image v2.1, Size = 128KB, Origin = 0x10050000') &&
  !/Corrupted dir pair|Unable to locate LittleFS image|Unable to format littlefs/i.test(visibleOutput(output));
for (const [label, ok] of [
  ['filesystem mounts without diagnostics', filesystemMounted(r.output)],
  ['reloaded BASIC program actually ran', markerPrinted(r.output)]
]) report('LittleFS', [{text: label, ok}]);
for (const p of r.programs) report(p.title, p.expect);

// A new run creates a new SoC. Its only retained guest input is the saved flash
// prefix; neither these commands nor its RAM contain the program's source text.
const readbackManifest = {
  ...manifest,
  programs: [
    {title: 'load saved program on fresh machine', input: 'LOAD "FLASH"\r', expect: ['LOAD "FLASH"']},
    {title: 'run saved program on fresh machine', input: 'RUN\r', expect: ['RUN']}
  ]
};
const savedFlash = flashSnapshotUf2(files[fwName], r.adapter.rp2040.flash);
const fresh = runRp2040Bundle(readbackManifest, {[fwName]: savedFlash});
report('fresh boot', fresh.expect);
for (const p of fresh.programs) report(p.title, p.expect);
report('fresh-machine readback', [
  {text: 'new adapter, SoC and CPU instances', ok: fresh.adapter !== r.adapter &&
    fresh.adapter.rp2040 !== r.adapter.rp2040 && fresh.adapter.rp2040.core !== r.adapter.rp2040.core},
  {text: 'saved filesystem mounts without diagnostics', ok: filesystemMounted(fresh.output)},
  {text: 'retaining only flash recovers the saved program output', ok: markerPrinted(fresh.output)}
]);

// Same readback commands, but a clean formatted image has never seen SAVE.
// Requiring a normal boot as well as absence of the marker avoids a vacuous
// negative control in which the machine failed to reach its interpreter.
const clean = runRp2040Bundle(readbackManifest, files);
report('clean-image boot', clean.expect);
for (const p of clean.programs) report(`clean-image ${p.title}`, p.expect);
report('clean-image negative control', [
  {text: 'clean filesystem mounts without diagnostics', ok: filesystemMounted(clean.output)},
  {text: 'clean image reports that the saved file is absent', ok: visibleOutput(clean.output).includes('File or path not found')},
  {text: 'LOAD/RUN on original image does not print the saved marker', ok: !markerPrinted(clean.output)}
]);

for (const [label, result] of [['save and reload', r], ['fresh-machine readback', fresh], ['clean-image control', clean]]) {
  console.log(`\n=== ${label.toUpperCase()} TRANSCRIPT (JSON) ===`);
  console.log(JSON.stringify(result.output));
}
console.log(bad
  ? `\n${bad} expectation(s) MISSING`
  : `\nPASS — PicoBB saves and reloads on a fresh RP2040 retaining only flash; clean-image control passes ` +
    `(${r.machineMs}/${fresh.machineMs}/${clean.machineMs} machine-ms).`);
process.exit(bad ? 1 : 0);
