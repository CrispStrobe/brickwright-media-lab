import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {EventEmitter} from 'node:events';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {ensureBenchmark, parseEnsureArgs, createBenchmarkRunPlan, runBenchmarkPlan} from './ensure.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
const ref='a'.repeat(40),license=Buffer.from('MIT license test fixture\n'),exe=Buffer.from('guest bytes');
function fixtures(extra={}){
 return {'assets.json':Buffer.from(JSON.stringify({files:{LICENSE:{sha256:sha(license),bytes:license.length},'SIEVE.BIN':{sha256:sha(exe),bytes:exe.length},...extra}})),'LICENSE':license,'SIEVE.BIN':exe,'brickwright-media.json':Buffer.from('{}')};
}
async function temporary(fn){const root=await fs.mkdtemp(path.join(process.env.TEST_TMPDIR||os.tmpdir(),'x86-cache-test-'));try{await fn(root);}finally{await fs.rm(root,{recursive:true,force:true});}}
function fetcher(files,calls,project='native-sieve'){return async url=>{const name=url.split('/'+project+'/')[1];calls.push(name);const b=files[name];return new Response(b||'',{status:b?200:404});};}
test('runtime ensure displays the verified notice, reuses verified metadata/payloads offline and never invokes a host executable',async()=>temporary(async cache=>{
 const files=fixtures(),calls=[],notices=[];
 const a=await ensureBenchmark({project:'native-sieve',ref,cache,onNotice:n=>notices.push(n),fetcher:fetcher(files,calls)});
 assert.equal((await fs.readFile(path.join(a.projectDirectory,'SIEVE.BIN'))).toString(),exe.toString());
 const first=calls.filter(n=>n==='SIEVE.BIN').length;
 await ensureBenchmark({project:'native-sieve',ref,cache,onNotice:n=>notices.push(n),fetcher:async()=>{throw Error('offline cache must not fetch');}});
 assert.equal(calls.filter(n=>n==='SIEVE.BIN').length,first);assert.deepEqual(notices,[license.toString(),license.toString()]);
}));
test('changed download bytes fail hash admission',async()=>temporary(async cache=>{
 const f=fixtures();f['SIEVE.BIN']=Buffer.from('wrong guest');
 await assert.rejects(ensureBenchmark({project:'native-sieve',ref,cache,fetcher:fetcher(f,[])}),/digest mismatch/);
}));
test('manifest paths cannot escape the user cache',async()=>temporary(async cache=>{
 const f=fixtures({'../escape':{sha256:sha(exe),bytes:exe.length}});
 await assert.rejects(ensureBenchmark({project:'native-sieve',ref,cache,fetcher:fetcher(f,[])}),/unsafe cache path/);
}));

test('CLI validates consumer choices before downloading or building',()=>{
 const base=['--project','native-sieve','--media-ref',ref,'--run'];
 assert.throws(()=>parseEnsureArgs(base,{}),/requires --board/);
 assert.throws(()=>parseEnsureArgs([...base,'--board','board','--variant','8086'],{}),/native 80386/);
 assert.throws(()=>parseEnsureArgs([...base,'--board','board','--max','NaN'],{}),/invalid variant or instruction budget/);
 assert.throws(()=>parseEnsureArgs([...base,'--board','board','--max','-1'],{}),/invalid variant or instruction budget/);
 assert.throws(()=>parseEnsureArgs([...base,'--board','board','--board','other'],{}),/duplicate option/);
 assert.throws(()=>parseEnsureArgs(['--project','--run'],{}),/usage:/);
 assert.deepEqual(parseEnsureArgs(['--help'],{}),{help:true});
 assert.equal(parseEnsureArgs(base,{BW_BOARD_DIR:'installed-board'}).board,'installed-board');
});

async function manifestAt(directory, manifest){
 await fs.writeFile(path.join(directory,'brickwright-media.json'),JSON.stringify(manifest));
}
const rawManifest={kind:'native-i80386-raw',machine:'i80386-experimental',format:'raw32',fpu:'absent'};
const dosManifest={program:{kind:'dos',tool:'run-dos'}};
const validationDirectory=fileURLToPath(new URL('./whetstone-validation/',import.meta.url));
const nativeDosManifest=JSON.parse(await fs.readFile(path.join(validationDirectory,'brickwright-media.json'),'utf8'));
test('consumer plan selects native raw, native DOS shim and legacy DOS explicitly',async()=>temporary(async projectDirectory=>{
 await manifestAt(projectDirectory,rawManifest);
 const raw=await createBenchmarkRunPlan({projectDirectory,board:'board',variant:'80386',max:123});
 assert.equal(raw.runnerKind,'native-i80386-raw');assert.equal(raw.build,null);
 assert.equal(raw.run.args[raw.run.args.indexOf('--board')+1],path.resolve('board'));
 assert.deepEqual(raw.run.args.slice(-4),['--variant','80386','--max','123']);
 await assert.rejects(createBenchmarkRunPlan({projectDirectory,board:'board',variant:'8086'}),/cannot run on the DOS path/);
 await manifestAt(projectDirectory,dosManifest);
 assert.equal((await createBenchmarkRunPlan({projectDirectory,board:'board',variant:'80286'})).runnerKind,'dos');
 const native=await createBenchmarkRunPlan({projectDirectory,board:'board',variant:'80386',runtimeBuild:{script:'build.sh'}});
 assert.equal(native.runnerKind,'native-i80386-dos-shim');
 assert.equal(native.fpu,'absent');assert.deepEqual(native.build.args.slice(1,3),['8086','absent']);
 await assert.rejects(createBenchmarkRunPlan({projectDirectory,board:'board',runtimeBuild:{script:'../escape.sh'}}),/unsafe cache path/);
}));
test('consumer rejects OS media and unsupported native formats rather than falling back',async()=>temporary(async projectDirectory=>{
 await manifestAt(projectDirectory,{machine:'i80386',slots:{floppy:'os.img'}});
 await assert.rejects(createBenchmarkRunPlan({projectDirectory,board:'board'}),/unsupported benchmark consumer manifest/);
 await manifestAt(projectDirectory,{...rawManifest,fpu:'present'});
 await assert.rejects(createBenchmarkRunPlan({projectDirectory,board:'board'}),/unsupported native benchmark manifest/);
}));
test('qualified Whetstone assets cache offline and produce a native DOS plan without a build',async()=>temporary(async cache=>{
 const files={'assets.json':await fs.readFile(path.join(validationDirectory,'assets.json'))};
 const proof=JSON.parse(files['assets.json']);
 for(const name of Object.keys(proof.files))files[name]=await fs.readFile(path.join(validationDirectory,name));
 const calls=[],notices=[];
 const result=await ensureBenchmark({project:'whetstone-validation',ref,cache,
  onNotice:notice=>notices.push(notice),fetcher:fetcher(files,calls,'whetstone-validation')});
 assert.equal(sha(await fs.readFile(path.join(result.projectDirectory,'WHT.EXE'))),'f7003e37da058b1a41b8520b010c9791aafa10fa8a9cb11a4c0998055936b8ac');
 assert.deepEqual(notices,[files.LICENSE.toString()]);
 await ensureBenchmark({project:'whetstone-validation',ref,cache,fetcher:async()=>{throw Error('offline cache must not fetch');}});
 const plan=await createBenchmarkRunPlan({...result,board:'board',variant:'80386',max:30000000});
 assert.equal(plan.runnerKind,'native-i80386-dos-shim');assert.equal(plan.build,null);
 assert.deepEqual(plan.run.args.slice(-4),['--variant','80386','--max','30000000']);
 await assert.rejects(createBenchmarkRunPlan({...result,board:'board',runtimeBuild:{script:'build.sh'}}),/qualified native DOS images do not use the DOS build path/);
}));
function directRunner(projectDirectory,variant){
 return spawnSync(process.execPath,[fileURLToPath(new URL('./run.mjs',import.meta.url)),
  '--board',path.join(projectDirectory,'engine-must-not-load'),'--project',projectDirectory,'--variant',variant],
 {encoding:'utf8',timeout:5000});
}
test('planner and direct runner refuse legacy CPUs for the qualified native DOS image',async()=>{
 for(const variant of ['8086','80186','80286']){
  await assert.rejects(createBenchmarkRunPlan({projectDirectory:validationDirectory,board:'board',variant}),/requires the native 80386 runner/);
  const result=directRunner(validationDirectory,variant);
  assert.equal(result.status,1);assert.match(result.stderr,/requires the native 80386 runner/);
  assert.doesNotMatch(result.stderr,/ENOENT|no such file/);assert.equal(result.stdout,'');
 }
});
test('planner and direct runner reject malformed native routes before reading payloads or starting a guest',async()=>temporary(async projectDirectory=>{
 const malformed=[
  {...nativeDosManifest,machine:'i8086'},
  {...nativeDosManifest,format:'raw32'},
  {...nativeDosManifest,fpu:'present'},
  {...nativeDosManifest,program:{...nativeDosManifest.program,tool:'run-dos'}},
  {...nativeDosManifest,program:{...nativeDosManifest.program,variant:'8086'}},
  {...nativeDosManifest,slots:{com:'WHT.COM'}},
  {...nativeDosManifest,slots:{...nativeDosManifest.slots,floppy:'os.img'}},
  {...nativeDosManifest,kind:'unknown-native-route',program:dosManifest.program},
  null
 ];
 for(const manifest of malformed){
  await manifestAt(projectDirectory,manifest);
  await assert.rejects(createBenchmarkRunPlan({projectDirectory,board:'board'}),/unsupported .*benchmark.*manifest/);
  const result=directRunner(projectDirectory,'80386');
  assert.equal(result.status,1);assert.match(result.stderr,/unsupported .*benchmark.*manifest/);
  assert.doesNotMatch(result.stderr,/ENOENT|no such file/);assert.equal(result.stdout,'');
 }
}));
function processDouble(exits,calls){
 return (command,args)=>{
  calls.push({command,args});const child=new EventEmitter();child.stdout=new EventEmitter();
  queueMicrotask(()=>child.emit('close',exits.shift()));return child;
 };
}
test('failed source build never launches a guest',async()=>{
 const calls=[],plan={build:{command:'sh',args:['build.sh']},run:{command:'node',args:['run.mjs']}};
 await assert.rejects(runBenchmarkPlan(plan,{spawnProcess:processDouble([7],calls)}),/build failed; no guest run/);
 assert.equal(calls.length,1);assert.equal(calls[0].command,'sh');
});
test('guest incomplete exit survives consumer invocation',async()=>{
 const calls=[],plan={build:null,run:{command:'node',args:['run.mjs']}};
 assert.equal(await runBenchmarkPlan(plan,{spawnProcess:processDouble([2],calls)}),2);
 assert.equal(calls.length,1);
});
test('concurrent consumers can populate the same immutable cache without temporary-file collisions',async()=>temporary(async cache=>{
 const f=fixtures(),fetcherWithDelay=async url=>{await new Promise(resolve=>setTimeout(resolve,2));return fetcher(f,[])(url);};
 const results=await Promise.all([1,2].map(()=>ensureBenchmark({project:'native-sieve',ref,cache,fetcher:fetcherWithDelay})));
 assert.equal(results[0].projectDirectory,results[1].projectDirectory);
 const files=await fs.readdir(results[0].projectDirectory);assert.equal(files.some(n=>n.includes('.new-')),false);
}));
test('corrupted cached payload is refused offline, then repaired only with matching bytes',async()=>temporary(async cache=>{
 const first=await ensureBenchmark({project:'native-sieve',ref,cache,fetcher:fetcher(fixtures(),[])});
 await fs.writeFile(path.join(first.projectDirectory,'SIEVE.BIN'),'corrupt');
 await assert.rejects(ensureBenchmark({project:'native-sieve',ref,cache,fetcher:async()=>{throw Error('offline');}}),/offline/);
 await ensureBenchmark({project:'native-sieve',ref,cache,fetcher:fetcher(fixtures(),[])});
 assert.deepEqual(await fs.readFile(path.join(first.projectDirectory,'SIEVE.BIN')),exe);
}));
test('actual CLI help and invalid requests neither fetch assets nor create a cache',async()=>temporary(async root=>{
 const script=new URL('./ensure.mjs',import.meta.url),cache=path.join(root,'not-created');
 const invoke=args=>spawnSync(process.execPath,[fileURLToPath(script),...args],{encoding:'utf8',timeout:5000,env:{...process.env,BW_BOARD_DIR:''}});
 const help=invoke(['--help']);assert.equal(help.status,0);assert.match(help.stdout,/usage:/);
 for(const options of [[],['--board',path.join(root,'missing')],['--board',root,'--variant','8086']]){
  const result=invoke(['--project','native-sieve','--media-ref',ref,'--run','--cache',cache,...options]);
  assert.equal(result.status,1);assert.match(result.stderr,/benchmark: /);assert.equal(result.stdout,'');
  assert.doesNotMatch(result.stderr,/at file:/);
 }
 await assert.rejects(fs.access(cache),{code:'ENOENT'});
}));
test('validation-image CLI rejects legacy variants before creating or downloading a cache',async()=>temporary(async root=>{
 const script=fileURLToPath(new URL('./ensure.mjs',import.meta.url)),cache=path.join(root,'not-created');
 for(const variant of ['8086','80286']){
  const result=spawnSync(process.execPath,[script,'--project','whetstone-validation','--media-ref',ref,
   '--run','--board',root,'--variant',variant,'--cache',cache],{encoding:'utf8',timeout:5000});
  assert.equal(result.status,1);assert.match(result.stderr,/whetstone-validation requires the native 80386 runner/);
  assert.equal(result.stdout,'');
 }
 await assert.rejects(fs.access(cache),{code:'ENOENT'});
}));
test('successful build output drains before the guest starts',async()=>{
 const order=[],plan={build:{command:'sh',args:['build.sh']},run:{command:'node',args:['run.mjs']}};
 const spawnProcess=command=>{
  order.push(command);const child=new EventEmitter();child.stdout=new EventEmitter();
  queueMicrotask(()=>{if(command==='sh')child.stdout.emit('data',Buffer.from('build receipt'));child.emit('close',command==='sh'?0:2);});
  return child;
 };
 const code=await runBenchmarkPlan(plan,{spawnProcess,buildOutput:bytes=>order.push(bytes.toString())});
 assert.equal(code,2);assert.deepEqual(order,['sh','build receipt','node']);
});
