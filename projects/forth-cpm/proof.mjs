#!/usr/bin/env node
/**
 * Proof: zForth, recompiled for a NON-DOS target (a Z80 CP/M 2.2 .COM), boots
 * on the bw-board Z80 machine and runs an embedded Forth program to completion
 * over the CP/M BDOS console. This is the direct sibling of projects/forth-dos
 * (the same interpreter on the 8086 DOS bench) — it demonstrates the Code-tab
 * Forth language is target-portable: only the run backend is machine-specific.
 *
 * Drives bw-board's canonical runMediaBundle(manifest, files) path to realize
 * the z80 machine, loads the `com` slot at 0x0100, and installs the same
 * minimal BDOS console shim on pcTraps that projects/cpm-software uses. The
 * .COM is non-interactive (it prints via BDOS function 2 and returns to the
 * warm-boot vector), so this runs to that exit and checks expect[].
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
const com = new Uint8Array(readFileSync(join(here, manifest.slots.com)));
const { runMediaBundle } = await import(join(bwBoard, 'src', 'machine-media.js'));

const { machine, applied, errors } = await runMediaBundle(manifest, { [manifest.slots.com]: com }, {});
if (errors.length) { console.error('media errors:', errors); process.exit(2); }
console.log('applied slots:', applied, '| entry PC:', '0x' + machine.cpu.pc.toString(16));

// --- CP/M page zero + BDOS console shim (identical to cpm-software/proof.mjs) ---
const BDOS = 0xfe00;
const mem = machine.mem, cpu = machine.cpu;
mem[0x0000] = 0x76;                                   // warm boot: HALT (checked by PC)
mem[0x0005] = 0xc3; mem[0x0006] = BDOS & 0xff; mem[0x0007] = BDOS >> 8; // JP BDOS
mem[BDOS] = 0xc9;                                     // RET (only if the trap misses)
cpu.sp = 0xfdff;

let out = '', exited = false;
const emit = (ch) => { out += String.fromCharCode(ch); };
const setA = (v) => { cpu.a = v & 0xff; cpu.l = v & 0xff; };

machine.pcTraps.set(BDOS, () => {
    const ret = () => { cpu.pc = cpu._pop16(); };
    switch (cpu.c) {
        case 0: exited = true; return 4;
        case 2: emit(cpu.e); break;
        case 6: if (cpu.e !== 0xff && cpu.e !== 0xfe && cpu.e !== 0xfd) emit(cpu.e); else setA(0); break;
        case 9: { let a = cpu.de; for (let i = 0; i < 4096; i++) { const ch = mem[a]; if (ch === 0x24) break; emit(ch); a = (a + 1) & 0xffff; } break; }
        case 11: setA(0); break;
        case 12: cpu.hl = 0x0022; setA(0x22); break;
        default: setA(0); break;
    }
    ret();
    return 4;
});

let n = 0; const budget = 120_000_000;
while (n < budget && !exited && cpu.pc !== 0x0000) { machine.step(); n++; }

let bad = 0;
for (const w of manifest.expect) {
    const ok = out.includes(w);
    if (!ok) bad++;
    console.log(`${ok ? 'ok  ' : 'FAIL'} ${JSON.stringify(w)}`);
}

console.log('\n=== TRANSCRIPT ===');
console.log(JSON.stringify(out));
console.log(bad
    ? `\n${bad} expectation(s) MISSING`
    : `\nPASS — zForth CP/M .COM (${manifest.slots.com}) ran on the bw-board z80 machine (${(cpu.cycles / 1e6).toFixed(1)}M Z80 cycles).`);
process.exit(bad ? 1 : 0);
