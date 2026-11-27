// MIT: asset/notice admission only; never claims guest execution.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
for(const name of ['topbench','whetstone','whetstone-validation']){
 const p=path.join(root,name),a=JSON.parse(fs.readFileSync(path.join(p,'assets.json')));
 for(const [file,item] of Object.entries(a.files)){
  const b=fs.readFileSync(path.join(p,file));
  if(b.length!==item.bytes||createHash('sha256').update(b).digest('hex')!==item.sha256)throw Error('asset mismatch: '+name+'/'+file);
 }
 if(name==='whetstone'||name==='whetstone-validation'){
  const source=fs.readFileSync(path.join(p,'source/whetstone.c'),'utf8');
  const notice=source.slice(0,source.indexOf('*/')+2)+'\n';
  if(notice!==fs.readFileSync(path.join(p,'LICENSE'),'utf8'))throw Error('entire permission/comment block must be retained');
 }
 if(name==='whetstone-validation'){
  if(a.files['WHT.EXE']?.sha256!=='f7003e37da058b1a41b8520b010c9791aafa10fa8a9cb11a4c0998055936b8ac')throw Error('qualified validation image identity changed');
  const provenance=JSON.parse(fs.readFileSync(path.join(p,'runtime-provenance.json')));
  const members=JSON.parse(fs.readFileSync(path.join(p,'runtime-members.json')));
  if(provenance.linkedMemberCount!==139||members.length!==139)throw Error('linked-member inventory incomplete');
  if(new Set(members.map(item=>item.archive+'/'+item.member)).size!==139)throw Error('duplicate linked member');
  for(const member of members)if(!/^[0-9a-f]{64}$/.test(member.memberSha256)||!/^[0-9a-f]{64}$/.test(member.source?.sha256)||!member.sourceOrIncludedNoticeFiles.length)throw Error('unbound member source/notice');
  if(!fs.readFileSync(path.join(p,'RUNTIME-NOTICES.txt'),'utf8').includes('This product includes software developed by the University of California, Berkeley and its contributors.'))throw Error('Berkeley acknowledgment missing');
 }
 console.log('ASSET PROOF PASS '+name+'; guest execution is separate');
}
