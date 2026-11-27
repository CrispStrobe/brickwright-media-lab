#!/usr/bin/env node
// SPDX-License-Identifier: MIT
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { encodeAnimation } from './encode.mjs';

export const here = dirname(fileURLToPath(import.meta.url));
export const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');

export function buildAnimation({ sourcePath = join(here, 'src', 'animation.json'), outputDir } = {}) {
  const sourceBytes = readFileSync(sourcePath);
  const source = JSON.parse(sourceBytes.toString('utf8'));
  const pixels = encodeAnimation(source);
  const playerPath = join(here, 'src', 'player.asm');
  const buildRoot = join(here, '.build');
  mkdirSync(buildRoot, { recursive: true });
  const temporary = mkdtempSync(join(buildRoot, 'assemble-'));
  const assembler = process.env.TASS64 || '64tass';
  try {
    writeFileSync(join(temporary, 'frames.bin'), pixels);
    writeFileSync(join(temporary, 'constants.inc'),
      `FRAME_COUNT = ${source.frames.length}\nHOLD_LOOPS = ${source.holdLoops}\n`);
    writeFileSync(join(temporary, 'pointers.inc'), source.frames.map((_, i) =>
      `        .word frame_data + ${i * 6400}\n`).join(''));
    let assemblerVersion;
    try {
      assemblerVersion = execFileSync(assembler, ['--version'], { encoding: 'utf8' }).trim().split('\n')[0];
      execFileSync(assembler, ['--ascii', '--case-sensitive', '--m6502', '--nostart', '--quiet',
        '-I', temporary, '--output', join(temporary, 'animation.rom'), playerPath],
      { cwd: temporary, stdio: ['ignore', 'pipe', 'pipe'] });
    } catch (error) {
      const details = error.stderr?.toString().trim() || error.message;
      throw new Error(`64tass build failed. Install 64tass or set TASS64 to its executable.\n${details}`);
    }
    const rom = readFileSync(join(temporary, 'animation.rom'));
    if (rom.length !== 32768) throw new Error(`expected a 32768-byte ROM, got ${rom.length}`);
    if (rom.readUInt16LE(0x7ffc) !== 0x8000) throw new Error('reset vector must point to $8000');
    const manifest = JSON.parse(readFileSync(join(here, 'brickwright-media.json'), 'utf8'));
    manifest.components[0].sha256 = sha256(rom);
    manifest.observation.frameCount = source.frames.length;
    const report = {
      format: 'brickwright-animation-build-v1',
      title: source.title,
      frameCount: source.frames.length,
      width: 100, height: 64, inputStride: 100, framebufferStride: 128,
      encodedPixelBytes: pixels.length,
      romBytes: rom.length,
      sourceSha256: sha256(sourceBytes),
      playerSha256: sha256(readFileSync(playerPath)),
      romSha256: sha256(rom),
      assembler: assemblerVersion,
    };
    if (outputDir) {
      mkdirSync(outputDir, { recursive: true });
      writeFileSync(join(outputDir, 'animation.rom'), rom);
      writeFileSync(join(outputDir, 'brickwright-media.json'), JSON.stringify(manifest, null, 2) + '\n');
      writeFileSync(join(outputDir, 'animation-source.json'), sourceBytes);
      writeFileSync(join(outputDir, 'build-report.json'), JSON.stringify(report, null, 2) + '\n');
      writeFileSync(join(outputDir, 'LICENSE'), readFileSync(join(here, 'LICENSE')));
    }
    return { rom, manifest, report };
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const args = process.argv.slice(2);
    let sourcePath, outputDir = join(here, '.build', 'bundle'), check = false;
    while (args.length) {
      const arg = args.shift();
      if (arg === '--source' || arg === '--out') {
        const value = args.shift();
        if (!value || value.startsWith('--')) throw new Error(`${arg} requires a path`);
        if (arg === '--source') sourcePath = resolve(value);
        else outputDir = resolve(value);
      } else if (arg === '--check') check = true;
      else throw new Error('usage: node build.mjs [--source animation.json] [--out directory] [--check]');
    }
    if (check && sourcePath) throw new Error('--check verifies the bundled starter; omit --source');
    const result = buildAnimation({ sourcePath, outputDir: check ? undefined : outputDir });
    if (check) {
      const bundled = readFileSync(join(here, 'animation.rom'));
      const manifest = JSON.parse(readFileSync(join(here, 'brickwright-media.json'), 'utf8'));
      if (!result.rom.equals(bundled)) throw new Error('rebuilt ROM differs from bundled animation.rom');
      if (sha256(bundled) !== manifest.components[0].sha256) throw new Error('bundled ROM hash differs from manifest');
      console.log(`PASS: byte-identical starter ROM (${result.report.romSha256}).`);
    } else {
      console.log(`Built ${result.report.frameCount} frames into ${outputDir}`);
      console.log(`ROM sha256 ${result.report.romSha256}`);
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
