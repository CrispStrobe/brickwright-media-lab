#!/usr/bin/env node
// A bounded, native-guest ACIA console for a lesson or a user-written Forth file.
// Public domain; see LICENSE.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createInterface } from 'node:readline/promises';

const here = dirname(fileURLToPath(import.meta.url));
const manifest = JSON.parse(readFileSync(join(here, 'brickwright-media.json'), 'utf8'));
const options = {};
const args = process.argv.slice(2);
for (let i = 0; i < args.length; i += 2) {
  if (!['--script', '--frame'].includes(args[i]) || !args[i + 1]) {
    console.error('Usage: node run.mjs [--script FILE.fs] [--frame OUTPUT.pgm]');
    process.exit(2);
  }
  options[args[i]] = resolve(args[i + 1]);
}

async function main() {
  const info = manifest.components.find(item => item.file === manifest.slots.rom);
  const rom = new Uint8Array(readFileSync(join(here, manifest.slots.rom)));
  assert.equal(rom.length, info.bytes, 'ROM size differs from manifest');
  assert.equal(createHash('sha256').update(rom).digest('hex'), info.sha256, 'ROM SHA-256 differs from manifest');
  const waitAddress = manifest.program.inputWaitAddress;
  // Source/ROM-bound input-loop address, not a patched CPU trap. The guest
  // executes the actual LDA ACIA_STATUS / AND #$08 polling instructions.
  assert.deepEqual([...rom.slice(waitAddress - 0x8000, waitAddress - 0x8000 + 5)],
    [0xad, 0x01, 0x50, 0x29, 0x08], 'manifest input loop must match ROM');
  const board = resolve(process.env.BW_BOARD_DIR || join(here, '../../..', 'bw-board'));
  const { runMediaBundle } = await import(pathToFileURL(join(board, 'src/machine-media.js')));
  let output = '';
  const { machine, errors } = await runMediaBundle(manifest, { [manifest.slots.rom]: rom },
    { hooks: { onSerial: byte => { output += String.fromCharCode(byte); } } });
  assert.deepEqual(errors, []);
  const acia = machine.chips[manifest.program.console];
  function until(predicate, max, reason) {
    let steps = 0;
    while (!predicate() && !machine.cpu.stopped) {
      if (++steps > max) throw new Error(`${reason}: exceeded ${max} instructions. Restart to discard this RAM session.`);
      machine.step();
    }
  }
  const waiting = () => !acia.rdrf && machine.cpu.pc === waitAddress;
  until(waiting, 500_000, 'boot');
  process.stdout.write(output);

  function send(input) {
    const start = output.length;
    for (const ch of input + '\r') {
      if (machine.cpu.stopped) break;
      assert(!acia.rdrf, 'input byte has not been consumed');
      acia.rxPush(ch.charCodeAt(0));
      until(() => !acia.rdrf, 100_000, 'serial input');
    }
    until(waiting, 2_000_000, 'command');
    const response = output.slice(start);
    process.stdout.write(response);
    return response;
  }
  if (options['--script']) {
    let response = '';
    for (const input of readFileSync(options['--script'], 'utf8').split(/\r?\n/)) {
      if (!input.trim() || input.trimStart().startsWith('\\')) continue;
      response = send(input);
      if (machine.cpu.stopped) break;
      assert(/ (?:ok|compiled)\n$/.test(response), 'guest rejected this script line (see UART output above)');
    }
    assert(!response.endsWith(' compiled\n'), 'script ended with an unfinished Forth definition');
  } else {
    const terminal = createInterface({ input: process.stdin, output: process.stdout });
    try {
      // An interactive typo returns to the genuine input loop and can be
      // corrected. Multi-line definitions return "compiled" until closed.
      for await (const input of terminal) {
        send(input);
        if (machine.cpu.stopped) break;
      }
    } finally { terminal.close(); }
  }
  if (options['--frame']) {
    const bytes = machine.chips.screen.buf;
    writeFileSync(options['--frame'], Buffer.concat([Buffer.from('P5\n64 32\n255\n'), bytes]));
    console.error(`Exported guest framebuffer to ${options['--frame']}`);
  }
  if (machine.cpu.stopped) console.error('Guest stopped with BYE. Start a new session to reset.');
}

main().catch(error => { console.error(`FAIL — ${error.message}`); process.exitCode = 1; });
