import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {initializeNativeDosClock,adaptNativeDosService,biosClockPorts} from './native-dos.mjs';
const root=process.env.BW_BOARD_DIR;
if(!root)throw Error('BW_BOARD_DIR must name the committed native i80386 checkout');
const {ExperimentalI80386ATMachine:Machine,PCAT80386_EXPERIMENTAL:base}=await import(pathToFileURL(path.join(root,'src/experimental/i80386-at-machine.js')));
const {createDos8086,trapRegion}=await import(pathToFileURL(path.join(root,'src/i8086-dos.js')));
function fixture(clock){
 const m=new Machine({...base,regions:[...base.regions,trapRegion()]});m.cpu.reset();
 if(clock)initializeNativeDosClock(m);
 const dos=createDos8086(m).install();const bridge=adaptNativeDosService(m,dos);
 return {m,dos,bridge};
}
test('actual native timer-wait program needs initialized PIC/PIT and exits after real IRQ0 ticks',()=>{
 // MOV AX,40h; MOV ES,AX; MOV AX,ES:[6Ch]; CMP AX,ES:[6Ch]; JE back;
 // MOV AX,4C00h; INT21h. No host-side tick writes or benchmark substitution.
 const code=Uint8Array.from([0xb8,0x40,0,0x8e,0xc0,0x26,0xa1,0x6c,0,0x26,0x3b,0x06,0x6c,0,0x74,0xf9,0xb8,0,0x4c,0xcd,0x21]);
 for(const clock of [false,true]){
  const {m,dos,bridge}=fixture(clock);dos.loadCom(code);bridge.syncSegments();
  const result=dos.run(80000);
  assert.equal(result.terminated,clock);
  if(clock){assert.equal(result.exitCode,0);assert.ok(m._read(0x46c)>1);assert.equal(m.chips.pic1.vectorBase,8);}
  else assert.equal(m._read(0x46c),0);
 }
});
test('native service restores actual caller FLAGS instead of the 8086 forced F000 bits',()=>{
 const {m,dos,bridge}=fixture(false);
 dos.loadCom(Uint8Array.from([0xb8,0,0x30,0xcd,0x21,0xf4]));bridge.syncSegments();
 while(!m.cpu.halted)dos.step();
 assert.equal(m.cpu.flags&0xf000,0);assert.equal(m.cpu.ax,5);
});
test('clock contract retains explicit port initialization and refuses protected-mode setup',()=>{
 const {m}=fixture(false);assert.deepEqual(biosClockPorts.slice(-2),[[0x43,0x54],[0x41,18]]);
 m.cpu.cr0=1;assert.throws(()=>initializeNativeDosClock(m),/real-mode/);
});

test('declared text geometry prevents the observed native DIV BL zero fault',()=>{
 const {m,dos,bridge}=fixture(true);
 // ES=40h; BX=columns; AX=page bytes; SHR AX,1; DIV BL; exit.
 dos.loadCom(Uint8Array.from([0xb8,0x40,0,0x8e,0xc0,0x26,0x8b,0x1e,0x4a,0,0x26,0xa1,0x4c,0,0xd1,0xe8,0xf6,0xf3,0xb8,0,0x4c,0xcd,0x21]));
 bridge.syncSegments();assert.equal(dos.run(100).exitCode,0);
 assert.equal(m._read(0x44a),80);assert.equal(m._read(0x484),24);
});
test('only declared console AX4400 requests are handled; unknown requests remain visible',()=>{
 for(const [ax,handle,accepted] of [[0x4400,0,true],[0x4400,1,true],[0x4400,2,true],[0x4400,3,false],[0x4401,1,false]]){
  const {m,dos,bridge}=fixture(false);
  dos.loadCom(Uint8Array.from([0xb8,ax&255,ax>>8,0xbb,handle,0,0xcd,0x21,0xf4]));bridge.syncSegments();
  while(!m.cpu.halted)dos.step();
  assert.equal(bridge.handled.length,accepted?1:0);
  assert.equal(dos.report().unsupported.length,accepted?0:1);
  assert.equal(m.cpu.flags&1,accepted?0:1);
  if(accepted)assert.equal(m.cpu.dx,handle===0?0x81:0x82);
 }
});
