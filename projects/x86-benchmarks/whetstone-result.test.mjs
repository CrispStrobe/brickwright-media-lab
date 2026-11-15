import test from 'node:test';
import assert from 'node:assert/strict';
import {whetstoneResult} from './whetstone-result.mjs';
const rows=[
 '0 0 0 1 -1 -1 -1','12 14 12 -.066821 -.46627 -.73298 -1.1324',
 '14 12 12 -.065513 -.46469 -.73107 -1.1303','345 0 0 1 -1 -1 -1',
 '210 1 2 6 6 -.73107 -1.1303','32 1 2 .49904 .49904 .49902 .49902',
 '899 1 2 1 1 .99994 .99994','616 1 2 3 2 3 -1.1303',
 '0 2 3 1 -1 -1 -1','93 2 3 .75987 .75987 .75987 .75987'];
const output=rows.join('\n')+'\nLoops: 1, Iterations: 1, Duration: 23 sec.\nC Converted Double Precision Whetstones: 4.3 KIPS\n';
test('complete numeric modules plus positive duration and score are required',()=>{
 assert.equal(whetstoneResult(output).valid,true);
 for(const altered of [output.replace('23 sec.','0 sec.'),output.replace('4.3 KIPS','0.0 KIPS'),
 output.replace(rows[2],'14 12 12 e e e e'),output.replace(rows[9],''),
 output.replace(rows[9],'93 2 3 .9 .9 .9 .9'),rows.join('\n')+'\nInsufficient duration- Increase the LOOP count\n'])
  assert.equal(whetstoneResult(altered).valid,false);
});
