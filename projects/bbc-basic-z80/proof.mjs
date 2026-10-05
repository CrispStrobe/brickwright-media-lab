#!/usr/bin/env node
/**
 * Proof: R.T. Russell's BBC BASIC (Z80) boots on the bw-board Z80 machine and
 * runs programs over the CP/M BDOS console.
 *
 * Drives bw-board's canonical runMediaBundle(manifest, files) path: realizes
 * the `z80` machine, loads bbcbasic.com into the `com` slot (at 0x0100) and
 * sets the entry PC to 0x0100. BBC BASIC's generic CP/M edition does ALL its
 * console I/O through CP/M BDOS (CALL 5), so this installs the minimal BDOS
 * console shim on the machine's pcTraps — the mechanism bw-board's z80-machine
 * names as "the first tenant" of pcTraps, and whose surface is src/bbc-z80-
 * runner.js. Page zero gets the standard CP/M vectors (JP 0005 -> BDOS entry,
 * warm-boot HALT at 0x0000). Then it replays each scripted session in the
 * manifest's programs[] and checks the top-level boot expect[] and each
 * program's expect[] against the real console transcript.
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

// Realize the machine and load the .COM via the canonical media path.
const { machine, applied, errors } = await runMediaBundle(manifest, { [manifest.slots.com]: com }, {});
if (errors.length) { console.error('media errors:', errors); process.exit(2); }
console.log('applied slots:', applied, '| entry PC:', '0x' + machine.cpu.pc.toString(16));

// --- CP/M page zero + BDOS console shim (surface identical to bbc-z80-runner.js) ---
const BDOS = 0xfe00;
const mem = machine.mem, cpu = machine.cpu;
mem[0x0000] = 0x76;                                   // warm boot: HALT (checked by PC)
mem[0x0005] = 0xc3; mem[0x0006] = BDOS & 0xff; mem[0x0007] = BDOS >> 8; // JP BDOS
mem[BDOS] = 0xc9;                                     // RET (only if the trap misses)
cpu.sp = 0xfdff;

let out = '', prevCh = 10, tailPrompt = false, dryPolls = 0, exited = false;
const keys = [];
const emit = (ch) => {
    dryPolls = 0; out += String.fromCharCode(ch);
    tailPrompt = (ch === 0x3e && (prevCh === 10 || prevCh === 13)); // '>' at line start
    prevCh = ch;
};
const setA = (v) => { cpu.a = v & 0xff; cpu.l = v & 0xff; }; // returns land in A and L

machine.pcTraps.set(BDOS, () => {
    const ret = () => { cpu.pc = cpu._pop16(); };
    switch (cpu.c) {
        case 0: exited = true; return 4;                                  // exit
        case 1: if (!keys.length) { ret(); cpu.pc = 0x0005; return 4; } setA(keys.shift()); break; // conin
        case 2: emit(cpu.e); break;                                        // conout
        case 6:                                                            // direct console I/O
            if (cpu.e === 0xff) { if (keys.length) { setA(keys.shift()); dryPolls = 0; } else { setA(0); dryPolls++; } }
            else if (cpu.e === 0xfe) setA(keys.length ? 0xff : 0);
            else if (cpu.e === 0xfd) { if (!keys.length) { ret(); cpu.pc = 0x0005; return 4; } setA(keys.shift()); }
            else emit(cpu.e);
            break;
        case 9: { let a = cpu.de; for (let i = 0; i < 4096; i++) { const ch = mem[a]; if (ch === 0x24) break; emit(ch); a = (a + 1) & 0xffff; } break; } // $-string
        case 10: { const buf = cpu.de, max = mem[buf]; let c = 0; while (c < max) { if (!keys.length) { ret(); cpu.pc = 0x0005; return 4; } const ch = keys.shift(); if (ch === 13) break; mem[(buf + 2 + c) & 0xffff] = ch; emit(ch); c++; } mem[(buf + 1) & 0xffff] = c; emit(13); emit(10); break; } // readline
        case 11: setA(keys.length ? 0xff : 0); break;                      // console status
        case 12: cpu.hl = 0x0022; setA(0x22); break;                       // version
        default: setA(0); break;                                           // disk/misc stubs
    }
    ret();
    return 4;
});

const type = (s) => { for (const ch of s) keys.push(ch.charCodeAt(0)); };

let bad = 0;
const check = (label, expects) => {
    for (const w of expects) {
        const ok = out.includes(w);
        if (!ok) bad++;
        console.log(`${ok ? 'ok  ' : 'FAIL'} [${label}] ${JSON.stringify(w)}`);
    }
};

// Boot: run to the first ready prompt.
const toPrompt = (budget = 120_000_000) => {
    let n = 0; const from = out.length;
    while (n < budget) {
        if (out.indexOf('>') >= 0 && out.length > from) { if (!keys.length) break; }
        if (exited || cpu.pc === 0x0000) break;
        machine.step(); n++;
    }
};
toPrompt();
check('boot', manifest.expect);

// Scripted interactive sessions: feed PROMPT BY PROMPT (BBC BASIC flushes
// type-ahead after each Enter, so queuing a whole program at once loses lines).
const feedLine = (s, budget = 40_000_000) => {
    const from = out.length;
    type(s + '\r');
    let n = 0;
    while (n < budget) {
        if (out.indexOf('>', from + s.length) >= 0 && !keys.length) break;
        if (exited || cpu.pc === 0x0000) break;
        machine.step(); n++;
    }
};
for (const prog of manifest.programs || []) {
    for (const lineStr of prog.input.split('\r')) {
        if (lineStr === '') continue;
        feedLine(lineStr);
    }
    check(prog.title || 'program', prog.expect);
}

console.log('\n=== TRANSCRIPT ===');
console.log(JSON.stringify(out));
console.log(bad
    ? `\n${bad} expectation(s) MISSING`
    : `\nPASS — BBC BASIC (Z80) is alive on the bw-board z80 machine (${(cpu.cycles / 1e6).toFixed(1)}M Z80 cycles).`);
process.exit(bad ? 1 : 0);
