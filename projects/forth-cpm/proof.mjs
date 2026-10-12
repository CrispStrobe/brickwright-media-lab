#!/usr/bin/env node
/**
 * Proof: zForth, recompiled for a NON-DOS target (a Z80 CP/M 2.2 .COM), boots
 * on the bw-board Z80 machine and runs an ARBITRARY Forth program read from a
 * mounted CP/M file PROG.FTH (over BDOS open/read-sequential) to completion —
 * the sibling of projects/forth-dos (the same interpreter reading PROG.FTH on
 * the 8086 DOS bench). It demonstrates the Code-tab Forth language is
 * target-portable: only the run backend is machine-specific.
 *
 * Drives bw-board's runMediaBundle to realize the z80 machine, loads the `com`
 * slot at 0x0100, and installs a minimal BDOS shim on pcTraps that serves the
 * console (fn 2/9) AND a read-only file mounted from manifest.mount (fn 15 open,
 * 26 set DMA, 20 read sequential, 16 close). Checks the console expect[].
 *
 * Requires a bw-board checkout. BW_BOARD_DIR=/path/to/bw-board node proof.mjs
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

// Mounted read-only disk from manifest.mount, keyed by CP/M "NAME.EXT".
const disk = new Map();
for (const [dosName, hostRel] of Object.entries(manifest.mount || {})) {
    disk.set(dosName.toUpperCase(), new Uint8Array(readFileSync(join(here, hostRel))));
}

const BDOS = 0xfe00;
const mem = machine.mem, cpu = machine.cpu;
mem[0x0000] = 0x76;
mem[0x0005] = 0xc3; mem[0x0006] = BDOS & 0xff; mem[0x0007] = BDOS >> 8;
mem[BDOS] = 0xc9;
cpu.sp = 0xfdff;

let out = '', exited = false, dma = 0x0080, open = null;
const emit = (ch) => { out += String.fromCharCode(ch); };
const setA = (v) => { cpu.a = v & 0xff; cpu.l = v & 0xff; };
// FCB at DE: byte0 drive, bytes1..8 name, 9..11 ext → "NAME.EXT".
const fcbName = (de) => {
    let n = ''; for (let i = 1; i <= 8; i++) { const c = mem[(de + i) & 0xffff]; if (c !== 0x20) n += String.fromCharCode(c); }
    let e = ''; for (let i = 9; i <= 11; i++) { const c = mem[(de + i) & 0xffff]; if (c !== 0x20) e += String.fromCharCode(c); }
    return e ? `${n}.${e}` : n;
};

machine.pcTraps.set(BDOS, () => {
    const ret = () => { cpu.pc = cpu._pop16(); };
    switch (cpu.c) {
        case 0: exited = true; return 4;                                   // exit
        case 2: emit(cpu.e); break;                                        // conout
        case 9: { let a = cpu.de; for (let i = 0; i < 4096; i++) { const ch = mem[a]; if (ch === 0x24) break; emit(ch); a = (a + 1) & 0xffff; } break; }
        case 11: setA(0); break;                                           // console status
        case 12: cpu.hl = 0x0022; setA(0x22); break;                       // version
        case 13: open = null; setA(0); break;                              // reset disk
        case 15: {                                                         // open file
            const f = disk.get(fcbName(cpu.de).toUpperCase());
            if (f) { open = { data: f, off: 0 }; setA(0); } else setA(0xff);
            break;
        }
        case 16: open = null; setA(0); break;                              // close file
        case 20: {                                                         // read sequential
            if (!open || open.off >= open.data.length) { setA(1); break; } // EOF
            for (let i = 0; i < 128; i++) {
                const a = (dma + i) & 0xffff;
                mem[a] = open.off + i < open.data.length ? open.data[open.off + i] : 0x1a; // pad with ^Z
            }
            open.off += 128;
            setA(0);
            break;
        }
        case 26: dma = cpu.de & 0xffff; break;                             // set DMA
        default: setA(0); break;
    }
    ret();
    return 4;
});

let n = 0; const budget = 200_000_000;
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
    : `\nPASS — zForth CP/M .COM read a mounted PROG.FTH and ran it on the bw-board z80 machine (${(cpu.cycles / 1e6).toFixed(1)}M Z80 cycles).`);
process.exit(bad ? 1 : 0);
