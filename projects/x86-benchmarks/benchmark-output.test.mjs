import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {collectBenchmarkOutput} from './benchmark-output.mjs';
const raw=JSON.parse(fs.readFileSync(new URL('./results/v3/topbench-native-terminal.json',import.meta.url)));
test('retained actual TOPBENCH CRT output is collected from screen; invalid rows refuse numeric admission',()=>{
 const {stdout,screen}=raw.semantic,manifest={resultOutput:'screen'};
 const result=collectBenchmarkOutput(manifest,stdout,screen);
 assert.equal(stdout,'');assert.equal(result.scoresValid,true);
 assert.equal(result.scores.Score,19);assert.equal(result.scores.Memory,923);
 assert.equal(collectBenchmarkOutput({},stdout,screen).scoresValid,false);
 for(const value of ['NaN','Infinity','-1','0','nonsense']){
  const altered=screen.map(line=>line.startsWith('Memory:')?'Memory: '+value:line);
  assert.equal(collectBenchmarkOutput(manifest,stdout,altered).scoresValid,false);
 }
 assert.equal(collectBenchmarkOutput(manifest,stdout,screen.filter(line=>!line.startsWith('Score:'))).scoresValid,false);
 assert.throws(()=>collectBenchmarkOutput({resultOutput:'invented'},stdout,screen),/unsupported result output/);
 // Collection is not a success verdict: real video-query errors are retained.
 assert.equal(raw.success,false);assert.equal(raw.semantic.dos.unsupported.length,3);
});
