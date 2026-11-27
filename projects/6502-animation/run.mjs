#!/usr/bin/env node
// SPDX-License-Identifier: MIT
// Execute the actual guest and export complete-frame observations for viewing.
import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { here, sha256 } from './build.mjs';

const args = process.argv.slice(2);
let bundle = here;
let outputDir = join(here, '.build', 'playback');
let count;
while (args.length) {
  const arg = args.shift();
  const value = args.shift();
  if (!['--bundle', '--out', '--frames'].includes(arg) || !value || value.startsWith('--')) {
    throw new Error('usage: node run.mjs [--bundle directory] [--out directory] [--frames 1..16]');
  }
  if (arg === '--bundle') bundle = resolve(value);
  if (arg === '--out') outputDir = resolve(value);
  if (arg === '--frames') count = Number(value);
}
const manifest = JSON.parse(readFileSync(join(bundle, 'brickwright-media.json'), 'utf8'));
assert.equal(manifest.machine, 'eater6502', 'this runner is for the 6502 animation bundle');
assert.equal(manifest.slots.rom, 'animation.rom');
count ??= manifest.observation.frameCount;
assert.ok(Number.isInteger(count) && count >= 1 && count <= 16, 'capture 1 to 16 frames');
const rom = readFileSync(join(bundle, 'animation.rom'));
assert.equal(sha256(rom), manifest.components[0].sha256, 'ROM hash must match its bundle manifest');
const boardDir = process.env.BW_BOARD_DIR || join(here, '..', '..', '..', 'bw-board');
const { runMediaBundle } = await import(pathToFileURL(join(boardDir, 'src', 'machine-media.js')).href);
const { machine, errors } = await runMediaBundle(manifest, { 'animation.rom': rom });
assert.deepEqual(errors, [], 'canonical media load');
mkdirSync(outputDir, { recursive: true });
const frames = [];
for (let sequence = 1; sequence <= count; sequence++) {
  let steps = 0;
  const cyclesBefore = machine.cycles;
  while (machine.mem[0x0200] !== sequence) {
    assert.ok(steps++ < 200000, `frame ${sequence} exceeded its instruction budget`);
    assert.ok(machine.step() > 0, 'guest stopped before frame completion');
  }
  const pixels = machine.chips.vga.getFrame().slice();
  const visible = new Uint8Array(6400);
  for (let row = 0; row < 64; row++) visible.set(pixels.subarray(row * 128, row * 128 + 100), row * 100);
  writeFileSync(join(outputDir, `frame-${sequence - 1}.bin`), pixels);
  frames.push({
    frameIndex: machine.mem[0x0201], serial: sequence,
    instructionsSincePreviousFrame: steps,
    guestCyclesSincePreviousFrame: machine.cycles - cyclesBefore,
    frameMilliseconds: (machine.cycles - cyclesBefore) * 1000 / machine.clockHz,
    framebufferSha256: sha256(pixels),
    visibleBase64: Buffer.from(visible).toString('base64'),
  });
  console.log(`frame ${sequence - 1}: guest index ${machine.mem[0x0201]}, ${steps} instructions, ${sha256(pixels)}`);
}
const report = { format: 'brickwright-animation-capture-v1', romSha256: sha256(rom),
  clockHz: machine.clockHz, width: 100, height: 64, framebufferStride: 128,
  frames: frames.map(({ visibleBase64, ...frame }) => frame) };
writeFileSync(join(outputDir, 'capture.json'), JSON.stringify(report, null, 2) + '\n');
// The first interval includes boot/clear, so it cannot pace a repeating wrap.
// Reuse an observed last-to-first transition with matching guest indices/pixels.
// A partial capture may not contain that transition: use its first steady
// interval, or a fixed 250 ms for one frame, without changing captured timing.
const sameFrame = (left, right) => left.frameIndex === right.frameIndex &&
  left.framebufferSha256 === right.framebufferSha256;
const wrapTransition = frames.find((frame, i) => i > 0 &&
  sameFrame(frames[i - 1], frames.at(-1)) && sameFrame(frame, frames[0]));
const wrapMilliseconds = wrapTransition?.frameMilliseconds ?? frames[1]?.frameMilliseconds ?? 250;
const replayPacing = wrapTransition
  ? `Replay wrap uses a measured guest transition from frame ${frames.at(-1).frameIndex} to frame ${frames[0].frameIndex} (${wrapMilliseconds.toFixed(3)} ms).`
  : frames.length > 1
    ? `This capture has no measured last-to-first transition. Replay uses its first steady interval (${wrapMilliseconds.toFixed(3)} ms) at the wrap.`
    : 'This single-frame capture has no measured frame-to-frame interval. Replay repeats it every 250 ms.';
const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>6502 animation: captured guest frames</title>
<style>
*{box-sizing:border-box}body{margin:0;background:#101826;color:#eef4ff;font:16px system-ui,sans-serif}
main{max-width:900px;margin:48px auto;padding:24px}h1{font-size:32px;margin:0 0 14px}p{line-height:1.55;color:#b7c6dd}
canvas{display:block;width:100%;image-rendering:pixelated;background:#000;border:1px solid #40516d;border-radius:8px}
.controls{display:flex;align-items:center;gap:18px;margin:20px 0;flex-wrap:wrap}button{font:inherit;padding:9px 18px;background:#84f0c4;border:0;border-radius:6px;color:#13291f;cursor:pointer}
input{flex:1;min-width:180px}output{font-variant-numeric:tabular-nums}code{color:#a2edce}small{color:#a4b3ca}
</style></head><body><main>
<h1>Your animation, executed by a 6502</h1>
<p>These complete frames were captured from the emulated CPU's writes to its framebuffer at <code>$2000</code>.
This page replays those observations; run the CLI again after changing the source to execute a new ROM.</p>
<canvas id="screen" width="100" height="64" aria-label="Captured monochrome guest framebuffer"></canvas>
<div class="controls"><button id="toggle">Pause</button><input id="seek" type="range" min="0" max="${frames.length - 1}" value="0" aria-label="Choose captured frame"><output id="label"></output></div>
<p id="details"></p><small>100 × 64 visible pixels · 128 bytes per framebuffer row · software frame hold · ${frames.length} complete frames captured</small>
<p id="pacing">${replayPacing} The raw timing in <code>capture.json</code> is unchanged.</p>
</main><script>
const frames=${JSON.stringify(frames)};
const wrapMilliseconds=${wrapMilliseconds};
const screen=document.getElementById('screen'),ctx=screen.getContext('2d');
const seek=document.getElementById('seek'),label=document.getElementById('label'),details=document.getElementById('details'),toggle=document.getElementById('toggle');
let index=0,playing=true,timer;
function draw(){
 const bytes=atob(frames[index].visibleBase64),image=ctx.createImageData(100,64);
 for(let i=0;i<6400;i++){const v=bytes.charCodeAt(i)?255:0;image.data[i*4]=v;image.data[i*4+1]=v;image.data[i*4+2]=v;image.data[i*4+3]=255}
 ctx.putImageData(image,0,0);seek.value=index;label.textContent='Frame '+frames[index].frameIndex+' · capture '+(index+1)+'/'+frames.length;
 details.textContent=frames[index].instructionsSincePreviousFrame.toLocaleString()+' guest instructions since the previous captured frame; '+frames[index].guestCyclesSincePreviousFrame.toLocaleString()+' guest cycles.';
}
function schedule(){clearTimeout(timer);const next=(index+1)%frames.length;if(playing)timer=setTimeout(()=>{index=next;draw();schedule()},Math.max(20,next===0?wrapMilliseconds:frames[next].frameMilliseconds))}
toggle.onclick=()=>{playing=!playing;toggle.textContent=playing?'Pause':'Play';schedule()};
seek.oninput=()=>{index=Number(seek.value);playing=false;toggle.textContent='Play';draw();schedule()};
draw();schedule();
</script></body></html>\n`;
writeFileSync(join(outputDir, 'animation.html'), html);
console.log(`Open ${join(outputDir, 'animation.html')} to replay the captured guest frames.`);
