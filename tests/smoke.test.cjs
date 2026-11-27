'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const SOURCE = fs.readFileSync(path.join(__dirname, '..', 'game.js'), 'utf8');
const HOOK = 'reset();requestAnimationFrame(frame);';

function boot() {
  assert.ok(SOURCE.includes(HOOK), 'Game startup hook must remain available');
  const script = SOURCE.replace(HOOK, [
    'globalThis.__flightTest={planes,missions,career,begin,step,state,reset,render,finishMission,flightTick,takePhoto,shoot,setupMission,choose,',
    'setMission:(n)=>{selectedMission=n;setupMission()},',
    'status:()=>({grounded,crashed,missionIndex,missionStage,missionFinished,damage,bots}),',
    'camera:()=>({camEye,camTarget}),viewMatrix,checkpoints,RUNWAYS,runwayAt,nearestRunway,touchdownIsHard,notifyLanding,lighting:()=>timeOfDay,landingLessonSnapshot,setSoloStage:(n)=>{missionStage=n},setAirborne:(v)=>{grounded=!v;airborne=v}};',
    HOOK
  ].join(''));
  const elements = new Map();
  function element(id) {
    if (!elements.has(id)) elements.set(id, {
      id, hidden:false, disabled:false, dataset:{}, innerHTML:'', textContent:'',
      value:({difficulty:'arcade',weather:'clear',livery:'classic'})[id]||'',
      files:[],
      style:{width:'',transform:''},
      events:{},
      classList:(()=>{const flags=new Set();return{add(key){flags.add(key);},remove(key){flags.delete(key);},contains(key){return flags.has(key);},toggle(key,force){if(force===true){flags.add(key);return true;}if(force===false){flags.delete(key);return false;}if(flags.has(key)){flags.delete(key);return false;}flags.add(key);return true;}}})(),
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
 const {game,element,ctx,saved}=boot();game.finishMission();const xp=game.career.xp;
 element('resetCareer').events.click();assert.equal(JSON.parse(saved.get('flowbeacon-wings-career-v1')).xp,xp);
 ctx.window.confirm=()=>true;element('resetCareer').events.click();
 assert.equal(JSON.parse(saved.get('flowbeacon-wings-career-v1')).xp,0);
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


test('Back to Planes pauses flight and aircraft change starts a fresh flight',()=>{
 const {game,element}=boot();
 game.begin();
 assert.equal(element('menu').hidden,true);
 element('backToPlanes').events.click();
 assert.equal(element('menu').hidden,false);
 assert.equal(element('start').textContent,'START NEW FLIGHT →');
 assert.equal(element('notice').textContent,'Select your aircraft, then choose Start New Flight.');
 element('start').events.click();
 assert.equal(element('menu').hidden,true);
 assert.equal(game.state.speed,0);
 assert.equal(game.state.y,0.48);
});

test('Checkpoint rings stay off the runway and its immediate approach corridor',()=>{
 const {game}=boot();
 assert.equal(game.checkpoints.length,10);
 for(const [x,y,z] of game.checkpoints){
  assert.ok(Math.abs(x)>=75,'Ring at x='+x+' intrudes into runway safety margin');
  assert.ok(y>=75,'Ring has unsafe altitude');
  assert.ok(Number.isFinite(z));
 }
});

test('Flight statistics start collapsed and can be toggled without stopping flight',()=>{
 const {game,element}=boot();
 const toggle=element('hudToggle');
 assert.equal(toggle.textContent,'');
 assert.equal(element('app').classList.contains('stats-open'),false);
 game.begin();
 toggle.events.click();
 assert.equal(element('app').classList.contains('stats-open'),true);
 assert.equal(toggle.textContent,'HIDE STATS');
 toggle.events.click();
 assert.equal(element('app').classList.contains('stats-open'),false);
 assert.equal(toggle.textContent,'STATS');
 assert.equal(element('menu').hidden,true);
});

test('Four separate airstrips have marked touchdown zones',()=>{
 const {game}=boot();
 assert.equal(game.RUNWAYS.length,4);
 const ids=game.RUNWAYS.map(s=>s.id);
 assert.equal(new Set(ids).size,4);
 for(const strip of game.RUNWAYS){
   assert.equal(game.runwayAt(strip.x,strip.z).id,strip.id);
   assert.ok(strip.length>=300);
   assert.ok(strip.width>=26);
 }
 assert.equal(game.runwayAt(250,0),null);
});

test('Oblique touchdown is hard on either runway axis and in every mode',()=>{
 const {game}=boot();
 const flight={yaw:Math.PI/3,vs:-2,roll:0,pitch:0,speed:20};
 for(const mode of ['arcade','balanced','sim']){
  assert.equal(game.touchdownIsHard(flight,game.RUNWAYS[0],mode,19),true);
  assert.equal(game.touchdownIsHard({...flight,yaw:0},game.RUNWAYS[3],mode,19),true);
  assert.equal(game.touchdownIsHard({...flight,yaw:Math.PI},game.RUNWAYS[0],mode,19),false);
 }
});

test('Arcade marked-strip touchdown forgives moderate impact and rolls out naturally',()=>{
 const {game,element}=boot();game.begin();
 const strip=game.RUNWAYS[0],impact={yaw:0,vs:-9,roll:.55,pitch:.37,speed:20};
 assert.equal(game.touchdownIsHard(impact,strip,'arcade',19),false);
 assert.equal(game.touchdownIsHard(impact,strip,'balanced',19),true);
 assert.equal(game.touchdownIsHard(impact,null,'arcade',19),true);
 element('brake').events.click();game.state.throttle=1;
 for(let index=0;index<100;index++)game.step(.05);
 game.state.pitch=.15;
 for(let index=0;index<160;index++)game.step(.05);
 assert.equal(game.status().grounded,false);
 game.state.y=85;game.flightTick(.05);
 Object.assign(game.state,{x:0,z:0,y:.481,yaw:0,vs:-3,roll:.1,pitch:-.25,speed:20,throttle:0});
 game.step(.05);
 assert.equal(game.status().crashed,false);
 assert.equal(game.status().missionFinished,true);
 assert.ok(game.state.roll>0,'Arcade touchdown keeps bank for the ground rollout');
});

test('Nearby-airstrip guidance chooses the nearest strip',()=>{
 const {game,element}=boot();
 const west=game.RUNWAYS.find(s=>s.id==='west');
 Object.assign(game.state,{x:west.x+2,z:west.z+5});
 game.begin();
 Object.assign(game.state,{x:west.x+2,z:west.z+5});
 game.flightTick(.05);
 assert.equal(game.nearestRunway(game.state.x,game.state.z).strip.id,'west');
 assert.match(element('nearestStrip').textContent,/Western Meadow Strip/);
});

test('Mission rewards require touchdown on a marked runway, not random grass',()=>{
 const {game,element}=boot();game.begin();
 element('brake').events.click();game.state.throttle=1;
 for(let i=0;i<100;i++)game.step(.05);
 game.state.pitch=.15;for(let i=0;i<160;i++)game.step(.05);
 assert.equal(game.status().grounded,false);
 game.state.y=85;game.flightTick(.1);assert.equal(game.status().missionStage,1);
 const originalLandings=game.career.landings;
 Object.assign(game.state,{x:250,z:0,y:.48});
 game.notifyLanding(true);
 assert.equal(game.career.landings,originalLandings);
 assert.equal(game.status().missionFinished,false);
 // A second flight to the western airstrip completes the solo mission.
 // The simulated landing sets airborne via a new takeoff from the grass field.
 game.state.pitch=.15;game.state.speed=40;
 for(let i=0;i<100;i++)game.step(.05);
 Object.assign(game.state,{x:-560,z:-310,y:.48});
 game.notifyLanding(true);
 assert.equal(game.status().missionFinished,true);
 assert.equal(game.career.landings,originalLandings+1);
});

test('Day is the default and Evening selection persists without resetting the mission',()=>{
 const {game,element,saved}=boot();
 assert.equal(game.lighting(),'day');
 game.begin();
 const sessionAltitude=game.state.y;
 element('timeOfDay').value='evening';
 element('timeOfDay').events.change();
 assert.equal(game.lighting(),'evening');
 assert.equal(game.state.y,sessionAltitude);
 assert.equal(JSON.parse(saved.get('flowbeacon-wings-career-v1')).settings.timeOfDay,'evening');
 game.render(); // Evening sun and lighted landing strips draw without errors
 element('timeOfDay').value='day';
 element('timeOfDay').events.change();
 assert.equal(game.lighting(),'day');
 game.render();
});
test('Time of day is restored to Day after confirmed career reset',()=>{
 const {game,element,ctx,saved}=boot();
 element('timeOfDay').value='evening';
 element('timeOfDay').events.change();
 ctx.window.confirm=()=>true;
 element('resetCareer').events.click();
 assert.equal(game.lighting(),'day');
 assert.equal(element('timeOfDay').value,'day');
 assert.equal(JSON.parse(saved.get('flowbeacon-wings-career-v1')).settings.timeOfDay,'day');
});
test('All airfield maps retain their runway geometry in Evening mode',()=>{
 const {game,element}=boot();
 element('timeOfDay').value='evening';
 element('timeOfDay').events.change();
 for(const setting of ['flanders','picardy','italy']){
  element('airfield').value=setting;
  element('airfield').events.change();
  game.render();
  assert.equal(game.RUNWAYS.length,4);
  for(const runway of game.RUNWAYS)assert.equal(game.runwayAt(runway.x,runway.z).id,runway.id);
 }
});


test('Mission bar is suppressed during active flight, landing coach shows for first mission',()=>{
 const {game,element}=boot();
 game.begin();
 assert.equal(element('app').classList.contains('flight-active'),true);
 assert.equal(element('landingCoach').hidden,false);
 assert.equal(game.landingLessonSnapshot().step,1);
 assert.match(element('coachInstruction').textContent,/BRAKE/);
 element('coachToggle').events.click();
 assert.equal(element('landingCoach').classList.contains('coach-collapsed'),true);
 element('pauseFlight').events.click();
 assert.equal(element('app').classList.contains('flight-active'),false);
 assert.equal(element('landingCoach').hidden,true);
});
test('Landing coach has five steps with aircraft-specific target speeds and directional turn advice',()=>{
 const {game,element}=boot();
 game.begin();
 element('brake').events.click();
 const ground=game.landingLessonSnapshot();
 assert.ok(ground.targetKmh>60&&ground.targetKmh<140);
 assert.equal(ground.step,1);
 game.setAirborne(true);
 Object.assign(game.state,{x:350,z:350,y:40,yaw:0,speed:30,vs:3});
 assert.equal(game.landingLessonSnapshot().step,2);
 game.setSoloStage(1);
 const returnTurn=game.landingLessonSnapshot();
 assert.equal(returnTurn.step,3);
 assert.match(returnTurn.instruction,/LEFT|RIGHT/);
 Object.assign(game.state,{x:0,z:100,y:45,yaw:Math.PI,speed:30,vs:-2});
 const align=game.landingLessonSnapshot();
 assert.equal(align.step,4);
 assert.match(align.instruction,/descend|down|altitude|slow|line|centerline|wings|around/i);
 Object.assign(game.state,{x:0,z:20,y:9,yaw:Math.PI,speed:24,vs:-1.5});
 const flare=game.landingLessonSnapshot();
 assert.equal(flare.step,5);
 assert.match(flare.instruction,/level|settle|POWER|nose/i);
});
test('Tutorial stays hidden in non-solo missions',()=>{
 const {game,element}=boot();
 game.setMission(1);
 game.begin();
 assert.equal(element('landingCoach').hidden,true);
 assert.equal(element('app').classList.contains('flight-active'),true);
});
