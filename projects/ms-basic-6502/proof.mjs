#!/usr/bin/env node
/**
 * Proof: Microsoft BASIC V1.1 boots on the bw-board eater6502 machine and
 * runs programs over the W65C51 ACIA console.
 *
 * Drives bw-board's canonical runMediaBundle(manifest, files) path: realizes
 * the eater6502 machine, loads basic.rom into the `rom` slot, boots it, and
 * replays each scripted ACIA session in the manifest's programs[] (its `input`
 * is typed into the ACIA RX; its `expect` strings must appear in the serial
 * output). Also checks the top-level boot `expect` (banner / OK prompt).
 *
 * Requires a bw-board checkout. Point BW_BOARD_DIR at it (defaults to a sibling
 * ../bw-board).  Usage:  BW_BOARD_DIR=/path/to/bw-board node proof.mjs
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const bwBoard = process.env.BW_BOARD_DIR || join(here, '..', '..', '..', 'bw-board');
const manifest = JSON.parse(readFileSync(join(here, 'brickwright-media.json'), 'utf8'));
const rom = new Uint8Array(readFileSync(join(here, 'basic.rom')));
const { runMediaBundle } = await import(join(bwBoard, 'src', 'machine-media.js'));

let out = '';
const { machine, applied, errors } = await runMediaBundle(
  manifest,
  { 'basic.rom': rom },
  { hooks: { onSerial: (b) => { out += String.fromCharCode(b); } } },
);
if (errors.length) { console.error('media errors:', errors); process.exit(2); }
console.log('applied slots:', applied);

const type = (s) => {
  for (const ch of s) {
    machine.chips[manifest.program.console].rxPush(ch.charCodeAt(0));
    machine.advanceToMs(machine.tMs + (ch === '\r' ? 500 : 30));
  }
};

machine.advanceToMs(500); // boot: MEMORY SIZE? prompt appears

let bad = 0;
const check = (label, expects) => {
  for (const w of expects) {
    const ok = out.includes(w);
    if (!ok) bad++;
    console.log(`${ok ? 'ok  ' : 'FAIL'} [${label}] ${JSON.stringify(w)}`);
  }
};

// Boot banner (answer the two prompts with defaults so the banner prints).
type('\r');
machine.advanceToMs(machine.tMs + 2000);
type('\r');
machine.advanceToMs(machine.tMs + 2000);
check('boot', manifest.expect);

// Scripted interactive sessions.
for (const prog of manifest.programs || []) {
  type(prog.input);
  machine.advanceToMs(machine.tMs + 3000);
  check(prog.title || 'program', prog.expect);
}

console.log('\n=== TRANSCRIPT ===');
console.log(JSON.stringify(out));
console.log(bad
  ? `\n${bad} expectation(s) MISSING`
  : `\nPASS — Microsoft BASIC V1.1 is alive on eater6502 (${(machine.tMs / 1000).toFixed(1)} machine-seconds).`);
process.exit(bad ? 1 : 0);
