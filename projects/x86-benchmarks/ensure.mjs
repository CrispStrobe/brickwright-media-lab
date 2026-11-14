#!/usr/bin/env node
// MIT. Runtime asset fetch/cache, never linked into the emulator/app build.
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {createHash} from 'node:crypto';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {spawn} from 'node:child_process';
const digest=b=>createHash('sha256').update(b).digest('hex');
export async function ensureBenchmark({project,ref,cache=path.join(process.env.XDG_CACHE_HOME||path.join(os.homedir(),'.cache'),'brickwright','x86-benchmarks'),onNotice=()=>{},fetcher=fetch}){
 if(!['topbench','native-sieve','whetstone'].includes(project)||!/^\w{40}$/.test(ref)||!/^[0-9a-f]{40}$/.test(ref))throw Error('choose a registered project and full immutable media-lab commit');
 const base=`https://raw.githubusercontent.com/CrispStrobe/brickwright-media-lab/${ref}/projects/x86-benchmarks/${project}/`;
 const dest=path.join(cache,ref,project);await fs.mkdir(dest,{recursive:true});
 async function get(name,sha){
  if(name.startsWith('/')||name.split('/').some(p=>p==='..'||p===''||p==='.')||name.includes('\\'))throw Error('unsafe cache path');
  const target=path.join(dest,name);
  try{const bytes=await fs.readFile(target);if(sha&&digest(bytes)===sha)return bytes;}catch(e){if(e.code!=='ENOENT')throw e;}
  const response=await fetcher(base+name);if(!response.ok)throw Error(`download ${name}: HTTP ${response.status}`);
  const bytes=Buffer.from(await response.arrayBuffer());if(sha&&digest(bytes)!==sha)throw Error('download digest mismatch: '+name);
  await fs.mkdir(path.dirname(target),{recursive:true});
  const temp=target+'.new-'+process.pid;await fs.writeFile(temp,bytes,{flag:'wx'});await fs.rename(temp,target);return bytes;
 }
 // The full immutable Git revision is the metadata pin; file hashes pin payloads.
 const proof=JSON.parse((await get('assets.json')).toString());
 const notice=await get('LICENSE',proof.files.LICENSE.sha256);await onNotice(notice.toString());
 const rows=await Promise.allSettled(Object.entries(proof.files).map(([name,item])=>get(name,item.sha256).then(b=>{if(b.length!==item.bytes)throw Error('byte count mismatch: '+name);})));for(const row of rows)if(row.status==='rejected')throw row.reason;
 await get('brickwright-media.json');
 return {projectDirectory:dest,mediaCommit:ref,assetCount:rows.length,licenseSha256:proof.files.LICENSE.sha256};
}
if(import.meta.url===pathToFileURL(process.argv[1]||'').href){
 const args=process.argv.slice(2),o={};let run=false;
 for(let i=0;i<args.length;i++){if(args[i]==='--run'){run=true;continue;}if(!['--project','--media-ref','--cache','--board','--variant','--max'].includes(args[i])||!args[i+1])throw Error('usage: ensure.mjs --project NAME --media-ref FULL_SHA [--cache DIR] [--run --board DIR --variant CPU]');o[args[i].slice(2)]=args[++i];}
 const result=await ensureBenchmark({project:o.project,ref:o['media-ref'],cache:o.cache,onNotice:notice=>process.stderr.write(notice+'\n')});
 if(!run){process.stdout.write(JSON.stringify(result)+'\n');}
 else{
  const child=spawn(process.execPath,[fileURLToPath(new URL('./run.mjs',import.meta.url)),'--board',o.board||process.env.BW_BOARD_DIR,'--project',result.projectDirectory,'--variant',o.variant||'80386','--max',o.max||'20000000'],{stdio:'inherit'});
  child.on('error',e=>{console.error(e.message);process.exitCode=1;});child.on('exit',code=>{process.exitCode=code??1;});
 }
}
