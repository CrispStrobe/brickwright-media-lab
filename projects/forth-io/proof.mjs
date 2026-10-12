#!/usr/bin/env node
/**
 * Proof: a Code-tab-shaped Forth program DRIVES THE MACHINE'S I/O from inside
 * the interpreter. FORTH-IO.EXE is the DOS-native Forth with two extra words —
 * `pin! ( pin value -- )` (an 8086 OUT to BW_GPIO_BASE+pin) and `pin@` (an IN).
 * The bw-board 8086 bench fires machine.hooks.onPortAccess on every OUT, so a
 * generated word reaches a device register. This boots FORTH-IO.EXE on the real
 * bench, mounts the program as PROG.FTH, captures the OUTs to the GPIO port
 * range, and checks both the console expect[] and the expected pin writes
 * (manifest.gpio). It is the working realization of the device-bridge design
 * (docs/CODE-TAB-LANGUAGE-DEVICE-BRIDGE.md in brickwright-lite).
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
const exe = new Uint8Array(readFileSync(join(here, manifest.slots.exe)));
const [progName, progHost] = Object.entries(manifest.mount)[0];
const prog = new Uint8Array(readFileSync(join(here, progHost)));

const { I8086Machine } = await import(join(bwBoard, 'src', 'i8086-machine.js'));
const { createDos8086, DOSBOX8086_XT } = await import(join(bwBoard, 'src', 'i8086-dos.js'));

const BASE = manifest.gpioBase ?? 0x378;   // 8-pin GPIO strip, ports BASE..BASE+7
const machine = new I8086Machine({ ...DOSBOX8086_XT, variant: manifest.program.variant || '80186' });
const gpio = [];
machine.hooks = machine.hooks || {};
machine.hooks.onPortAccess = (e) => {
    if (e.dir === 'out' && e.port >= BASE && e.port <= BASE + 7) gpio.push({ pin: e.port - BASE, value: e.value });
};

let screen = '';
const dos = createDos8086(machine, {
    onChar: (ch) => { screen += ch; },
    keys: [],
    files: new Map([[progName, prog]]),
}).install();
dos.loadExe(exe, { args: '' });
const result = dos.run(manifest.program.max || 200_000_000);

let bad = 0;
const check = (ok, label) => { if (!ok) bad++; console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}`); };
check(result.terminated, 'interpreter terminated');
for (const w of manifest.expect || []) check(screen.includes(w), `console has ${JSON.stringify(w)}`);
for (const want of manifest.gpio || []) {
    const got = gpio.find((g) => g.pin === want.pin && g.value === want.value);
    check(!!got, `pin ${want.pin} driven to ${want.value}`);
}

console.log('\n=== CONSOLE ===');
console.log(JSON.stringify(screen));
console.log('=== GPIO OUTs captured ===');
console.log(JSON.stringify(gpio));
console.log(bad
    ? `\n${bad} expectation(s) MISSING`
    : `\nPASS — a Forth program drove ${gpio.length} GPIO pin writes on the bw-board 8086 bench.`);
process.exit(bad ? 1 : 0);
