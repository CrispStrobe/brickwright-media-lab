// SPDX-License-Identifier: MIT
import assert from 'node:assert/strict';
import {existsSync, readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const board = process.env.BW_BOARD_DIR || fileURLToPath(new URL('../../../bw-board/', import.meta.url));
const engine = resolve(board, 'src/kim1-machine.js');
if (!existsSync(resolve(board, 'src/kim1-expansion.js'))) {
  console.log('SKIP: pinned bw-board lacks KIM-1 expansion support');
  process.exit(2);
}
const {createKim1Machine, controlKim1Machine, stepKim1Machine, peekKim1Byte} = await import(pathToFileURL(engine));
const read = file => readFileSync(new URL(file, import.meta.url));
function exercise(tape, mount, value) {
  const machine = createKim1Machine();
  assert.equal(controlKim1Machine(machine, mount, value), true);
  controlKim1Machine(machine, 'loadProgram', read(tape).toString());
  controlKim1Machine(machine, 'run', 0x200);
  for (let i = 0; i < 100_000 && machine.running; i++) stepKim1Machine(machine, {singleStep: false});
  assert.equal(machine.error, null);
  assert.match(machine.lastStop, /^BRK/);
  return machine;
}
const ram = exercise('ram-check.ptp', 'setBackplane', [
  {kind: 'kim-2', address: 0x2000}, {kind: 'kim-3', address: 0x4000}, {kind: 'kim-3b', address: 0x6000}
]);
assert.equal(peekKim1Byte(ram, 0x300), 0x5a);
console.log('RAM check $0300 = $5A');
const video = exercise('video.ptp', 'setK1008', 0x2000);
for (let row = 0; row < 200; row++) {
  for (let column = 0; column < 40; column++) {
    assert.equal(peekKim1Byte(video, 0x2000 + row * 40 + column), (row + column) % 2 === 0 ? 255 : 0);
  }
}
console.log('K-1008 checkerboard');
