'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const SOURCE = fs.readFileSync(path.join(__dirname, '..', 'game.js'), 'utf8');
const HOOK = 'reset();requestAnimationFrame(frame);\n})();';

function boot() {
  assert.ok(SOURCE.includes(HOOK), 'Game startup hook must remain available');
  const script = SOURCE.replace(HOOK, [
    'globalThis.__flightTest={planes,missions,career,begin,step,state,reset,render,finishMission,flightTick,takePhoto,shoot,setupMission,choose,',
    'setMission:(n)=>{selectedMission=n;setupMission()},',
    'status:()=>({grounded,crashed,missionIndex,missionStage,missionFinished,damage,bots}),',
    'camera:()=>({camEye,camTarget}),viewMatrix};',
    HOOK
  ].join(''));
  const elements = new Map();
  function element(id) {
    if (!elements.has(id)) elements.set(id, {
      id, hidden:false, disabled:false, innerHTML:'', textContent:'',
      value:({difficulty:'arcade',weather:'clear',livery:'classic'})[id]||'',
      files:[],
      style:{width:'',transform:''},
      events:{},
      classList:{add(){},remove(){},toggle(){}},
      addEventListener(type,fn){this.events[type]=fn;},
      querySelectorAll(){return[];}, setAttribute(){},setPointerCapture(){},
      getBoundingClientRect(){return{left:0,top:0,width:110,height:110};},
      click(){this.events.click?.();},remove(){},focus(){}
    });
    return elements.get(id);
  }
  const gl = new Proxy({
    getShaderParameter:()=>true,getProgramParameter:()=>true,createShader:()=>({}),createProgram:()=>({}),
    createBuffer:()=>({}),getAttribLocation:()=>0,getUniformLocation:()=>({}),getShaderInfoLog:()=>'',getProgramInfoLog:()=>''
  }, {get(obj,key){if(key in obj)return obj[key];if(typeof key==='string'&&key===key.toUpperCase())return 1;return()=>{};}});
  const canvas=element('flight');canvas.getContext=()=>gl;canvas.clientWidth=1100;canvas.clientHeight=720;
  const saved=new Map(),events={};
  const ctx={
    document:{getElementById:element,querySelectorAll:()=>[],addEventListener:(type,fn)=>{events[type]=fn;},body:{appendChild(){}}},
    window:{devicePixelRatio:1,addEventListener(){},confirm:()=>false},
    localStorage:{getItem:key=>saved.get(key)||null,setItem:(key,value)=>saved.set(key,value)},
    performance:{now:()=>0},requestAnimationFrame(){},setTimeout(){},
    Float32Array,Blob:class{},URL:{createObjectURL:()=> 'blob:test',revokeObjectURL(){}}
  };
  vm.runInNewContext(script,ctx,{filename:'game.js',timeout:3000});
  return {game:ctx.__flightTest,element,saved,events,ctx};
}

test('Game loads nine historical-inspired aircraft, six missions and menu',()=>{
 const {game,element}=boot();
 assert.equal(game.planes.length,9);
 assert.equal(game.planes.filter(p=>p.unlock).length,2);
 assert.equal(game.missions.length,6);
 assert.equal((element('missions').innerHTML.match(/class="mission-choice"/g)||[]).length,6);
});
test('WebGL frame can draw scenery, aircraft and academy markers without exceptions',()=>{
 const {game}=boot();game.render();game.setMission(1);game.begin();game.render();
});
test('Aircraft accelerates and takes off from runway',()=>{
 const {game,element}=boot();game.begin();element('brake').events.click();game.state.throttle=1;
 for(let i=0;i<100;i++)game.step(.05);
 assert.ok(game.state.speed>20);
 game.state.pitch=.15;for(let i=0;i<160;i++)game.step(.05);
 assert.equal(game.status().grounded,false);assert.ok(game.state.y>3);
});
test('Solo flight height objective awards XP, persists career',()=>{
 const {game,saved}=boot();game.begin();game.state.y=82;game.flightTick(.05);
 assert.equal(game.status().missionStage,1);
 game.finishMission();
 assert.ok(game.career.xp>0);
 assert.equal(JSON.parse(saved.get('flowbeacon-wings-career-v1')).completed.solo,true);
});
test('Reconnaissance photo advances landmark only when close enough',()=>{
 const {game}=boot();game.setMission(2);game.begin();game.takePhoto();
 assert.equal(game.status().missionIndex,0);
 Object.assign(game.state,{x:-325,y:48,z:300});game.takePhoto();
 assert.equal(game.status().missionIndex,1);
});
test('Formation and combat AI aircraft initialize',()=>{
 const {game}=boot();game.setMission(3);
 assert.equal(game.status().bots.filter(b=>b.friendly).length,2);
 game.setMission(5);
 assert.equal(game.status().bots.filter(b=>!b.friendly).length,1);
});
test('Career reset requires confirmation',()=>{
 const {game,element,ctx}=boot();game.finishMission();const xp=game.career.xp;
 element('resetCareer').events.click();assert.equal(game.career.xp,xp);
 ctx.window.confirm=()=>true;element('resetCareer').events.click();
 assert.equal(game.career.xp,xp, 'the original object must not mutate');
});
test('Camera view matrices remain finite',()=>{
 const {game,element}=boot();game.render();
 for(let i=0;i<3;i++){
  game.render();const {camEye,camTarget}=game.camera();
  const mat=game.viewMatrix(camEye,camTarget);
  assert.equal(mat.length,16);assert.ok(mat.every(Number.isFinite));
  element('camera').events.click();
 }
});
test('Original aircraft body remains in chase camera field of view',()=>{
 const {game}=boot();game.render();
 const {camEye,camTarget}=game.camera();
 const mat=game.viewMatrix(camEye,camTarget);
 assert.ok(mat.every(Number.isFinite));
 assert.ok(Math.hypot(camEye[0]-game.state.x,camEye[2]-game.state.z)<20);
});
