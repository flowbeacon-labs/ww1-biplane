'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const SOURCE = fs.readFileSync(path.join(__dirname, '..', 'game.js'), 'utf8');
const HOOK = 'reset();requestAnimationFrame(frame);';

function boot({missingIds=[]}={}) {
  assert.ok(SOURCE.includes(HOOK), 'Game startup hook must remain available');
  const script = SOURCE.replace(HOOK, [
    'globalThis.__flightTest={planes,missions,career,begin,step,state,reset,render,finishMission,flightTick,takePhoto,shoot,setupMission,choose,',
    'setMission:(n)=>{selectedMission=n;setupMission()},',
    'status:()=>({grounded,crashed,missionIndex,missionStage,missionFinished,damage,bots}),',
    'camera:()=>({camEye,camTarget}),viewMatrix,checkpoints,RUNWAYS,runwayAt,nearestRunway,touchdownIsHard,notifyLanding,lighting:()=>timeOfDay,landingLessonSnapshot,missionLessonSnapshot,setSoloStage:(n)=>{missionStage=n},setAirborne:(v)=>{grounded=!v;airborne=v},setMissionIndex:(n)=>{missionIndex=n},setEnemyDefeated:(v)=>{enemyDefeated=v},getTraining:()=>trainingInstructions,compassHeading,bearingToCardinal,updateCompass,graphics:()=>({quality:graphicsQuality,terrainVertices:field.pos.length/3,sceneryVertices:worldObjects.pos.length/3,field,worldObjects}),memorial:()=>({site:WAR_MEMORIAL,flag:memorialFlag,country:planes[selected].country}),flagFor:makeMemorialFlag};',
    HOOK
  ].join(''));
  const elements = new Map();
  function element(id) {
    if (!elements.has(id)) elements.set(id, {
      id, hidden:false, disabled:false, dataset:{}, innerHTML:'', textContent:'',
      value:({difficulty:'arcade',weather:'clear',livery:'classic'})[id]||'',
      files:[],
      style:{width:'',transform:''},attributes:{},
      events:{},
      classList:(()=>{const flags=new Set();return{add(key){flags.add(key);},remove(key){flags.delete(key);},contains(key){return flags.has(key);},toggle(key,force){if(force===true){flags.add(key);return true;}if(force===false){flags.delete(key);return false;}if(flags.has(key)){flags.delete(key);return false;}flags.add(key);return true;}}})(),
      addEventListener(type,fn){this.events[type]=fn;},
      querySelectorAll(){return[];}, setAttribute(name,value){this.attributes[name]=String(value);},setPointerCapture(){},
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
    document:{documentElement:element('htmlRoot'),getElementById:id=>missingIds.includes(id)?null:element(id),querySelectorAll:()=>[],addEventListener:(type,fn)=>{events[type]=fn;},body:{appendChild(){}}},
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
 assert.equal(toggle.attributes['aria-label'],'Hide flight statistics');
 toggle.events.click();
 assert.equal(element('app').classList.contains('stats-open'),false);
 assert.equal(toggle.attributes['aria-label'],'Show flight statistics');
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
test('Every mission now displays training by default',()=>{
 const {game,element}=boot();
 game.setMission(1);
 game.begin();
 assert.equal(element('landingCoach').hidden,false);
 assert.equal(element('app').classList.contains('flight-active'),true);
 assert.match(element('coachTitle').textContent,/Sky Ring|Take off/);
});

test('SVG action icons remain intact after toggling sound and statistics',()=>{
 const {element}=boot();
 const sound=element('sound'),stats=element('hudToggle');
 sound.events.click();
 assert.equal(sound.attributes['aria-pressed'],'true');
 assert.equal(sound.attributes['aria-label'],'Disable engine sound');
 stats.events.click();
 assert.equal(stats.attributes['aria-label'],'Hide flight statistics');
 stats.events.click();
 assert.equal(stats.attributes['aria-label'],'Show flight statistics');
});
test('Flight touch and joystick controls prevent the long-press context menu',()=>{
 const {element}=boot();
 for(const id of ['touch','camera','coachToggle']){
  const control=element(id);
  let stopped=false;
  assert.equal(typeof control.events.contextmenu,'function');
  control.events.contextmenu({preventDefault(){stopped=true;}});
  assert.equal(stopped,true,id+' context menu not suppressed');
 }
});

test('Training instructions are enabled by default, off persists and on is restored',()=>{
 const {game,element,saved}=boot();
 assert.equal(game.getTraining(),'on');
 game.begin();assert.equal(element('landingCoach').hidden,false);
 element('trainingInstructions').value='off';element('trainingInstructions').events.change();
 assert.equal(game.getTraining(),'off');assert.equal(element('landingCoach').hidden,true);
 assert.equal(JSON.parse(saved.get('flowbeacon-wings-career-v1')).settings.trainingInstructions,'off');
 element('trainingInstructions').value='on';element('trainingInstructions').events.change();
 assert.equal(game.getTraining(),'on');assert.equal(element('landingCoach').hidden,false);
});
test('Every mission provides context-specific instructor steps',()=>{
 const {game,element}=boot();
 for(let n=0;n<6;n++){
  game.setMission(n);game.begin();
  assert.equal(element('landingCoach').hidden,false,'mission '+n+' tutor hidden');
  game.setAirborne(true);Object.assign(game.state,{y:100,x:20,z:-50,speed:30});
  if(n===0)game.setSoloStage(1);
  const lesson=game.missionLessonSnapshot();
  assert.ok(lesson.step>=2&&lesson.step<=5,'mission '+n+' step');
  assert.ok(lesson.instruction.length>40,'mission '+n+' instruction too short');
  assert.ok(lesson.title.length>4,'mission '+n+' missing title');
  if(n===1)assert.match(lesson.instruction,/ring|Ring/);
  if(n===2)assert.match(lesson.instruction,/PHOTO/);
  if(n===3)assert.match(lesson.instruction,/wingmen|friendly/);
  if(n===4)assert.match(lesson.instruction,/engine|POWER|Climb|Gain/i);
  if(n===5)assert.match(lesson.instruction,/opponent|FIRE/i);
 }
});
test('Mission completion transitions to runway guidance for every mission',()=>{
 const {game}=boot();
 for(let mission of [1,2,3,4,5]){
  game.setMission(mission);game.begin();game.setAirborne(true);
  Object.assign(game.state,{x:350,y:65,z:350,speed:30});
  if(mission===1)game.setMissionIndex(10);
  if(mission===2)game.setMissionIndex(3);
  if(mission===3)game.setMissionIndex(5);
  if(mission===4)game.setSoloStage(1);
  if(mission===5)game.setEnemyDefeated(true);
  const guide=game.missionLessonSnapshot();
  assert.match(guide.instruction,/runway|airstrip|strip|POWER|landing|approach|turn|Turn/i,'mission '+mission);
 }
});

test('Cached older HTML missing training selector does not prevent launch',()=>{
 const {game,element}=boot({missingIds:['trainingInstructions']});
 assert.equal(game.getTraining(),'on');
 game.begin();game.render();
 assert.equal(element('menu').hidden,true);
 assert.equal(element('landingCoach').hidden,false);
});

test('Cardinal compass uses north at zero, east at 90, south at 180, west at 270',()=>{
 const {game,element}=boot();
 for(const [angle,expected,degrees] of [[0,'NORTH','000°'],[Math.PI/2,'EAST','090°'],[Math.PI,'SOUTH','180°'],[-Math.PI/2,'WEST','270°']]){
  game.state.yaw=angle;game.updateCompass();
  assert.equal(element('directionalHeading').textContent,expected);
  assert.equal(element('compassDegrees').textContent,degrees);
  assert.equal(element('compassNeedle').style.transform,'rotate('+Number.parseInt(degrees,10)+'deg)');
 }
});
test('Mission navigation instructions use named cardinal directions',()=>{
 const {game}=boot();game.setMission(1);game.begin();game.setAirborne(true);
 Object.assign(game.state,{x:0,y:90,z:0,yaw:0,speed:28});
 const lesson=game.missionLessonSnapshot();
 assert.match(lesson.instruction,/NORTH|SOUTH|EAST|WEST/);
});

test('Virtual joystick hold locks document selection and releases the lock',()=>{
 const {element,events}=boot();
 const area=element('joyArea'),root=element('htmlRoot');
 const start={pointerId:7,pointerType:'touch',clientX:60,clientY:62,button:0,preventDefault(){}};
 area.events.pointerdown(start);
 assert.equal(root.classList.contains('joystick-held'),true);
 let blocked=false;
 events.selectstart({target:{closest:()=>null},preventDefault(){blocked=true;}});
 assert.equal(blocked,true);
 area.events.pointerup({pointerId:7});
 assert.equal(root.classList.contains('joystick-held'),false);
});

test('Low graphics reduces terrain and scenery vertex counts without resetting flight',()=>{
 const {game,element,saved}=boot();
 const normal=game.graphics();
 assert.equal(normal.quality,'normal');
 game.begin();
 game.state.y=35;game.state.speed=27;
 element('graphicsQuality').value='low';
 element('graphicsQuality').events.change();
 const low=game.graphics();
 assert.equal(low.quality,'low');
 assert.ok(low.terrainVertices<normal.terrainVertices*.75,'Low terrain meshes should be smaller');
 assert.ok(low.sceneryVertices<normal.sceneryVertices*.75,'Low scenery meshes should be smaller');
 assert.equal(game.state.y,35);
 assert.equal(game.state.speed,27);
 assert.equal(JSON.parse(saved.get('flowbeacon-wings-career-v1')).settings.graphicsQuality,'low');
 game.render();
 assert.ok(element('flight').width<1100,'Low mode should lower canvas resolution');
 element('graphicsQuality').value='normal';element('graphicsQuality').events.change();
 const recovered=game.graphics();
 assert.equal(recovered.quality,'normal');
 assert.equal(recovered.terrainVertices,normal.terrainVertices);
 assert.equal(recovered.sceneryVertices,normal.sceneryVertices);
 game.render();
 assert.equal(element('flight').width,1100);
});
test('Graphics setting defaults to Normal and is restored by pilot reset',()=>{
 const {game,element,ctx,saved}=boot();
 assert.equal(game.graphics().quality,'normal');
 element('graphicsQuality').value='low';element('graphicsQuality').events.change();
 ctx.window.confirm=()=>true;
 element('resetCareer').events.click();
 assert.equal(game.graphics().quality,'normal');
 assert.equal(element('graphicsQuality').value,'normal');
 assert.equal(JSON.parse(saved.get('flowbeacon-wings-career-v1')).settings.graphicsQuality,'normal');
});
test('Missing graphics dropdown in older cached HTML keeps safe Normal default',()=>{
 const {game}=boot({missingIds:['graphicsQuality']});
 assert.equal(game.graphics().quality,'normal');
 game.begin();game.render();
});

test('War memorial sits beyond the active runway and displays the chosen national flag',()=>{
 const {game}=boot();
 const site=game.memorial().site;
 assert.equal(game.runwayAt(site.x,site.z),null);
 assert.ok(Math.abs(site.x)>120,'Memorial must stay away from the center runway corridor');
 assert.ok(site.flagHeight>12);
 assert.equal(game.memorial().country,'United Kingdom');
 const original=game.memorial().flag;
 assert.ok(original.pos.length>100,'Flag should contain actual flag-colored geometry');
 game.choose(1);
 assert.equal(game.memorial().country,'Germany');
 assert.notEqual(game.memorial().flag,original);
 assert.ok(game.memorial().flag.pos.length>100);
 game.render();
});
test('War memorial flag supports every aircraft country and both graphics modes',()=>{
 const {game,element}=boot();
 for(const country of [...new Set(game.planes.map(p=>p.country))]){
  const flag=game.flagFor(country);
  assert.ok(flag.pos.length>0,'No flag geometry for '+country);
  assert.ok(flag.col.length>0);
 }
 element('graphicsQuality').value='low';element('graphicsQuality').events.change();
 game.render();
 assert.equal(game.memorial().country,'United Kingdom');
 element('graphicsQuality').value='normal';element('graphicsQuality').events.change();
 game.render();
 assert.equal(game.memorial().country,'United Kingdom');
});
