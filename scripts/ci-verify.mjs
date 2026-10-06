#!/usr/bin/env node
/**
 * brickwright-media-lab CI verifier.
 *
 * Boots every project that CAN be booted deterministically on a pinned
 * bw-board checkout and checks its manifest's expect[] against the real
 * console transcript. Everything else is SKIPPED loudly, by name, with the
 * reason derived from the manifest — never silently dropped.
 *
 * Dispatch per project (projects/<name>/brickwright-media.json):
 *   1. proof.mjs present            -> run `node proof.mjs` (it drives bw-board's
 *                                      runMediaBundle itself); PASS on exit 0.
 *   2. program.tool === 'run-dos'   -> run each unit (programs[] if present, else
 *                                      the top level) through bw-board's
 *                                      scripts/run-dos.mjs and check expect[].
 *   3. otherwise                    -> SKIP with a derived reason (no manifest,
 *                                      artifact not committed, or a machine/OS
 *                                      image this harness does not boot).
 *
 * A committed artifact is required to run: a project whose slot file is absent
 * (fetched/built by fetch.sh, not checked in) skips as "artifact not committed".
 *
 * Requires a bw-board checkout. Point BW_BOARD_DIR at it (defaults to a sibling
 * ../bw-board).  Usage:  BW_BOARD_DIR=/path/to/bw-board node scripts/ci-verify.mjs
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = join(here, '..');
const PROJECTS = join(ROOT, 'projects');
const BW_BOARD = process.env.BW_BOARD_DIR || join(ROOT, '..', 'bw-board');
const RUN_DOS = join(BW_BOARD, 'scripts', 'run-dos.mjs');

if (!existsSync(BW_BOARD)) {
    console.error(`bw-board checkout not found at ${BW_BOARD} — set BW_BOARD_DIR`);
    process.exit(2);
}

const results = { pass: [], fail: [], skip: [] };
const pass = (p, d) => { results.pass.push(p); console.log(`PASS  ${p}  — ${d}`); };
const fail = (p, d) => { results.fail.push(p); console.log(`FAIL  ${p}  — ${d}`); };
const skip = (p, d) => { results.skip.push(p); console.log(`SKIP  ${p}  — ${d}`); };

// Check that every needle appears in the transcript; return the first miss or null.
const firstMiss = (text, needles) => needles.find((w) => !text.includes(w)) ?? null;

function runProof(name, dir) {
    const r = spawnSync(process.execPath, [join(dir, 'proof.mjs')], {
        cwd: dir, encoding: 'utf8', timeout: 300_000,
        env: { ...process.env, BW_BOARD_DIR: BW_BOARD },
        maxBuffer: 64 * 1024 * 1024,
    });
    if (r.status === 0) pass(name, 'proof.mjs');
    else fail(name, `proof.mjs exited ${r.status}\n${(r.stdout || '').split('\n').slice(-6).join('\n')}\n${(r.stderr || '').slice(-400)}`);
}

function runDos(name, dir, manifest) {
    const units = (manifest.programs && manifest.programs.length) ? manifest.programs : [manifest];
    let unitIdx = 0;
    for (const unit of units) {
        unitIdx++;
        const slots = unit.slots || manifest.slots || {};
        const program = unit.program || manifest.program || {};
        const mount = unit.mount || manifest.mount || {};
        const expect = unit.expect || manifest.expect || [];
        const artifact = slots.exe || slots.com;
        if (!artifact) { fail(name, `unit ${unitIdx}: no exe/com slot`); return; }
        const artifactPath = join(dir, artifact);
        if (!existsSync(artifactPath)) { skip(name, `artifact ${artifact} not committed (run fetch.sh)`); return; }

        const args = [RUN_DOS, artifactPath, '--preset', program.preset || 'xt'];
        if (program.variant) args.push('--variant', program.variant);
        args.push('--max', String(program.max || 20_000_000));
        for (const [guest, hostRel] of Object.entries(mount)) {
            args.push('--file', `${guest}=${join(dir, hostRel)}`);
        }
        args.push('--screen', '--quiet');

        const r = spawnSync(process.execPath, args, {
            cwd: dir, encoding: 'utf8', timeout: 300_000, maxBuffer: 64 * 1024 * 1024,
        });
        const text = (r.stdout || '') + (r.stderr || '');
        const miss = firstMiss(text, expect);
        if (miss !== null) {
            fail(name, `unit ${unitIdx} (${artifact}): missing ${JSON.stringify(miss)}\n${text.split('\n').slice(-8).join('\n')}`);
            return;
        }
    }
    pass(name, `run-dos (${units.length} unit${units.length === 1 ? '' : 's'})`);
}

const projectDirs = readdirSync(PROJECTS, { withFileTypes: true })
    .filter((d) => d.isDirectory()).map((d) => d.name).sort();

for (const name of projectDirs) {
    const dir = join(PROJECTS, name);
    const manifestPath = join(dir, 'brickwright-media.json');

    if (existsSync(join(dir, 'proof.mjs'))) { runProof(name, dir); continue; }
    if (!existsSync(manifestPath)) { skip(name, 'no brickwright-media.json'); continue; }

    let manifest;
    try { manifest = JSON.parse(readFileSync(manifestPath, 'utf8')); }
    catch (e) { fail(name, `unreadable manifest: ${e.message}`); continue; }

    const tool = manifest.program?.tool;
    if (tool === 'run-dos') { runDos(name, dir, manifest); continue; }

    skip(name, `no proof.mjs and program.tool is not 'run-dos' (machine '${manifest.machine || '?'}' — needs media/OS image or an interactive boot this harness does not drive)`);
}

const total = projectDirs.length;
console.log(`\n=== media-lab verify: ${results.pass.length} pass, ${results.fail.length} fail, ${results.skip.length} skip (of ${total}) ===`);
if (results.fail.length) {
    console.log('FAILED: ' + results.fail.join(', '));
    process.exit(1);
}
console.log('OK — every bootable project matched its expect[]; the rest skipped by name.');
