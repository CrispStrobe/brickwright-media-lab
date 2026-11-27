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
    {input: 'let a=40\r'},
    {input: 'print "PICCOLO-PROOF ";a+2\r'},
    {input: 'end\rLIST\rRUN\r', expect: ['\r\nPICCOLO-PROOF 42\r\n>']},
    {input: 'NEW\rprint "unterminated\rRUN\r', expect: ['Unterminated string\r\n']},
    {input: 'NEW\rloop:\rgoto loop:\rRUN\r\x03', expect: ['\r\nStopped\r\n>']},
    {input: 'NEW\rprint 9*7\rRUN\r', expect: ['\r\n63\r\n>']}
];
// The shared proof runner consumes the original string-slot manifest shape.
const result = runRp2040Bundle({...manifest, slots: {flash: flash.file}, programs}, {[flash.file]: bytes});
assert.ok(result.ok, JSON.stringify({output: result.output, programs: result.programs}, null, 2));
console.log('PiccoloBASIC booted and accepted UART source, LIST, RUN, invalid source recovery, Stop and a new program.');
