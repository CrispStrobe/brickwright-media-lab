// SPDX-License-Identifier: MIT
import assert from 'node:assert/strict';
import {existsSync, readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const board = process.env.BW_BOARD_DIR || fileURLToPath(new URL('../../../bw-board/', import.meta.url));
const engine = resolve(board, 'src/kim1-machine.js');
const url = file => new URL(file, import.meta.url);
const files = ['spi.pap', 'spi.raw', 'corsham.pap', 'corsham.dsk', 'k1013.pap', 'k1013.imd'];
if (!existsSync(engine) || !files.every(file => existsSync(url(file)))) {
  console.log('SKIP: run fetch.sh and use a bw-board checkout with KIM-1 storage support');
  process.exit(2);
}
const {createKim1Machine, controlKim1Machine, stepKim1Machine} = await import(pathToFileURL(engine));
for (const [kind, imageFile, verb] of [['corsham', 'corsham.dsk', 'mountCorshamDisk'], ['k1013', 'k1013.imd', 'mountK1013'], ['spi', 'spi.raw', 'mountSD']]) {
  const machine = createKim1Machine('; KIM-1 expanded RAM\n0200: EA');
  controlKim1Machine(machine, 'useBrickwrightRom');
  const image = readFileSync(url(imageFile));
  if (!controlKim1Machine(machine, verb, kind === 'k1013' ? {drive: 0, image} : image)) {
    console.log('SKIP: pinned bw-board lacks the KIM-1 storage interfaces');
    process.exit(2);
  }
  controlKim1Machine(machine, 'loadProgram', readFileSync(url(kind + '.pap'), 'utf8'));
  controlKim1Machine(machine, 'setTty', {enabled: true, baud: 300});
  const run = (limit, stop) => {
    while (machine.cpu.cycles < limit && !machine.error && !stop.test(machine.ttyOutput)) stepKim1Machine(machine);
    assert.equal(machine.error, null);
  };
  run(800_000, /KIM>/);
  controlKim1Machine(machine, 'sendTty', '0200 G');
  run(23_000_000, /A>/);
  assert.match(machine.ttyOutput, /CP\/M-65 for the KIM-1[\s\S]*A>/, kind);
  console.log(`${kind}: CP/M-65 for the KIM-1 reached A> in ${machine.cpu.cycles} cycles`);
}
