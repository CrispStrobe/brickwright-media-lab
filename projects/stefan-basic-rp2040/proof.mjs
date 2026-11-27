// SPDX-License-Identifier: BSD-3-Clause
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';

const manifest = JSON.parse(readFileSync(new URL('./brickwright-media.json', import.meta.url), 'utf8'));
const flash = manifest.slots.flash;
const bytes = readFileSync(new URL(flash.file, import.meta.url));
assert.equal(createHash('sha256').update(bytes).digest('hex'), flash.sha256);
const board = process.env.BW_BOARD_DIR ||
    (process.env.BW_INTEGRATED_ROOT && join(process.env.BW_INTEGRATED_ROOT, 'node_modules/bw-board'));
assert.ok(board, 'Set BW_BOARD_DIR or BW_INTEGRATED_ROOT to the Brickwright emulator.');
const {runRp2040Bundle} = await import(pathToFileURL(join(board, 'src/machine-media-rp2040.js')));
const {createRp2040jsAdapter} = await import(pathToFileURL(join(board, 'src/rp2040js-adapter.js')));
const {parseUF2} = await import(pathToFileURL(join(board, 'src/uf2.js')));
const programs = [
    {input: '10 LET A=40\r20 PRINT A+2\rLIST\rRUN\r', expect: ['\r\n42\r\n> ']},
    {input: 'NEW\r\n10 INPUT X\n20 PRINT X*2\rRUN\r21\r', expect: ['? 21\r\n42\r\n> ']},
    {input: 'NEW\r10 GOTO 10\rRUN\r\x03PRINT 9*7\r', expect: ['\r\n63\r\n> ']},
    {input: 'NEW\r10 PRINT "STEFAN-STORED"\rSAVE "proof.bas"\rCATALOG\r', expect: ['\r\nproof.bas ']},
    {input: 'NEW\rLOAD "proof.bas"\rRUN\r', expect: ['\r\nSTEFAN-STORED\r\n> ']}
];
const result = runRp2040Bundle({...manifest, slots: {flash: flash.file}, programs}, {[flash.file]: bytes});
assert.ok(result.ok, JSON.stringify({output: result.output, programs: result.programs}, null, 2));
function bootFlash (image) {
    const adapter = createRp2040jsAdapter();
    const uart = adapter.rp2040.uart[0];
    let transcript = '';
    adapter.onSerial(byte => { transcript += String.fromCharCode(byte); });
    adapter.bootFromFlash(image);
    adapter.advanceNs(1_500_000_000);
    return {adapter, type (text) {
        for (const ch of text) {
            uart.feedByte(ch.charCodeAt(0));
            adapter.advanceNs(4_000_000);
        }
        adapter.advanceNs(100_000_000);
        return transcript;
    }};
}

const rebooted = bootFlash(result.adapter.rp2040.flash);
assert.match(rebooted.type('LOAD "proof.bas"\rRUN\r'), /\r\nSTEFAN-STORED\r\n> /);

const broken = new Uint8Array(manifest.program.flashStorage.offset + manifest.program.flashStorage.length);
broken.fill(0xff);
broken.set(parseUF2(bytes).image);
const marker = broken.length - 16;
broken[marker] = 0x42;
const unmounted = bootFlash(broken);
assert.match(unmounted.type('PRINT USR(16,1)\r'), /\r\n0\r\n> /);
assert.equal(unmounted.adapter.rp2040.flash[marker], 0x42);
console.log('Stefan’s BASIC passed UART execution, INPUT, interruption, named-file save/load, cold reboot and the nonblank flash check.');
