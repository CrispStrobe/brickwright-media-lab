// SPDX-License-Identifier: MIT
import {readFileSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';

const hex = byte => byte.toString(16).padStart(2, '0').toUpperCase();
function tape(file) {
  const program = readFileSync(join(process.argv[2], file + '.bin'));
  let lines = [];
  const record = (address, data) => {
    const bytes = [data.length, address >> 8, address & 255, ...data];
    const sum = bytes.reduce((total, byte) => total + byte, 0);
    return ';' + [...bytes, sum >> 8, sum & 255].map(hex).join('');
  };
  for (let i = 0; i < program.length; i += 24) lines.push(record(0x200 + i, program.subarray(i, i + 24)));
  lines.push(record(lines.length, []));
  writeFileSync(file + '.ptp', lines.join('\n') + '\n');
}
tape('ram-check');
tape('video');

const map = Buffer.alloc(131072);
for (let address = 0; address <= 0xffff; address++) {
  const ram = (address >= 0x400 && address < 0x1700) || (address >= 0x2000 && address < 0xfffa);
  map[address * 2 + 1] = ram ? 2 : 1;
}
writeFileSync('expanded-ram.raw', map);

const image = Buffer.alloc(2048);
for (let offset = 0; offset < image.length; offset++) image[offset] = (83 + Math.floor(offset / 512) * 19 + offset * 37) & 255;
writeFileSync('sectors.img', image);
