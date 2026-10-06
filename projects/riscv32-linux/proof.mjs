#!/usr/bin/env node
/**
 * Proof: Linux 6.1.188 (RV32IMAC) + BusyBox boots on the bw-board riscv32
 * machine to a userspace shell over the UART.
 *
 * Drives bw-board's `runRiscvLinuxBundle` with the exact manifest this project
 * ships (kernel + initrd slots, their pinned sha256s verified by the runner) and
 * checks the kernel banner and the userspace-up marker in the real UART output.
 * It boots only to the shell prompt (opts.commands = []) — no interactive demo —
 * so the check is the deterministic boot, bounded by the manifest's instruction
 * budget.
 *
 * The kernel/initrd are GPL-2/LGPL and are NEVER vendored here — run `fetch.sh`
 * (the media-lab CI does this with `--fetch`; the runner verifies both against
 * the manifest's pinned sha256s). If a slot image is absent this exits 2 (SKIP),
 * which ci-verify records as a skip, not a pass.
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

const slotName = (v) => (typeof v === 'string' ? v : v.file);
const kernel = slotName(manifest.slots.kernel);
const initrd = slotName(manifest.slots.initrd);
for (const f of [kernel, initrd]) {
    if (!existsSync(join(here, f))) {
        console.log(`SKIP: no ${f}. The Linux kernel/initrd are GPL-2/LGPL and are`);
        console.log('fetched, not vendored — run fetch.sh first (the media-lab CI runs');
        console.log('ci-verify with --fetch). Nothing to boot.');
        process.exit(2);
    }
}

const { runRiscvLinuxBundle } = await import(join(bwBoard, 'src', 'riscv32-linux-session.js'));
const files = {
    [kernel]: readFileSync(join(here, kernel)),
    [initrd]: readFileSync(join(here, initrd)),
};

const t0 = Date.now();
const res = await runRiscvLinuxBundle(manifest, files, { commands: [] }); // boot-only; check manifest.expect
const secs = ((Date.now() - t0) / 1000).toFixed(1);

for (const w of manifest.expect || []) {
    console.log(`${res.output.includes(w) ? 'ok  ' : 'FAIL'} ${JSON.stringify(w)}`);
}
if (!res.ok) {
    console.log('\n--- last UART output ---\n' + res.output.slice(-600));
    console.error(`\nLinux did NOT reach userspace: ${res.reason} (${res.instructions} insns, ${secs}s)`);
    process.exit(1);
}
console.log(`\nPASS — Linux 6.1.188 booted to userspace on the bw-board riscv32 machine `
    + `(${(res.promptAt / 1e6).toFixed(0)}M insns to prompt, ${secs}s).`);
