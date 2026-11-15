// MIT: asset/notice admission only; never claims guest execution.
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url));
for(const name of ['topbench','whetstone']){
 const p=path.join(root,name),a=JSON.parse(fs.readFileSync(path.join(p,'assets.json')));
 for(const [file,item] of Object.entries(a.files)){
  const b=fs.readFileSync(path.join(p,file));
  if(b.length!==item.bytes||createHash('sha256').update(b).digest('hex')!==item.sha256)throw Error('asset mismatch: '+name+'/'+file);
 }
 if(name==='whetstone'){
  const source=fs.readFileSync(path.join(p,'source/whetstone.c'),'utf8');
  const notice=source.slice(0,source.indexOf('*/')+2)+'\n';
  if(notice!==fs.readFileSync(path.join(p,'LICENSE'),'utf8'))throw Error('entire permission/comment block must be retained');
 }
 console.log('ASSET PROOF PASS '+name+'; guest execution is separate');
}
