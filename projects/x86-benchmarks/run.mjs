#!/usr/bin/env node
// Benchmark driver only. Assets stay in media-lab; no guest OS or extender.
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL, fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import os from 'node:os';
import {collectBenchmarkOutput} from './benchmark-output.mjs';
import {whetstoneResult} from './whetstone-result.mjs';
import {initializeNativeDosClock,adaptNativeDosService} from './native-dos.mjs';
const started=process.hrtime.bigint();
const sha=b=>createHash('sha256').update(b).digest('hex');
const opts={variant:'80386',max:20000000};
for(let i=2;i<process.argv.length;i+=2){
  const k=process.argv[i],v=process.argv[i+1];
  if(!['--board','--project','--variant','--max'].includes(k)||!v)throw Error('usage: run.mjs --board BOARD --project PROJECT --variant 80386|80286|80186|8086 --max N');
  opts[k.slice(2)]=v;
}
const board=path.resolve(opts.board||process.env.BW_BOARD_DIR||'../bw-board');
const project=path.resolve(opts.project||path.join(path.dirname(fileURLToPath(import.meta.url)),'topbench'));
const variant=opts.variant,max=Number(opts.max);
if(!['80386','80286','80186','8086'].includes(variant)||!Number.isSafeInteger(max)||max<1)throw Error('invalid variant/budget');
const manifest=JSON.parse(fs.readFileSync(path.join(project,'brickwright-media.json')));
const proof=JSON.parse(fs.readFileSync(path.join(project,'assets.json')));
const isRaw=manifest.kind==='native-i80386-raw';
if(isRaw&&variant!=='80386')throw Error('raw native i80386 image cannot run on the DOS path');
const rel=manifest.slots.raw||manifest.slots.exe||manifest.slots.com;
const program=fs.readFileSync(path.join(project,rel));
if(sha(program)!==proof.files[rel].sha256)throw Error('benchmark binary SHA mismatch');
for(const [name,item] of Object.entries(proof.files))if(sha(fs.readFileSync(path.join(project,name)))!==item.sha256)throw Error('asset mismatch: '+name);
const git=(...args)=>execFileSync('git',['-C',board,...args],{encoding:'utf8',maxBuffer:16<<20}).trim();
const revision=git('rev-parse','HEAD');
const sourceSha256={};
function collect(rel){
 rel=path.normalize(rel).replaceAll('\\','/');if(sourceSha256[rel])return;
 const bytes=fs.readFileSync(path.join(board,rel));
 const committed=execFileSync('git',['-C',board,'show',revision+':'+rel],{maxBuffer:16<<20});
 if(!bytes.equals(committed))throw Error('uncommitted runtime: '+rel);
 sourceSha256[rel]=sha(bytes);
 if(/\.m?js$/.test(rel))for(const m of bytes.toString().matchAll(/(?:from\s*|import\s*\(|import\s*)['"](\.[^'"]+)['"]/g))collect(path.join(path.dirname(rel),m[1]));
}
collect('src/i8086-dos.js');collect(variant==='80386'?'src/experimental/i80386-at-machine.js':'scripts/run-dos.mjs');
const runnerSha256=sha(fs.readFileSync(fileURLToPath(import.meta.url)));
let m,d,result,error=null,stdout='',calls=0,config=null,coreStart=0;
const serial=[];
let execution=null,nativeStartup=null,nativeBridge=null;
const beginExecution=()=>({wall:process.hrtime.bigint(),cpu:process.cpuUsage()});
const endExecution=start=>{const used=process.cpuUsage(start.cpu);execution={cpuSeconds:(used.user+used.system)/1e6,wallSeconds:Number(process.hrtime.bigint()-start.wall)/1e9,includesLoader:variant!=='80386'};};
const imported=async file=>import(pathToFileURL(path.join(board,file)));
try{
 if(variant==='80386'){
  const {ExperimentalI80386ATMachine,PCAT80386_EXPERIMENTAL}=await imported('src/experimental/i80386-at-machine.js');
  const {createDos8086,trapRegion}=await imported('src/i8086-dos.js');
  config=isRaw?PCAT80386_EXPERIMENTAL:{...PCAT80386_EXPERIMENTAL,regions:[...PCAT80386_EXPERIMENTAL.regions,trapRegion()]};
  m=new ExperimentalI80386ATMachine(config,{onSerial:b=>{serial.push(b);}});m.cpu.reset();
  if(isRaw){
   const load=manifest.loadAddress,entry=manifest.entry;
   if(!Number.isSafeInteger(load)||load<0||load+program.length>0xa0000||entry<load||entry>=load+program.length)throw Error('raw load/entry outside fixed conventional RAM');
   for(let i=0;i<program.length;i++)m._write386(load+i,program[i]);
   const c=m.cpu;c.cr0=1;c.cs=8;c.ss=c.ds=c.es=c.fs=c.gs=16;
   for(let id=0;id<6;id++)c.segmentCaches[id]={base:0,limit:0xffffffff,default32:true,present:true,code:id===1,readable:true,writable:id!==1};
   c.eip=entry;c.esp=manifest.stack;c.eflags=2;coreStart=c.cycles;
   const measured=beginExecution();
   while(!c.halted&&calls<max){m.step();calls++;if(c.shutdown)throw Error('native core shutdown');}
   endExecution(measured);
   stdout=Buffer.from(serial).toString('latin1');
   result={terminated:c.halted,exitCode:null,steps:calls,exhausted:!c.halted};
  }else{

  d=createDos8086(m,{files:new Map(Object.entries(manifest.mount||{}).map(([n,f])=>[n,fs.readFileSync(path.join(project,f))]))}).install();
  nativeStartup=initializeNativeDosClock(m);
  nativeBridge=adaptNativeDosService(m,d);
  if(manifest.slots.com)d.loadCom(program,{at:0x0800,args:manifest.program.args||''});
  else d.loadExe(program,{at:0x0800,args:manifest.program.args||''});
  nativeBridge.syncSegments();
  coreStart=m.cpu.cycles;
  const measured=beginExecution();
  while(!d.terminated&&calls<max){d.step();calls++;if(m.cpu.shutdown)throw Error('native core shutdown');}
  endExecution(measured);
  result={terminated:d.terminated,exitCode:d.exitCode,steps:calls,exhausted:!d.terminated};
  }
 }else{
  const {runDos}=await imported('scripts/run-dos.mjs');
  const measured=beginExecution();
  const r=runDos({program:path.join(project,rel),variant,preset:manifest.program.preset,max,args:manifest.program.args||'',files:Object.entries(manifest.mount||{}).map(([n,f])=>n+'='+path.join(project,f))},{write:s=>{stdout+=s;}});
  endExecution(measured);
  ({machine:m,dos:d,result}=r);config=m.config;
 }
}catch(e){error={name:e.name,message:e.message};}
if(d)stdout=d.stdout;
const cpu=m?.cpu;
const cpuState=cpu?Object.fromEntries(['ax','bx','cx','dx','si','di','bp','sp','cs','ds','es','ss','ip','flags','eip','eflags','cr0','cr3','cr4'].filter(k=>typeof cpu[k]==='number').map(k=>[k,cpu[k]])):null;
const report=d?.report()||null;
const collected=collectBenchmarkOutput(manifest,stdout,d?.screenText()||[]);
const benchmarkText=collected.text,scores=collected.scores;
const whetstone=proof.sourceSha256==='333e4ceca042c146f63eec605573d16ae8b07166cbc44a17bec1ea97c6f1efbf'?whetstoneResult(stdout):null;
const success=isRaw?(!error&&result?.terminated&&stdout===manifest.expectedOutput):(!error&&(manifest.resultOutput!=='screen'||collected.scoresValid)&&(!whetstone||whetstone.valid)&&result?.terminated&&manifest.expectedExitCodes.includes(result.exitCode)&&!report?.stdoutTruncated&&!report?.unsupported.length&&(manifest.expect||[]).every(s=>benchmarkText.includes(s)));
const deviceState=m?Object.fromEntries(Object.entries(m.chips).map(([name,part])=>[name,typeof part.getState==='function'?part.getState():{captureUnavailable:true}])):null;
const semantic={resultOutput:manifest.resultOutput||'stdout',whetstone,nativeStartup,handledServices:nativeBridge?.handled??[],deviceState,segmentCaches:cpu?.segmentCaches??null,gdtr:cpu?.gdtr??null,idtr:cpu?.idtr??null,halted:cpu?.halted??null,shutdown:cpu?.shutdown??null,status:success?'pass':error?'error':result?.terminated?'terminal-unqualified':'incomplete',error,result,stdout,screen:d?.screenText()||[],serial,dos:report,cpu:cpuState,instructionSnapshot:cpu?._snapshotInstruction?.()??null,chipDebt:m?._chipDebt??null,chipDeadline:m?._chipDeadline??null,ramSha256:m?sha(m.mem):null,machineCycles:m?.cycles??null,guestInstructions:variant==='80386'&&cpu?cpu.cycles-coreStart:null};
const used=process.cpuUsage();
const record={schema:'brickwright.x86-benchmark-run.v2',benchmark:manifest.title,version:proof.version,variant,backend:variant==='80386'?'native i80386 core (ExperimentalI80386ATMachine; ordinary step)':'run-dos '+variant,emulatorCommit:revision,runner:{node:process.version,platform:process.platform,arch:process.arch,cpuModel:os.cpus()[0]?.model,logicalCpus:os.cpus().length,sha256:runnerSha256,dependencies:Object.fromEntries(['native-dos.mjs','whetstone-result.mjs','benchmark-output.mjs'].map(name=>[name,sha(fs.readFileSync(new URL(name,import.meta.url)))])),mediaLabCommit:execFileSync('git',['-C',path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..'),'rev-parse','HEAD'],{encoding:'utf8'}).trim()},benchmarkSha256:sha(program),assetProof:proof,sourceSha256,configuration:{preset:variant==='80386'?(isRaw?'PCAT80386_EXPERIMENTAL':'PCAT80386_EXPERIMENTAL + 1KiB DOS trap RAM'):manifest.program.preset,clockHz:m?.clockHz??config?.clockHz,memoryBytes:m?.memoryBytes,config,video:isRaw?'none (serial output)':'B800 text capture; no ROM',fpu:'absent',dosImage:null,biosImage:null,extender:null,loader:variant==='80386'?(isRaw?'owned fixed-address raw32 loader; seeded flat segments; guest start.S + serial output':'createDos8086 MZ loader, PSP=0800h, image=0810h; native-dos.mjs PIC/PIT + text BDA + segment/FLAGS adapter'):'scripts/run-dos.mjs MZ loader',command:rel+' '+(manifest.program?.args||''),loadAddress:isRaw?manifest.loadAddress:null,entry:isRaw?manifest.entry:null,maxProgressSteps:max,guestInstructionCountNote:variant==='80386'?'native CPU cycles counter counts interpreter instruction retirements; machine cycles are functional scheduling charges':'not exposed by runDos; result.steps includes DOS service transitions'},host:{cpuSeconds:(used.user+used.system)/1e6,wallSeconds:Number(process.hrtime.bigint()-started)/1e9,maxRssKiB:process.resourceUsage().maxRSS},execution,benchmarkScore:scores,semantic,success};
await new Promise(resolve=>process.stdout.write(JSON.stringify(record)+'\n',resolve));
process.exitCode=success?0:2;
