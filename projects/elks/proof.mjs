#!/usr/bin/env node
/**
 * Proof: the official ELKS v0.9.2 release floppy boots on the bw-board i8086
 * machine to its acceptance screen.
 *
 * Drives bw-board's `runI8086FloppyBundle` with the exact manifest this project
 * ships (machine i8086 / PCXT8086, the fd1440-fat.img floppy slot, 80/2/18
 * geometry, the at-floppy-drive-type quirk) on a free BIOS ROM built in-process
 * (`buildBios()` — the ROM is the app's, not GPL content). It checks the kernel
 * banner, the sized floppy geometry and the root mount against the real CGA text
 * screen.
 *
 * The floppy is GPL-2 and is NEVER vendored here — run `fetch.sh` (the media-lab
 * CI does this with `--fetch`; both verify the image against a pinned sha256).
 * If the image is absent this exits 2 (SKIP), which ci-verify records as a skip,
 * not a pass — a silent exit-0 skip would read like a pass.
 *
 * Requires a bw-board checkout. Point BW_BOARD_DIR at it (defaults to a sibling
 * ../bw-board).  Usage:  BW_BOARD_DIR=/path/to/bw-board node proof.mjs
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const bwBoard = process.env.BW_BOARD_DIR || join(here, '..', '..', '..', 'bw-board');
const manifest = JSON.parse(readFileSync(join(here, 'brickwright-media.json'), 'utf8'));

const image = join(here, manifest.slots.floppy);
if (!existsSync(image)) {
    console.log(`SKIP: no ELKS image at ${manifest.slots.floppy}.`);
    console.log('ELKS is GPL-2 and is fetched, not vendored — run fetch.sh first');
    console.log('(the media-lab CI runs ci-verify with --fetch). Nothing to boot.');
    process.exit(2);
}

const { runI8086FloppyBundle } = await import(join(bwBoard, 'src', 'machine-media-i8086.js'));
const { buildBios } = await import(join(bwBoard, 'scripts', 'build-bios.mjs'));

const files = { [manifest.slots.floppy]: readFileSync(image) };
const { screen, expect } = runI8086FloppyBundle(manifest, files, { romBytes: buildBios().bytes });

let ok = true;
for (const e of expect) {
    console.log(`${e.ok ? 'ok  ' : 'FAIL'} ${JSON.stringify(e.text)}`);
    ok = ok && e.ok;
}
if (!ok) {
    console.log('\n--- screen ---\n' + screen.replace(/ {2,}/g, ' ').trim().slice(0, 500));
    console.error('\nELKS media bundle did NOT reach its acceptance screen.');
    process.exit(1);
}
console.log('\nPASS — ELKS 0.9.2 booted on the bw-board i8086 machine to a mounted root filesystem.');
