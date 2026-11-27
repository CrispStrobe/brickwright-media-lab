#!/usr/bin/env node
// Actual W65C02 guest proof; all program/data/device writes originate in the ROM.
// Public domain, see LICENSE. No host-side Forth evaluator or memory patches.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url));
const board = resolve(process.env.BW_BOARD_DIR || join(here, '../../..', 'bw-board'));
const manifest = JSON.parse(readFileSync(join(here, 'brickwright-media.json'), 'utf8'));
const args = process.argv.slice(2);
const options = {};
for (let i = 0; i < args.length; i += 2) {
  if (!['--rom', '--report', '--frame'].includes(args[i]) || !args[i + 1]) {
    console.error('Usage: node proof.mjs [--rom FILE] [--report JSON] [--frame PGM]');
    process.exit(2);
  }
  options[args[i]] = resolve(args[i + 1]);
}
const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
const romInfo = manifest.components.find(item => item.file === manifest.slots.rom);
function verifyRom(bytes) {
  assert.equal(bytes.length, romInfo.bytes, 'ROM length differs from manifest');
  assert.equal(sha256(bytes), romInfo.sha256, 'ROM SHA-256 differs from manifest');
}

async function main() {
  const romPath = options['--rom'] || join(here, manifest.slots.rom);
  let rom;
  try { rom = new Uint8Array(readFileSync(romPath)); }
  catch (error) { throw new Error(`Required ROM cannot be read: ${romPath} (${error.code}). Run build.sh --write to build it.`); }
  verifyRom(rom);
  // A changed artifact is refused before any guest code executes.
  const changed = rom.slice();
  changed[0] ^= 1;
  assert.throws(() => verifyRom(changed), /SHA-256/, 'tampered ROM must be refused');

  const { runMediaBundle } = await import(pathToFileURL(join(board, 'src/machine-media.js')));
  const { M6502Machine } = await import(pathToFileURL(join(board, 'src/m6502-machine.js')));
  const missing = await runMediaBundle(manifest, {});
  assert.equal(missing.applied.length, 0);
  assert(missing.errors.some(error => error.slot === 'rom' && error.error.includes(manifest.slots.rom)),
    'missing ROM must produce a named media error');

  const sessions = [];
  async function session(name) {
    let output = '';
    let steps = 0;
    const { machine, errors, applied } = await runMediaBundle(manifest,
      { [manifest.slots.rom]: rom },
      { hooks: { onSerial: byte => { output += String.fromCharCode(byte); } } });
    assert.deepEqual(errors, []);
    assert.deepEqual(applied, ['rom']);
    assert(machine instanceof M6502Machine, 'canonical runner must use actual 65C02 machine');
    const acia = machine.chips[manifest.program.console];
    const records = [];
    function until(predicate, budget, label) {
      const start = steps;
      while (!predicate()) {
        if (steps - start >= budget || steps >= 8_000_000) {
          throw new Error(`${name}: ${label} exceeded instruction budget at PC $${machine.cpu.pc.toString(16)}; recent UART: ${JSON.stringify(output.slice(-240))}`);
        }
        assert(!machine.cpu.stopped, `${name}: CPU stopped during ${label}`);
        machine.step();
        steps++;
      }
    }
    function line(input) {
      assert(!input.includes('\n') && !input.includes('\r'), 'send one input line at a time');
      const offset = output.length;
      for (const ch of input + '\r') {
        assert(!acia.rdrf, 'previous byte must be consumed before typing the next');
        acia.rxPush(ch.charCodeAt(0));
        until(() => !acia.rdrf, 100_000, 'serial byte consumption');
      }
      until(() => output.slice(offset).endsWith(' ok\n'), 2_000_000, `prompt after ${JSON.stringify(input)}`);
      const transcript = output.slice(offset);
      assert(transcript.startsWith(input), 'input echo must match the typed command');
      const response = transcript.slice(input.length).replace(/^ +/, '');
      assert(!acia.overrun, 'paced input must not overflow ACIA');
      const record = { input, response };
      records.push(record);
      return response;
    }
    function value(input, expected) {
      const response = line(input);
      assert.match(response, /^-?\d+ \n ok\n$/, `expected one computed integer after ${input}`);
      const actual = Number(response.split('\n')[0].trim());
      if (expected !== undefined) assert.equal(actual, expected, input);
      return actual;
    }
    function sample(filename) {
      const source = readFileSync(join(here, filename), 'utf8');
      const results = [];
      for (const input of source.split(/\r?\n/).map(s => s.trim())) {
        if (input && !input.startsWith('\\')) results.push(line(input));
      }
      return results;
    }
    until(() => output.endsWith("Type 'bye' to exit\n"), 500_000, 'boot banner');
    for (const expected of manifest.expect) assert(output.includes(expected), `missing boot output ${expected}`);
    line(''); // Initial boot waits for input; an empty line establishes the first ok.
    const result = { name, machine, line, value, sample,
      report: () => ({ name, steps, cycles: machine.cycles, machineMs: machine.tMs,
        finalPc: machine.cpu.pc, stopped: machine.cpu.stopped, records, transcript: output }) };
    sessions.push(result);
    return result;
  }

  const live = await session('live');
  assert.equal(live.machine.chips.screen.frame, 2048, 'guest boot must perform every framebuffer clearing write');
  assert(live.machine.chips.screen.buf.every(byte => byte === 0), 'guest boot clears framebuffer');
  const squares = live.sample('samples/square.fs');
  assert(squares.includes('49 \n ok\n'), 'first typed definition computes 49');
  assert(squares.includes('50 \n ok\n'), 'changed typed definition computes 50');
  live.line('variable counter');
  live.line('41 counter !');
  live.line('counter @ 1 + counter !');
  live.value('counter @ . cr', 42);
  const counter = live.value('counter . cr');
  assert(counter >= 0x400 && counter < 0x2c00, 'variable lies in Tali-owned RAM');
  assert.equal(live.machine.mem[counter] | live.machine.mem[counter + 1] << 8, 42,
    'guest variable result is present in actual machine RAM');

  live.sample('samples/framebuffer.fs');
  const framebuffer = live.machine.chips.screen.buf.slice();
  assert.equal(framebuffer.length, 64 * 32);
  for (let y = 0; y < 32; y++) {
    for (let x = 0; x < 64; x++) {
      const expected = x === 0 && y === 0 ? 85 : ((x + y) & 1) * 255;
      assert.equal(framebuffer[y * 64 + x], expected, `guest pixel (${x},${y})`);
      assert.equal(live.machine.mem[0x3000 + y * 64 + x], expected, `RAM pixel (${x},${y})`);
    }
  }
  const ports = live.sample('samples/port.fs');
  assert(ports.includes('85 \n ok\n') && ports.includes('170 \n ok\n'), 'guest reads back changed VIA outputs');
  assert.equal(live.machine.chips.via1.read(2), 255, 'VIA DDRB configured by ROM');
  assert.equal(live.machine.chips.via1.read(0), 170, 'VIA port B changed by typed Forth');

  // Fresh machine is the reset boundary; neither RAM words nor video carry over.
  const fresh = await session('fresh');
  assert.equal(fresh.machine.chips.screen.frame, 2048, 'fresh guest boot must perform every framebuffer clearing write');
  fresh.value('s" square" find-name 0= . cr', -1);
  fresh.value('s" counter" find-name 0= . cr', -1);
  assert(fresh.machine.chips.screen.buf.every(byte => byte === 0), 'fresh framebuffer is cleared by guest boot');
  assert.equal(fresh.machine.chips.via1.read(0), 0, 'fresh VIA output reset');
  live.value('7 square . cr', 50);
  assert.deepEqual(live.machine.chips.screen.buf, framebuffer, 'starting fresh machine does not alter live screen');
  assert.equal(live.machine.mem[counter], 42, 'live variable remains isolated');

  let boardCommit = null;
  try { boardCommit = execFileSync('git', ['-C', board, 'rev-parse', 'HEAD'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); }
  catch { /* A source archive has no Git metadata; its path is still reported. */ }
  const report = {
    schema: 'brickwright-tali-proof-v1', result: 'pass', boardCommit,
    upstreamCommit: manifest.provenance.commit, romSha256: sha256(rom),
    framebuffer: { width: 64, height: 32, bytes: framebuffer.length, sha256: sha256(framebuffer) },
    memoryVariable: { address: counter, value: 42 },
    refusalChecks: ['missing ROM named by canonical loader', 'changed ROM SHA-256'],
    sessions: sessions.map(item => item.report()),
    scope: 'Native W65C02 ROM, UART interaction, guest RAM/framebuffer/VIA writes and fresh-machine isolation. No GUI, persistence or physical timing claim.'
  };
  if (options['--report']) writeFileSync(options['--report'], JSON.stringify(report, null, 2) + '\n');
  if (options['--frame']) writeFileSync(options['--frame'], Buffer.concat([Buffer.from('P5\n64 32\n255\n'), framebuffer]));
  console.log(JSON.stringify(report, null, 2));
  console.log('PASS — Tali Forth defines and changes words, draws through guest stores, drives VIA outputs and isolates fresh sessions.');
}

main().catch(error => {
  console.error(`FAIL — ${error.message}`);
  process.exitCode = 1;
});
