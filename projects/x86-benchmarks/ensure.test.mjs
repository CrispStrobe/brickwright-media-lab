import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {ensureBenchmark} from './ensure.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
const ref='a'.repeat(40),license=Buffer.from('MIT license test fixture\n'),exe=Buffer.from('guest bytes');
function fixtures(extra={}){
 return {'assets.json':Buffer.from(JSON.stringify({files:{LICENSE:{sha256:sha(license),bytes:license.length},'SIEVE.BIN':{sha256:sha(exe),bytes:exe.length},...extra}})),'LICENSE':license,'SIEVE.BIN':exe,'brickwright-media.json':Buffer.from('{}')};
}
async function temporary(fn){const root=await fs.mkdtemp(path.join(process.env.TEST_TMPDIR||os.tmpdir(),'x86-cache-test-'));try{await fn(root);}finally{await fs.rm(root,{recursive:true,force:true});}}
function fetcher(files,calls){return async url=>{const name=url.split('/native-sieve/')[1];calls.push(name);const b=files[name];return new Response(b||'',{status:b?200:404});};}
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
