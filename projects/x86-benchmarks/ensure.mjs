#!/usr/bin/env node
// MIT. Runtime asset fetch/cache, never linked into the emulator/app build.
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {createHash, randomUUID} from 'node:crypto';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {spawn} from 'node:child_process';

const projects = ['topbench', 'native-sieve', 'whetstone'];
const variants = ['8086', '80186', '80286', '80386'];
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
export const usage = 'usage: ensure.mjs --project NAME --media-ref FULL_SHA [--cache DIR] [--run --board DIR --variant CPU --max N]';

function relativeFile(name) {
  if (typeof name !== 'string' || name.startsWith('/') || name.includes('\\') ||
      name.split('/').some(part => !part || part === '.' || part === '..'))
    throw Error('unsafe cache path');
  return name;
}
function validateSelection(project, ref) {
  if (!projects.includes(project) || !/^[0-9a-f]{40}$/.test(ref || ''))
    throw Error('choose a registered project and full immutable media-lab commit');
}
function validateRun(board, variant, max) {
  if (typeof board !== 'string' || !board.trim()) throw Error('--run requires --board or BW_BOARD_DIR');
  if (!variants.includes(variant)) throw Error('variant must be 8086, 80186, 80286 or 80386');
  if (!Number.isSafeInteger(max) || max < 1) throw Error('--max must be a positive safe integer');
}
export function parseEnsureArgs(args, env = process.env) {
  if (args.length === 1 && args[0] === '--help') return {help: true};
  const options = {run: false, variant: '80386', max: 20000000}, seen = new Set();
  for (let i = 0; i < args.length; i++) {
    const key = args[i];
    if (seen.has(key)) throw Error('duplicate option: ' + key);
    seen.add(key);
    if (key === '--run') { options.run = true; continue; }
    if (!['--project', '--media-ref', '--cache', '--board', '--variant', '--max'].includes(key) ||
        !args[i + 1] || args[i + 1].startsWith('--')) throw Error(usage);
    options[key.slice(2)] = args[++i];
  }
  validateSelection(options.project, options['media-ref']);
  options.max = Number(options.max);
  if (!variants.includes(options.variant) || !Number.isSafeInteger(options.max) || options.max < 1)
    throw Error('invalid variant or instruction budget');
  options.board ||= env.BW_BOARD_DIR;
  if (options.run) {
    validateRun(options.board, options.variant, options.max);
    if (options.project === 'native-sieve' && options.variant !== '80386')
      throw Error('native-sieve requires the native 80386 runner');
  }
  return options;
}

async function atomicWrite(target, bytes) {
  const temp = target + '.new-' + process.pid + '-' + randomUUID();
  try {
    await fs.writeFile(temp, bytes, {flag: 'wx'});
    await fs.rename(temp, target);
  } finally { await fs.rm(temp, {force: true}); }
}
export async function ensureBenchmark({project, ref,
  cache = path.join(process.env.XDG_CACHE_HOME || path.join(os.homedir(), '.cache'), 'brickwright', 'x86-benchmarks'),
  onNotice = () => {}, fetcher = fetch}) {
  validateSelection(project, ref);
  const base = `https://raw.githubusercontent.com/CrispStrobe/brickwright-media-lab/${ref}/projects/x86-benchmarks/${project}/`;
  const dest = path.resolve(cache, ref, project);
  await fs.mkdir(dest, {recursive: true});
  async function get(name, sha) {
    const target = path.join(dest, relativeFile(name));
    try {
      const bytes = await fs.readFile(target);
      const expected = sha || (await fs.readFile(target + '.sha256', 'utf8')).trim();
      if (expected && digest(bytes) === expected) return bytes;
    } catch (error) { if (error.code !== 'ENOENT') throw error; }
    const response = await fetcher(base + name);
    if (!response.ok) throw Error(`download ${name}: HTTP ${response.status}`);
    const bytes = Buffer.from(await response.arrayBuffer());
    if (sha && digest(bytes) !== sha) throw Error('download digest mismatch: ' + name);
    await fs.mkdir(path.dirname(target), {recursive: true});
    await atomicWrite(target, bytes);
    if (!sha) await atomicWrite(target + '.sha256', digest(bytes) + '\n');
    return bytes;
  }
  // Immutable Git revision pins metadata; file hashes pin payloads.
  const proof = JSON.parse((await get('assets.json')).toString());
  if (!proof.files?.LICENSE) throw Error('asset proof must include LICENSE');
  for (const [name, item] of Object.entries(proof.files)) {
    relativeFile(name);
    if (!/^[0-9a-f]{64}$/.test(item.sha256 || '') || !Number.isSafeInteger(item.bytes) || item.bytes < 0)
      throw Error('invalid asset proof: ' + name);
  }
  const notice = await get('LICENSE', proof.files.LICENSE.sha256);
  if (notice.length !== proof.files.LICENSE.bytes) throw Error('byte count mismatch: LICENSE');
  await onNotice(notice.toString());
  const rows = await Promise.allSettled(Object.entries(proof.files).map(async ([name, item]) => {
    const bytes = await get(name, item.sha256);
    if (bytes.length !== item.bytes) throw Error('byte count mismatch: ' + name);
  }));
  for (const row of rows) if (row.status === 'rejected') throw row.reason;
  await get('brickwright-media.json');
  if (proof.runtimeBuild) {
    if (!/^[0-9a-f]{64}$/.test(proof.runtimeBuild.sha256 || '')) throw Error('invalid build helper hash');
    await get(proof.runtimeBuild.script, proof.runtimeBuild.sha256);
  }
  return {projectDirectory: dest, mediaCommit: ref, assetCount: rows.length,
    licenseSha256: proof.files.LICENSE.sha256, runtimeBuild: proof.runtimeBuild || null};
}

// Serializable consumer contract: a GUI must show onNotice before executing this plan.
export async function createBenchmarkRunPlan({projectDirectory, board, variant = '80386',
  max = 20000000, runtimeBuild = null}) {
  validateRun(board, variant, max);
  if (typeof projectDirectory !== 'string' || !projectDirectory.trim()) throw Error('cached project directory is required');
  projectDirectory = path.resolve(projectDirectory);
  board = path.resolve(board);
  const manifest = JSON.parse(await fs.readFile(path.join(projectDirectory, 'brickwright-media.json'), 'utf8'));
  const raw = manifest.kind === 'native-i80386-raw';
  if (raw && (manifest.machine !== 'i80386-experimental' || manifest.format !== 'raw32' || manifest.fpu !== 'absent'))
    throw Error('unsupported native benchmark manifest');
  if (raw && variant !== '80386') throw Error('raw native i80386 image cannot run on the DOS path');
  if (!raw && (manifest.program?.kind !== 'dos' || manifest.program?.tool !== 'run-dos'))
    throw Error('unsupported benchmark consumer manifest');
  if (raw && runtimeBuild) throw Error('raw native images do not use the DOS build path');
  const target = variant === '80386' ? '8086' : variant;
  const directory = runtimeBuild ? path.join(projectDirectory, '.build', target + '-absent') : projectDirectory;
  return {
    runnerKind: raw ? 'native-i80386-raw' : variant === '80386' ? 'native-i80386-dos-shim' : 'dos',
    variant, fpu: 'absent',
    build: runtimeBuild ? {command: 'sh', args: [path.join(projectDirectory, relativeFile(runtimeBuild.script)), target, 'absent', directory]} : null,
    run: {command: process.execPath, args: [fileURLToPath(new URL('./run.mjs', import.meta.url)),
      '--board', board, '--project', directory, '--variant', variant, '--max', String(max)]},
  };
}
export async function runBenchmarkPlan(plan, {spawnProcess = spawn, buildOutput = bytes => process.stderr.write(bytes)} = {}) {
  const execute = (step, build) => new Promise((resolve, reject) => {
    const child = spawnProcess(step.command, step.args, {stdio: build ? ['ignore', 'pipe', 'inherit'] : 'inherit'});
    if (build) child.stdout.on('data', buildOutput);
    child.once('error', reject);
    child.once('close', code => resolve(code ?? 1));
  });
  if (plan.build && await execute(plan.build, true) !== 0) throw Error('declared benchmark build failed; no guest run');
  return execute(plan.run, false);
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  try {
    const options = parseEnsureArgs(process.argv.slice(2));
    if (options.help) process.stdout.write(usage + '\n');
    else {
      if (options.run) {
        try { await fs.access(path.join(options.board, 'src/i8086-dos.js')); }
        catch { throw Error('bw-board checkout not found; check --board or BW_BOARD_DIR'); }
      }
      const result = await ensureBenchmark({project: options.project, ref: options['media-ref'], cache: options.cache,
        onNotice: notice => process.stderr.write(notice + '\n')});
      if (!options.run) process.stdout.write(JSON.stringify(result) + '\n');
      else process.exitCode = await runBenchmarkPlan(await createBenchmarkRunPlan({...result,
        board: options.board, variant: options.variant, max: options.max}));
    }
  } catch (error) { console.error('benchmark: ' + error.message); process.exitCode = 1; }
}
