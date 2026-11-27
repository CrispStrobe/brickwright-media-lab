#!/usr/bin/env node
// SPDX-License-Identifier: MIT
// Source -> encoder -> assembler -> actual guest writes -> independent geometry.
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { buildAnimation, here, sha256 } from './build.mjs';
import { encodeAnimation } from './encode.mjs';

const args = process.argv.slice(2);
let outputDir = join(here, '.build', 'proof');
if (args.length) {
  assert.equal(args[0], '--out', 'usage: node proof.mjs [--out directory]');
  assert.equal(args.length, 2, 'usage: node proof.mjs [--out directory]');
  outputDir = resolve(args[1]);
}
mkdirSync(outputDir, { recursive: true });
const boardDir = process.env.BW_BOARD_DIR || join(here, '..', '..', '..', 'bw-board');
const { runMediaBundle } = await import(pathToFileURL(join(boardDir, 'src', 'machine-media.js')).href);
const manifest = JSON.parse(readFileSync(join(here, 'brickwright-media.json'), 'utf8'));
const starterRom = readFileSync(join(here, 'animation.rom'));
assert.equal(sha256(starterRom), manifest.components[0].sha256, 'bundled ROM must match its manifest');
const rebuilt = buildAnimation();
assert.deepEqual(rebuilt.rom, starterRom, 'starter ROM must rebuild byte-for-byte');

// Independent of the JSON sprite rasterizer: this is the geometric definition
// of the authored fixture (Manhattan radius 5, center y=31). We compare the
// entire 8192-byte bus-snooped framebuffer, including every row's hidden padding.
function expectedFrame(index, edited = false) {
  const centerX = [15, 37 + (edited ? 3 : 0), 59, 81][index];
  const expected = new Uint8Array(8192);
  for (let y = 0; y < 64; y++) {
    for (let x = 0; x < 100; x++) {
      if (Math.abs(x - centerX) + Math.abs(y - 31) <= 5) expected[y * 128 + x] = 63;
    }
  }
  return expected;
}

async function capture(label, rom, bundleManifest, count, edited) {
  const { machine, applied, errors } = await runMediaBundle(bundleManifest, { 'animation.rom': rom });
  assert.deepEqual(errors, [], `${label}: canonical media path must load cleanly`);
  assert.deepEqual(applied, ['rom']);
  assert.equal(machine.cpu.pc, 0x8000, `${label}: boot through the ROM reset vector`);
  const snapshots = [];
  for (let sequence = 1; sequence <= count; sequence++) {
    let steps = 0;
    const cyclesBefore = machine.cycles;
    while (machine.mem[0x0200] !== sequence) {
      assert.ok(steps++ < 200000, `${label}: frame ${sequence} exceeded 200000 instructions`);
      assert.ok(machine.step() > 0, `${label}: CPU stopped before completing frame ${sequence}`);
    }
    const index = (sequence - 1) % 4;
    assert.equal(machine.mem[0x0201], index, `${label}: guest frame order`);
    const pixels = machine.chips.vga.getFrame().slice();
    assert.deepEqual(pixels, expectedFrame(index, edited), `${label}: complete actual guest frame ${index}`);
    assert.deepEqual(machine.mem.subarray(0x2000, 0x4000), pixels, `${label}: snooped pixels equal shared RAM`);
    assert.equal(machine.chips.vga.frame, 8192 + sequence * 6400,
      `${label}: guest cleared the entire window, then wrote exactly 6400 visible pixels per frame`);
    const snapshot = {
      sequence, frameIndex: index, instructionsSincePreviousFrame: steps,
      guestCyclesSincePreviousFrame: machine.cycles - cyclesBefore,
      framebufferSha256: sha256(pixels), pixels,
    };
    snapshots.push(snapshot);
    console.log(`PASS ${label} frame=${index} serial=${sequence} steps=${steps} sha256=${snapshot.framebufferSha256}`);
  }
  return snapshots;
}

const baseline = await capture('starter', starterRom, manifest, 8, false);
const source = JSON.parse(readFileSync(join(here, 'src', 'animation.json'), 'utf8'));
const edited = structuredClone(source);
edited.frames[1].x += 3;
const editedPath = join(outputDir, 'edited-animation.json');
writeFileSync(editedPath, JSON.stringify(edited, null, 2) + '\n');
const changed = buildAnimation({ sourcePath: editedPath, outputDir: join(outputDir, 'edited-bundle') });
assert.notDeepEqual(changed.rom, starterRom, 'changing source must change the ROM');
const editedFrames = await capture('edited', changed.rom, changed.manifest, 4, true);
for (let index = 0; index < 4; index++) {
  if (index === 1) {
    assert.notDeepEqual(editedFrames[index].pixels, baseline[index].pixels, 'the edited frame must visibly change');
  } else {
    assert.deepEqual(editedFrames[index].pixels, baseline[index].pixels, 'unedited frames must stay identical');
  }
}

// Reset means a fresh machine and original ROM, not host writes that repaint it.
const resetFrames = await capture('fresh-reset', starterRom, manifest, 4, false);
for (let index = 0; index < 4; index++) {
  assert.deepEqual(resetFrames[index].pixels, baseline[index].pixels, 'fresh reset must reproduce original pixels');
}

// Input errors are rejected before assembling or writing any ROM.
for (const alter of [
  value => { value.frames[0].x = 100; },
  value => { value.frames.push({ x: 0, y: 0 }); },
  value => { value.sprite[0] = '?'.repeat(11); },
  value => { value.holdLoops = 0; },
  value => { value.width = 128; },
]) {
  const invalid = structuredClone(source);
  alter(invalid);
  assert.throws(() => encodeAnimation(invalid));
}

// Export observations captured from the guest, never the encoder's source buffer.
// This SVG is an exact black/white view of the 100 visible bytes of each row.
let svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 440 190" width="1320" height="570">\n';
svg += '<rect width="440" height="190" fill="#18202c"/>\n';
svg += '<g font-family="sans-serif" font-size="6" fill="white">';
for (const [row, frames] of [[0, baseline.slice(0, 4)], [1, editedFrames]]) {
  svg += `<text x="5" y="${row * 92 + 10}">${row ? 'Edited source: second frame moves 3 pixels right' : 'Original: actual 6502 guest framebuffer'}</text>`;
  frames.forEach((snapshot, index) => {
    const left = 5 + index * 110;
    const top = 17 + row * 92;
    svg += `<rect x="${left}" y="${top}" width="100" height="64" fill="black"/>`;
    for (let y = 0; y < 64; y++) {
      for (let x = 0; x < 100; x++) {
        if (snapshot.pixels[y * 128 + x]) svg += `<rect x="${left + x}" y="${top + y}" width="1" height="1" fill="white"/>`;
      }
    }
    svg += `<text x="${left}" y="${top + 72}">Frame ${index}</text>`;
  });
}
svg += '</g></svg>\n';
writeFileSync(join(outputDir, 'guest-frames.svg'), svg);
const summarize = frames => frames.map(({ pixels, ...entry }) => entry);
const report = {
  format: 'brickwright-animation-proof-v1',
  runner: 'bw-board runMediaBundle / M6502Machine.step',
  scope: 'CLI, ROM-resident raw monochrome frames; no SD, guest keyboard, compression, or guest file persistence',
  originalRomSha256: sha256(starterRom),
  editedRomSha256: sha256(changed.rom),
  original: summarize(baseline), edited: summarize(editedFrames), freshReset: summarize(resetFrames),
  sourceMutation: 'frames[1].x += 3',
  passed: true,
};
writeFileSync(join(outputDir, 'proof-report.json'), JSON.stringify(report, null, 2) + '\n');
console.log(`PASS: source -> ROM -> guest framebuffer; 2 loops, one edited frame, fresh reset, invalid-input checks.`);
console.log(`Actual frame preview: ${join(outputDir, 'guest-frames.svg')}`);
