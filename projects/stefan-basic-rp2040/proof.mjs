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
const programs = [
    {input: '10 LET A=40\r20 PRINT A+2\rLIST\rRUN\r', expect: ['\r\n42\r\n> ']},
    {input: 'NEW\r\n10 INPUT X\n20 PRINT X*2\rRUN\r21\r', expect: ['? 21\r\n42\r\n> ']},
    {input: 'NEW\r10 GOTO 10\rRUN\r\x03PRINT 9*7\r', expect: ['\r\n63\r\n> ']}
];
const result = runRp2040Bundle({...manifest, slots: {flash: flash.file}, programs}, {[flash.file]: bytes});
assert.ok(result.ok, JSON.stringify({output: result.output, programs: result.programs}, null, 2));
console.log('Stefan’s BASIC booted and ran a listing, accepted INPUT and interrupted a loop over UART.');
