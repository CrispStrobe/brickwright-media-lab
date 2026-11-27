#!/usr/bin/env node
// SPDX-License-Identifier: MIT
// Encode an original sprite/position description as raw row-major pixel bytes.
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const integer = (value, min, max, label) => {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new Error(`${label} must be an integer from ${min} to ${max}`);
  }
};
const monochrome = (value, label) => {
  if (value !== 0 && value !== 63) throw new Error(`${label} must be 0 (black) or 63 (white)`);
};

export function encodeAnimation(source) {
  if (!source || source.format !== 'brickwright-pixel-animation-v1') {
    throw new Error('unsupported animation format');
  }
  if (source.width !== 100 || source.height !== 64) {
    throw new Error('this player requires a 100 by 64 image');
  }
  monochrome(source.background, 'background');
  integer(source.holdLoops, 1, 255, 'holdLoops');
  if (!source.palette || typeof source.palette !== 'object' || Array.isArray(source.palette)) {
    throw new Error('palette must map single characters to pixel values');
  }
  for (const [symbol, value] of Object.entries(source.palette)) {
    if (symbol.length !== 1) throw new Error('palette keys must be single characters');
    monochrome(value, `palette[${symbol}]`);
  }
  if (!Array.isArray(source.sprite) || !source.sprite.length || source.sprite.length > 64) {
    throw new Error('sprite must contain 1 to 64 rows');
  }
  const spriteWidth = typeof source.sprite[0] === 'string' ? source.sprite[0].length : 0;
  if (spriteWidth < 1 || spriteWidth > 100) throw new Error('sprite width must be 1 to 100');
  for (const row of source.sprite) {
    if (typeof row !== 'string' || row.length !== spriteWidth) {
      throw new Error('sprite rows must have the same width');
    }
    for (const symbol of row) {
      if (!Object.hasOwn(source.palette, symbol)) throw new Error(`unknown sprite symbol ${symbol}`);
    }
  }
  if (!Array.isArray(source.frames) || source.frames.length < 1 || source.frames.length > 4) {
    throw new Error('this ROM player supports 1 to 4 frames');
  }
  const bytes = new Uint8Array(source.frames.length * 100 * 64).fill(source.background);
  source.frames.forEach((frame, index) => {
    integer(frame.x, 0, 100 - spriteWidth, `frame ${index} x`);
    integer(frame.y, 0, 64 - source.sprite.length, `frame ${index} y`);
    for (let y = 0; y < source.sprite.length; y++) {
      for (let x = 0; x < spriteWidth; x++) {
        bytes[index * 6400 + (frame.y + y) * 100 + frame.x + x] = source.palette[source.sprite[y][x]];
      }
    }
  });
  return bytes;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const [sourcePath, outputPath, ...extra] = process.argv.slice(2);
    if (!sourcePath || !outputPath || extra.length) {
      throw new Error('usage: node encode.mjs animation.json frames.bin');
    }
    const bytes = encodeAnimation(JSON.parse(readFileSync(sourcePath, 'utf8')));
    writeFileSync(outputPath, bytes);
    console.log(`Encoded ${bytes.length / 6400} frames (${bytes.length} raw pixel bytes).`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
