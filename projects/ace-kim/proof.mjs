// SPDX-License-Identifier: MIT
import assert from 'node:assert/strict';
import {existsSync, readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

const board = process.env.BW_BOARD_DIR || new URL('../../../bw-board/', import.meta.url).pathname;
const engine = resolve(board, 'src/ace-kim-machine.js');
if (!existsSync(engine)) {
  console.log('SKIP: pinned bw-board lacks the ACE KIM machine');
  process.exit(2);
}

const {AceKimMachine} = await import(pathToFileURL(engine));
const read = file => readFileSync(new URL(file, import.meta.url));
const machine = new AceKimMachine({bios: read('bios.rom'), monitor: read('kc-monitor.rom')});
const lcd = () => machine.lcd.text.join(' ');
machine.run(1_300_000);
assert.match(lcd(), /ESC TO START/i);
console.log(lcd());
machine.pressKey(0x10);
machine.run(100_000);
assert.match(lcd(), /\$0800: \$00/);
console.log(lcd());
for (const code of [0x11, 0x05, 0x13]) {
  machine.pressKey(code);
  machine.run(100_000);
}
assert.equal(machine.ram[0x800], 0x5a);
console.log('$0800 = $5A');
