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
    {input: 'let a=40\r'},
    {input: 'print "PICCOLO-PROOF ";a+2\r'},
    {input: 'end\rLIST\rRUN\r', expect: ['\r\nPICCOLO-PROOF 42\r\n>']},
    {input: 'NEW\rprint "unterminated\rRUN\r', expect: ['Unterminated string\r\n']},
    {input: 'NEW\rloop:\rgoto loop:\rRUN\r\x03', expect: ['\r\nStopped\r\n>']},
    {input: 'NEW\rprint 9*7\rRUN\r', expect: ['\r\n63\r\n>']},
    {input: 'SAVE "proof.bas"\r', expect: ['\r\nSaved proof.bas\r\n>']},
    {input: 'NEW\rprint "PICCOLO-STORED"\rSAVE "proof.bas"\rFILES\r',
        expect: ['\r\nSaved proof.bas\r\n>', '\r\nproof.bas\r\n>']},
    {input: 'NEW\rLOAD "proof.bas"\rLOAD "missing.bas"\rRUN\r',
        expect: ['\r\nLoaded proof.bas\r\n>', '\r\nCould not open file\r\n>', '\r\nPICCOLO-STORED\r\n>']}
];
// The shared proof runner consumes the original string-slot manifest shape.
const result = runRp2040Bundle({...manifest, slots: {flash: flash.file}, programs}, {[flash.file]: bytes});
assert.ok(result.ok, JSON.stringify({output: result.output, programs: result.programs}, null, 2));
const {offset, length} = manifest.program.flashStorage;
const {image} = parseUF2(bytes);
assert.ok(image.length <= offset, 'executable flash ends before LittleFS');
function boot (flashImage) {
    const adapter = createRp2040jsAdapter();
    const uart = adapter.rp2040.uart[0];
    let output = '';
    adapter.onSerial(byte => { output += String.fromCharCode(byte); });
    adapter.bootFromFlash(flashImage);
    adapter.advanceNs(200_000_000);
    return {adapter, type (script) {
        for (const char of script) {
            uart.feedByte(char.charCodeAt(0));
            adapter.advanceNs(4_000_000);
        }
        adapter.advanceNs(100_000_000);
        return output;
    }};
}
const rebooted = boot(result.adapter.rp2040.flash);
assert.match(rebooted.type('LOAD "proof.bas"\rRUN\r'), /\r\nPICCOLO-STORED\r\n>/);

const corrupted = new Uint8Array(offset + length).fill(0xff);
corrupted.set(image);
corrupted[offset + 50] = 0x42;
const broken = boot(corrupted);
assert.match(broken.type('FILES\r'), /LittleFS could not mount/);
assert.deepEqual(broken.adapter.rp2040.flash.subarray(offset, offset + length), corrupted.subarray(offset));
console.log('PiccoloBASIC passed UART execution, errors, interruption, named-file overwrite, failed-load recovery, cold boot and corrupt-flash preservation.');
