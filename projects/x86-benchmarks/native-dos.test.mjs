import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {initializeNativeDosClock,adaptNativeDosService,biosClockPorts,validateNativeCgaQueries} from './native-dos.mjs';
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

function videoQuery(ax,bx,{vga=false,protectedMode=false}={}){
 const {m,dos,bridge}=fixture(false);
 if(vga)m.config={...m.config,chips:[{kind:'vga'}]};
 // Load distinctive caller registers, call INT10, then HLT. Observe actual
 // native instruction execution, service IRET and the guest-visible returns.
 const code=[0xb8,ax&255,ax>>8,0xbb,bx&255,bx>>8,
  0xb9,0xff,0xff,0xba,0x76,0x36,0xbd,0xfa,0x1f,0xcd,0x10,0xf4];
 dos.loadCom(Uint8Array.from(code));bridge.syncSegments();
 for(let i=0;i<6;i++)dos.step();
 const before={ax:m.cpu.ax,bx:m.cpu.bx,cx:m.cpu.cx,dx:m.cpu.dx,es:m.cpu.es,bp:m.cpu.bp};
 if(protectedMode)m.cpu.cr0=1;
 if(protectedMode){assert.throws(()=>dos.step(),/protected-mode/);return;}
 while(!m.cpu.halted)dos.step();
 return {m,dos,bridge,before};
}
test('observed CGA video probes return real negative capability responses without claiming VGA/EGA/font data',()=>{
 for(const [ax,bx] of [[0x1130,0xb1],[0x1a00,0x1fba],[0x12db,0x1f10],[0x12b5,0x2110],[0x1200,0xff10]]){
  const {m,dos,bridge,before}=videoQuery(ax,bx);
  assert.deepEqual(Object.fromEntries(Object.keys(before).map(k=>[k,m.cpu[k]])),before);
  assert.equal(dos.report().unsupported.length,0);
  assert.equal(bridge.handled.length,1);assert.equal(bridge.handled[0].outcome,'absent-on-cga');
  assert.deepEqual(bridge.handled[0].request,before);assert.deepEqual(bridge.handled[0].response,before);
  assert.equal(m.cpu.segmentCaches[0].base,m.cpu.es<<4);
  assert.equal(m.cpu.flags&0xf000,0);
 }
});
test('other font selectors, setters and EGA subfunctions stay unsupported; CGA absence cannot qualify a VGA board',()=>{
 for(const [ax,bx,options] of [[0x1130,0x100,{}],[0x1131,0,{}],[0x1a01,0,{}],[0x1200,0x20,{}],
  [0x1130,0,{vga:true}],[0x1a00,0,{vga:true}],[0x1200,0x10,{vga:true}]]){
  const {dos,bridge}=videoQuery(ax,bx,options);
  assert.equal(bridge.handled.length,0);assert.equal(dos.report().unsupported.length,1);
 }
 videoQuery(0x1130,0,{protectedMode:true});
});

test('terminal query gate rejects missing, mutated, extra and feature-positive responses',()=>{
 const sequence=[[0x1130,0xb1],[0x1a00,0x1fba],[0x12db,0x1f10],[0x1a00,0x213e],[0x12b5,0x2110]];
 const handled=sequence.flatMap(([ax,bx])=>videoQuery(ax,bx).bridge.handled);
 assert.equal(validateNativeCgaQueries(handled),true);
 for(const change of [items=>items.pop(),items=>items.push(items[0]),
  items=>items[1].response.ax=0x1a1a,items=>items[2].response.bx=0,
  items=>items[0].outcome='supported',items=>items[0].request.bx=0x100]){
  const copy=structuredClone(handled);change(copy);assert.equal(validateNativeCgaQueries(copy),false);
 }
});
