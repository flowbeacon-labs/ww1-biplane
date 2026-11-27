(()=>{'use strict';
const $=id=>document.getElementById(id),cv=$('flight'),gl=cv.getContext('webgl',{antialias:true,alpha:false,powerPreference:'high-performance'});
cv.addEventListener('webglcontextlost',e=>{e.preventDefault();$('error').hidden=false;$('error').textContent='Graphics context lost. Reload the game to restore the 3D scene.'});
if(!gl){$('error').hidden=false;$('error').textContent='WebGL unavailable. Try a newer browser with hardware acceleration enabled.';return}
const TAU=Math.PI*2,clamp=(v,a,b)=>Math.min(b,Math.max(a,v)),mix=(a,b,t)=>a+(b-a)*t;
const planes=[
{name:'Sopwith Camel',country:'United Kingdom',flag:'🇬🇧',year:1917,span:9,body:7,levels:2,color:'#947c56',wing:'#c5b18b',trim:'#eadabe',mark:'round',max:53,stall:19,accel:10,details:'British rotary-engine fighter, with a compact fuselage and two braced wings.'},
{name:'Fokker Dr.I',country:'Germany',flag:'🇩🇪',year:1917,span:7.2,body:5.8,levels:3,color:'#af332e',wing:'#b13931',trim:'#f0dbad',mark:'cross',max:49,stall:17,accel:10,details:'German triplane with three distinctive stacked wings and cross insignia.'},
{name:'SPAD S.XIII',country:'France',flag:'🇫🇷',year:1917,span:9.1,body:7.8,levels:2,color:'#a58b5d',wing:'#b7ac83',trim:'#e1d0a5',mark:'round',max:61,stall:23,accel:11,details:'French fighter with a long narrow nose and robust twin-wing structure.'},
{name:'Nieuport 17',country:'France',flag:'🇫🇷',year:1916,span:8.2,body:5.9,levels:2,color:'#b2a891',wing:'#d5cbb7',trim:'#e9d6b0',mark:'round',max:50,stall:18,accel:9.4,details:'French sesquiplane, modeled with a visibly narrower lower wing.'},
{name:'Albatros D.Va',country:'Germany',flag:'🇩🇪',year:1917,span:9.0,body:7.3,levels:2,color:'#985a37',wing:'#7c946d',trim:'#ecd5ac',mark:'cross',max:55,stall:21,accel:10.5,details:'German wooden-bodied scout with a tapered fuselage and swept tail.'},
{name:'Ansaldo SVA.5',country:'Italy',flag:'🇮🇹',year:1918,span:9.1,body:8.1,levels:2,color:'#b69a68',wing:'#d1bf92',trim:'#f2e1b6',mark:'italy',max:63,stall:24,accel:11,details:'Italian high-speed reconnaissance aircraft with an elongated fuselage.'},
{name:'Curtiss JN-4 Jenny',country:'United States',flag:'🇺🇸',year:1915,span:13.3,body:8.3,levels:2,color:'#c0a778',wing:'#dfcead',trim:'#fff0ce',mark:'usa',max:41,stall:16,accel:8.8,details:'American training biplane with broad wings and easy low-speed handling.'},
{name:'Royal Aircraft Factory S.E.5a',country:'United Kingdom',flag:'🇬🇧',year:1917,span:8.1,body:6.4,levels:2,color:'#56664c',wing:'#71826b',trim:'#ece1b9',mark:'round',max:61,stall:23,accel:11,unlock:600,details:'Unlockable British fighter renowned for stability and speed.'},
{name:'Fokker D.VII',country:'Germany',flag:'🇩🇪',year:1918,span:8.9,body:7.0,levels:2,color:'#416d62',wing:'#789a82',trim:'#e1d7a8',mark:'cross',max:58,stall:20,accel:11.2,unlock:1100,details:'Unlockable German late-war biplane with distinctive broad wings.'}
];
const hex=s=>[1,3,5].map(i=>parseInt(s.slice(i,i+2),16)/255);
const D={grass:[.27,.43,.27],patch:[.32,.49,.31],strip:[.55,.54,.43],white:[.94,.92,.81],wood:[.49,.35,.23],steel:[.41,.43,.42],black:[.09,.09,.10],gold:[.84,.73,.40],red:[.8,.22,.16],blue:[.18,.31,.68],green:[.25,.54,.28]};
const dim=(c,f)=>c.map(v=>v*f),v=(x,y,z)=>[x,y,z],sub=(a,b)=>a.map((n,i)=>n-b[i]),add=(a,b)=>a.map((n,i)=>n+b[i]),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0),unit=a=>{const l=Math.hypot(...a)||1;return a.map(x=>x/l)};
class Mesh{constructor(){this.pos=[];this.nrm=[];this.col=[];this.buf=null}
 tri(a,b,c,col){let n=unit(cross(sub(b,a),sub(c,a)));for(const p of [a,b,c]){this.pos.push(...p);this.nrm.push(...n);this.col.push(...col)}}
 quad(a,b,c,d,col){this.tri(a,b,c,col);this.tri(a,c,d,col)}
 box(x,y,z,w,h,d,col){const l=x-w/2,r=x+w/2,b=y-h/2,t=y+h/2,n=z-d/2,f=z+d/2;this.quad(v(l,t,n),v(r,t,n),v(r,t,f),v(l,t,f),col);this.quad(v(l,b,f),v(r,b,f),v(r,b,n),v(l,b,n),dim(col,.72));this.quad(v(l,b,n),v(r,b,n),v(r,t,n),v(l,t,n),dim(col,.82));this.quad(v(r,b,f),v(l,b,f),v(l,t,f),v(r,t,f),dim(col,.92));this.quad(v(l,b,f),v(l,b,n),v(l,t,n),v(l,t,f),dim(col,.78));this.quad(v(r,b,n),v(r,b,f),v(r,t,f),v(r,t,n),dim(col,.85))}
 tube(a,b,r,col,segments=7){const axis=unit(sub(b,a)),ref=Math.abs(axis[1])>.9?[1,0,0]:[0,1,0],u=unit(cross(axis,ref)),w=cross(axis,u);for(let i=0;i<segments;i++){const theta=i*TAU/segments,phi=(i+1)*TAU/segments,offset=t=>u.map((n,j)=>n*Math.cos(t)*r+w[j]*Math.sin(t)*r);this.quad(add(a,offset(theta)),add(b,offset(theta)),add(b,offset(phi)),add(a,offset(phi)),col)}}
 disc(x,y,z,r,col){for(let i=0;i<20;i++){let a=i*TAU/20,b=(i+1)*TAU/20;this.tri(v(x,y,z),v(x+Math.cos(a)*r,y,z+Math.sin(a)*r),v(x+Math.cos(b)*r,y,z+Math.sin(b)*r),col)}}
 upload(){if(this.buf)return;this.count=this.pos.length/3;this.buf=[this.pos,this.nrm,this.col].map(data=>{const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.STATIC_DRAW);return b})}
 destroy(){if(this.buf){for(const b of this.buf)gl.deleteBuffer(b);this.buf=null}}
}
function makeField(theme='flanders'){const m=new Mesh();
const grass=theme==='picardy'?[.48,.47,.30]:theme==='italy'?[.33,.50,.32]:D.grass;
const strip=theme==='picardy'?[.63,.52,.36]:theme==='italy'?[.55,.57,.46]:D.strip;
m.box(0,-.30,0,1700,.55,1700,grass);m.box(0,.01,0,28,.06,610,strip);
for(let z=-280;z<300;z+=28)m.box(0,.049,z,1.2,.035,11,D.white);
for(const x of [-15,15])for(let z=-294;z<=294;z+=15)m.box(x,.07,z,.5,.08,.7,D.white);
let seed=42;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)|0;return(seed>>>0)/4294967296};
for(let i=0;i<260;i++){const x=(rand()-.5)*1550,z=(rand()-.5)*1550;if(Math.abs(x)<24&&Math.abs(z)<320)continue;m.box(x,.004,z,2+rand()*9,.025,3+rand()*9,rand()<.5?grass:theme==='picardy'?[.55,.52,.34]:D.patch)}
for(const x of [-83,-50,53,88]){m.box(x,5.5,78,27,11,27,theme==='italy'?D.white:D.wood);m.box(x,11.9,78,30,2,30,theme==='picardy'?D.red:D.steel);m.box(x,5.6,64,17,9,.45,D.black)}
for(let i=0;i<62;i++){let x=(rand()-.5)*1450,z=(rand()-.5)*1450;if(Math.abs(x)<130&&Math.abs(z)<365)continue;let h=6+rand()*10;m.tube(v(x,.1,z),v(x,h*.42,z),.46,D.wood,5);m.tube(v(x,h*.4,z),v(x,h,z),2,rand()<.5?D.grass:D.patch,8)}
for(const z of [-275,275])m.box(0,.11,z,35,.2,1.2,D.white);
if(theme==='italy'){
 for(const [x,z,h] of [[-640,380,235],[-410,700,330],[390,680,290],[670,310,200],[-680,-460,250],[650,-580,245]]){
  const a=[x-190,0,z],b=[x+190,0,z],c=[x,h,z+12];
  m.tri(a,b,c,[.39,.47,.43]);m.tri([x-120,0,z+70],[x+120,0,z+70],c,[.49,.55,.50]);
  m.tri([x-h*.1,h*.70,z+6],[x+h*.1,h*.70,z+6],c,[.82,.83,.80]);
 }
}
if(theme==='picardy'){
 for(let i=-3;i<=3;i++)for(let j=-3;j<=3;j++){
  const x=i*172+75,z=j*160+65;if(Math.abs(x)<44&&Math.abs(z)<325)continue;
  m.box(x,.008,z,135,.018,116,(i+j)%3===0?[.58,.53,.31]:(i-j)%3===0?[.43,.51,.29]:[.62,.57,.34]);
 }
}
return m}
let field=makeField();
function makeAircraft(p){
const m=new Mesh(),prop=new Mesh(),base=hex(p.color),wing=hex(p.wing),trim=hex(p.trim),span=p.span,body=p.body;
const segments=[{z:-body*.53,w:.26,h:.38,y:.78},{z:-body*.24,w:.76,h:.84,y:.94},{z:body*.1,w:1.10,h:1.10,y:1.01},{z:body*.37,w:.82,h:.82,y:1.01},{z:body*.52,w:.24,h:.27,y:.98}];
for(let i=0;i<segments.length-1;i++){const a=segments[i],b=segments[i+1],corners=t=>{const z=t.z,x=t.w/2,y=t.y,k=t.h/2;return[v(-x,y-k,z),v(x,y-k,z),v(x,y+k,z),v(-x,y+k,z)]},aa=corners(a),bb=corners(b);for(let k=0;k<4;k++)m.quad(aa[k],aa[(k+1)%4],bb[(k+1)%4],bb[k],k===2?base:dim(base,.85))}
// A visibly shaped fuselage and distinctive side striping keep the aircraft recognizable in chase view.
m.box(0,1.52,-.3,.70,.2,1.12,D.black);m.box(0,1.66,-.3,.51,.06,.55,trim);
m.box(-.49,1.03,body*.04,.045,.13,body*.54,trim);
m.box(.49,1.03,body*.04,.045,.13,body*.54,trim);
m.box(0,1.47,body*.23,.50,.08,body*.37,dim(base,.78));
m.box(0,1.29,body*.44,.70,.12,.17,trim);
m.box(0,1.63,-body*.15,.59,.06,.26,D.wood);
m.tube(v(0,.98,body*.52),v(0,.98,body*.57),.35,D.steel,11);
const levels=p.levels===3?[.83,1.89,2.97]:[.87,2.32];
for(let k=0;k<levels.length;k++){const y=levels[k],w=p.name==='Nieuport 17'&&k===0?span*.57:p.levels===3&&k===0?span*.81:span;
m.box(0,y,-.1,w,.19,1.82,wing);m.box(0,y+.11,-.75,w*.94,.055,.15,trim);
for(const x of [-w*.30,w*.30]){if(p.mark==='cross'){m.box(x,y+.13,-.1,.92,.045,.22,D.black);m.box(x,y+.13,-.1,.22,.045,.87,D.black)}
else{const outer=p.mark==='italy'?D.red:D.blue;m.disc(x,y+.13,-.1,.48,outer);m.disc(x,y+.145,-.1,.33,D.white);m.disc(x,y+.16,-.1,.17,p.mark==='italy'?D.green:D.red)}}
}
for(const x of [-span*.37,span*.37,-span*.23,span*.23]){for(let k=0;k<levels.length-1;k++){m.tube(v(x,levels[k],-.72),v(x,levels[k+1],-.65),.04,D.wood,6);m.tube(v(x,levels[k],.51),v(x,levels[k+1],.53),.04,D.wood,6)}m.tube(v(x,levels[0],-.68),v(x*.73,levels.at(-1),.48),.016,D.steel,4)}
m.box(0,1,-body*.52,span*.34,.15,.92,wing);m.box(0,1.4,-body*.47,.14,1.25,1,base);
for(const x of [-.82,.82]){m.box(x,.03,.48,.29,.38,.29,D.black);m.tube(v(x,.33,.55),v(x,-.03,.45),.06,D.steel);m.tube(v(x,.33,-.14),v(x,-.03,.45),.05,D.steel)}
m.tube(v(0,.65,-body*.54),v(0,.13,-body*.57),.055,D.steel);
for(const x of [-.56,.56])m.box(x,1.12,body*.39,.09,.12,.44,D.black);
prop.box(0,0,0,.26,4.1,.14,D.wood);prop.box(0,0,0,.26,.85,.18,D.black);prop.tube(v(0,0,-.2),v(0,0,.2),.2,D.steel,10);
return{mesh:m,prop,offset:[0,.98,body*.58]}}
let selected=0,model=makeAircraft(planes[0]),active=false,paused=true,crashed=false,brake=true,grounded=true,camera=0,propAngle=0;
const state={x:0,y:.48,z:-140,yaw:0,pitch:0,roll:0,speed:0,vs:0,throttle:0};
const keys=new Set(),touch=new Set();

/* WINGS OF 1918 ACADEMY: missions, progression, AI, weather, damage, audio */
const SAVE_KEY='flowbeacon-wings-career-v1',DIFFICULTIES=['arcade','balanced','sim'],WEATHERS=['clear','breezy','storm'];
const AIRFIELDS={flanders:'Flanders Grass Strip',picardy:'Picardy Farm Airfield',italy:'Italian Valley Base'};
const missions=[
 {id:'solo',name:'First Solo Flight',description:'Take off, climb to 80 m and return for a gentle landing.',goal:'Reach 80 m, then land safely',award:130},
 {id:'rings',name:'Sky Ring Challenge',description:'Fly through a marked course of ten glowing aerial rings.',goal:'Fly through ten checkpoint rings',award:180},
 {id:'recon',name:'Reconnaissance Patrol',description:'Photograph the village, river and railway before returning to base.',goal:'Photograph three landmarks and land',award:200},
 {id:'formation',name:'Formation Flying',description:'Stay close to the friendly patrol through five checkpoints.',goal:'Keep formation and complete the route',award:170},
 {id:'emergency',name:'Engine Emergency',description:'Fly to 75 m, then glide down with failing engine power.',goal:'Land with a damaged engine',award:220},
 {id:'combat',name:'First Dogfight',description:'Track and disable the training opponent in a safe practice engagement.',goal:'Disable the training aircraft and return',award:250}
];
const checkpoints=[
 [0,82,70],[110,105,150],[215,110,220],[260,120,350],[160,120,445],[0,100,480],[-140,115,405],[-235,100,300],[-185,90,160],[-65,80,35]
];
const landmarks=[
 {name:'Village',x:-325,z:300,y:48},
 {name:'River Bridge',x:345,z:315,y:47},
 {name:'Railway Station',x:-330,z:-285,y:48}
];
const fallbackProgress=()=>({version:1,xp:0,flights:0,landings:0,medals:0,completed:{},best:{},settings:{difficulty:'arcade',weather:'clear',livery:'classic',airfield:'flanders'},missionsCompleted:0});
function cleanCareer(value){
 const c=fallbackProgress();if(!value||typeof value!=='object')return c;
 for(const k of ['xp','flights','landings','medals'])c[k]=Math.max(0,Math.min(10000000,Number.isFinite(value[k])?Math.floor(value[k]):0));
 for(const k of ['completed','best']){if(value[k]&&typeof value[k]==='object'&&!Array.isArray(value[k]))for(const m of missions){let v=value[k][m.id];if(k==='completed')c[k][m.id]=Boolean(v);else if(Number.isFinite(v))c[k][m.id]=Math.max(0,Math.min(1000000,Math.floor(v)))}}
 if(value.settings&&typeof value.settings==='object'){
  if(DIFFICULTIES.includes(value.settings.difficulty))c.settings.difficulty=value.settings.difficulty;
  if(WEATHERS.includes(value.settings.weather))c.settings.weather=value.settings.weather;
  if(['classic','sky','ace'].includes(value.settings.livery))c.settings.livery=value.settings.livery;
  if(Object.prototype.hasOwnProperty.call(AIRFIELDS,value.settings.airfield))c.settings.airfield=value.settings.airfield;
 }
 c.missionsCompleted=missions.filter(m=>c.completed[m.id]).length;
 return c;
}
function loadCareer(){try{return cleanCareer(JSON.parse(localStorage.getItem(SAVE_KEY)||'null'))}catch{return fallbackProgress()}}
let career=loadCareer(),selectedMission=0,missionTime=0,missionScore=0,missionStage=0,missionIndex=0,missionFinished=false,airborne=false,damage=100,fuel=100,trainingShots=0,photoDone=new Set(),formationClock=0,weatherClock=0,fireCooldown=0,smokeTime=0,missionMarks=[],missionRender=[],enemyDefeated=false;
let difficulty=career.settings.difficulty,weather=career.settings.weather,paintScheme=career.settings.livery,airfield=career.settings.airfield,windClock=0,joystick={x:0,y:0},joystickPointer=null,enemyFireClock=0,missionPending=false,planePending=false;
const friendlyWingmen=[{offset:-17,phase:0,color:'#dfc18c'},{offset:17,phase:2,color:'#b8c8d0'}],bots=[];
const aiShape=makeAircraft(planes[3]),enemyShape=makeAircraft(planes[1]);
const markerMeshes=(()=>{const ring=new Mesh(),gold=D.gold;for(let i=0;i<40;i++){const a=i*TAU/40,b=(i+1)*TAU/40;ring.tube([Math.cos(a)*10,Math.sin(a)*10,0],[Math.cos(b)*10,Math.sin(b)*10,0],.58,i%2?D.white:gold,5)}
 return {ring,marker:ring}})();
const worldObjects=(()=>{const m=new Mesh();const r=()=>Math.random();
 // River and a stone bridge, deliberately outside the takeoff strip.
 m.box(355,-.07,150,53,.06,780,[.22,.50,.64]);
 m.box(355,1.2,315,63,2.5,10,D.steel);
 // Railroad with sleepers and a station.
 for(const x of [-342,-330])m.box(x,.16,-260,1,.35,560,D.steel);
 for(let z=-540;z<20;z+=9)m.box(-336,.20,z,25,.20,1.4,D.wood);
 m.box(-382,6,-290,36,12,20,D.wood);m.box(-382,13,-290,39,3,24,D.red);
 // Countryside village blocks.
 for(let i=0;i<17;i++){const x=-390+(i%5)*25,z=250+Math.floor(i/5)*28,hh=6+(i%3)*3;m.box(x,hh/2,z,14,hh,14,i%3===0?D.wood:D.white);m.box(x,hh+1,z,17,2.5,17,i%2?D.red:D.steel)}
 // Village church and water tower make the route recognizable.
 m.box(-330,20,370,9,40,9,D.white);m.box(-330,42,370,13,5,13,D.red);
 m.tube([480,0,-330],[480,38,-330],3,D.steel);m.box(480,42,-330,18,9,18,D.wood);
 // A few farms and roads.
 m.box(-250,.02,400,12,.04,360,D.strip);m.box(250,.02,-320,10,.04,260,D.strip);
 for(const [x,z] of [[-230,480],[230,-385],[450,-30],[-480,-80]]){m.box(x,5,z,24,10,20,D.wood);m.box(x,11,z,28,2,24,D.red)}
 // Layered clouds create visible sky landmarks at different altitudes.
 for(const [x,y,z] of [[-150,170,120],[140,190,310],[-370,200,-200],[390,170,-140],[-70,230,510],[470,235,405],[-510,210,420]]){
  const cloud=[.89,.92,.95];m.box(x,y,z,50,11,25,cloud);
  m.box(x-19,y+5,z,33,13,27,cloud);m.box(x+13,y+7,z,30,17,28,D.white);
 }
 return m;
})();
function saveCareer(){career.settings={difficulty,weather,livery:paintScheme,airfield};try{localStorage.setItem(SAVE_KEY,JSON.stringify(cleanCareer(career)))}catch{announce('Save unavailable. Export your pilot file to back up progress.')}refreshCareer()}
function rankTitle(){return career.xp>=2500?'ACE PILOT':career.xp>=1250?'SQUADRON LEADER':career.xp>=600?'FLYING OFFICER':career.xp>=200?'TRAINEE PILOT':'FLIGHT CADET'}
function refreshCareer(){
 $('pilotRank').textContent=rankTitle();$('pilotXp').textContent=career.xp+' XP';
 $('careerSummary').textContent=career.missionsCompleted+' of '+missions.length+' missions completed · '+career.medals+' medals · '+career.landings+' landings';
 $('missions').innerHTML=missions.map((m,i)=>'<button class="mission-choice" data-mission="'+i+'" aria-pressed="'+(i===selectedMission)+'"><strong>'+(i+1)+'. '+m.name+'</strong><small>'+m.description+'</small><em>'+(career.completed[m.id]?'✓ Completed · Best '+(career.best[m.id]||0):'Reward '+m.award+' XP')+'</em></button>').join('');
 document.querySelectorAll('[data-mission]').forEach(b=>b.onclick=()=>{if(selectedMission!==+b.dataset.mission)missionPending=true;selectedMission=+b.dataset.mission;refreshCareer();$('missionNumber').textContent=selectedMission+1;$('missionHeading').textContent=missions[selectedMission].name});
 document.querySelectorAll('.plane').forEach(b=>{const p=planes[Number(b.dataset.index)];if(p?.unlock)b.setAttribute('aria-label',career.xp>=p.unlock?p.name+' unlocked':p.name+' locked until '+p.unlock+' XP')});
}
function setLivery(){
 // Paint options are intentionally visual via material tint, while the plane geometry remains unchanged.
 let p={...planes[selected]};
 if(paintScheme==='sky'&&career.xp>=100){p.color='#52799a';p.wing='#8bbacb';p.trim='#f4efe1'}
 if(paintScheme==='ace'&&career.xp>=400){p.color='#ac8238';p.wing='#e1bf61';p.trim='#fff2c5'}
 if(model){model.mesh.destroy();model.prop.destroy()}
 model=makeAircraft(p);
}
function syncSettings(){
 difficulty=$('difficulty').value;weather=$('weather').value;paintScheme=$('livery').value;
 $('app').dataset.weather=weather;
 const newAirfield=AIRFIELDS[$('airfield').value]?$('airfield').value:'flanders';
 if(newAirfield!==airfield){field.destroy();airfield=newAirfield;field=makeField(airfield)}
 $('airfieldLabel').textContent=AIRFIELDS[airfield];
 if((paintScheme==='sky'&&career.xp<100)||(paintScheme==='ace'&&career.xp<400)){paintScheme='classic';$('livery').value='classic';announce('Earn XP to unlock that paint scheme.')}
 setLivery();saveCareer();
}
for(const id of ['difficulty','weather','livery','airfield']){$(id).value=career.settings[id];$(id).addEventListener('change',syncSettings)}
field.destroy();field=makeField(airfield);$('airfieldLabel').textContent=AIRFIELDS[airfield];$('app').dataset.weather=weather;
$('missionMenu').addEventListener('click',()=>{pause()});
$('pauseFlight').addEventListener('click',()=>{pause()});
function setupMission(){
 missionTime=0;missionScore=0;missionStage=0;missionIndex=0;missionFinished=false;airborne=false;photoDone.clear();formationClock=0;enemyDefeated=false;trainingShots=0;damage=100;fuel=100;fireCooldown=0;smokeTime=0;windClock=0;enemyFireClock=0;
 $('missionHeading').textContent=missions[selectedMission].name;
 $('missionNumber').textContent=selectedMission+1;
 $('crosshair').hidden=selectedMission!==5;
 $('photo').disabled=selectedMission!==2;$('fire').disabled=selectedMission!==5;
 bots.length=0;
 if(selectedMission===3){bots.push({friendly:true,x:-17,y:70,z:45,hp:100,phase:0}, {friendly:true,x:17,y:70,z:45,hp:100,phase:2})}
 if(selectedMission===5){bots.push({friendly:false,x:0,y:95,z:195,hp:100,phase:0})}
 updateMissionDisplay();
}
function formatTime(seconds){const n=Math.max(0,Math.floor(seconds));return String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0')}
function currentTarget(){
 if(selectedMission===1||selectedMission===3)return missionIndex>=(selectedMission===3?5:checkpoints.length)?[0,5,-140]:checkpoints[missionIndex];
 if(selectedMission===2)return landmarks[missionIndex]?[landmarks[missionIndex].x,landmarks[missionIndex].y,landmarks[missionIndex].z]:[0,5,-140];
 if(selectedMission===5)return bots.find(b=>!b.friendly&&b.hp>0)?[bots[0].x,bots[0].y,bots[0].z]:[0,5,-140];
 return null;
}
function objectiveText(){
 if(missionFinished)return 'Mission complete! Choose another mission from the menu.';
 const m=missions[selectedMission];
 if(selectedMission===0)return missionStage===0?'Take off and climb above 80 metres.':missionStage===1?'Return to the runway and land gently.':'Complete';
 if(selectedMission===1)return missionIndex<checkpoints.length?'Pass ring '+(missionIndex+1)+' of '+checkpoints.length+'.':'Return to base for your landing.';
 if(selectedMission===2)return missionIndex<3?'Fly near '+landmarks[missionIndex].name+' and press PHOTO.':'Return to base and land.';
 if(selectedMission===3)return missionIndex<5?'Follow wingmen through waypoint '+(missionIndex+1)+' / 5.':'Return to base and land.';
 if(selectedMission===4)return missionStage===0?'Climb above 75 m; your engine will lose power.':'Engine failure: glide to a safe landing.';
 if(selectedMission===5)return enemyDefeated?'Return to base and land.':'Get behind the red training aircraft and press FIRE.';
 return m.goal;
}
function updateMissionDisplay(){
 $('objective').textContent=objectiveText();$('missionTime').textContent=formatTime(missionTime);
 $('missionScore').textContent=Math.round(missionScore)+' pts';
 $('fuel').textContent=Math.max(0,Math.round(fuel))+'%';$('health').textContent=Math.round(damage)+'%';
 $('compass').textContent=String((Math.round(state.yaw*180/Math.PI)%360+360)%360).padStart(3,'0')+'°';
 $('windReadout').textContent=weather==='clear'?'CALM':weather==='breezy'?'BREEZY':'STORM';
 $('formationInfo').textContent=bots.filter(b=>b.friendly).length?'WINGMEN: '+bots.filter(b=>b.friendly).length:'WINGMEN: —';
 const t=currentTarget();$('radarTargets').innerHTML=t?'<span class="radar-dot target" style="left:'+clamp(50+(t[0]-state.x)*.07,5,94)+'%;top:'+clamp(50-(t[2]-state.z)*.07,5,94)+'%"></span>':'';
}
function grant(amount){missionScore+=amount;}
function finishMission(){
 if(missionFinished)return;missionFinished=true;
 const m=missions[selectedMission],timeBonus=Math.round(Math.max(0,220-missionTime)*.4),healthBonus=Math.round(damage*.3);
 const finalScore=Math.max(0,Math.round(missionScore+timeBonus+healthBonus));
 const bronze=finalScore>=100,silver=finalScore>=210,gold=finalScore>=340;
 const stars=gold?3:silver?2:bronze?1:1;
 career.flights=Math.max(0,career.flights);career.xp+=m.award+stars*15;career.medals+=stars;
 career.completed[m.id]=true;career.best[m.id]=Math.max(career.best[m.id]||0,finalScore);
 career.missionsCompleted=missions.filter(item=>career.completed[item.id]).length;
 saveCareer();updateMissionDisplay();
 announce('MISSION COMPLETE · '+finalScore+' pts · '+stars+' medal stars · +'+(m.award+stars*15)+' XP');
}
function notifyLanding(safe){
 if(!active||paused||missionFinished||!airborne)return;
 if(!safe){damage=Math.max(0,damage-45);grant(-60);announce('Hard landing! Mission failed. Restart to try again.');return}
 career.landings++;saveCareer();grant(90);
 if(selectedMission===0&&missionStage===1)finishMission();
 if(selectedMission===1&&missionIndex>=checkpoints.length)finishMission();
 if(selectedMission===2&&missionIndex>=landmarks.length)finishMission();
 if(selectedMission===3&&missionIndex>=5)finishMission();
 if(selectedMission===4&&missionStage===1)finishMission();
 if(selectedMission===5&&enemyDefeated)finishMission();
 airborne=false;
}
function flightTick(dt){
 if(!active||paused||crashed||missionFinished)return;
 missionTime+=dt;fireCooldown=Math.max(0,fireCooldown-dt);windClock+=dt;
 fuel=Math.max(0,fuel-dt*(.012+state.throttle*.030));
 if(fuel===0){state.throttle=0;damage=Math.max(0,damage-dt*1.2)}
 if(!grounded)airborne=true;
 const p=[state.x,state.y,state.z];
 if(selectedMission===0&&missionStage===0&&state.y>=80){missionStage=1;grant(95);announce('Altitude objective reached! Return to the runway and land.')}
 if(selectedMission===4&&missionStage===0&&state.y>=75){missionStage=1;state.throttle=Math.min(state.throttle,.22);grant(90);announce('Engine failure! Glide toward the airfield and land.')}
 if((selectedMission===1||selectedMission===3)&&missionIndex<(selectedMission===3?5:checkpoints.length)){
 const t=checkpoints[missionIndex],dist=Math.hypot(state.x-t[0],state.y-t[1],state.z-t[2]);
 if(dist<(selectedMission===3?65:17)){
  if(selectedMission===3&&formationClock<3)announce('Keep formation with your wingmen for 3 seconds before next waypoint.');
  else{missionIndex++;grant(selectedMission===3?45:35);formationClock=0;announce('Checkpoint '+missionIndex+' reached!')}
 }
 }
 if(selectedMission===3){const nearby=bots.filter(b=>b.friendly&&Math.hypot(b.x-state.x,b.y-state.y,b.z-state.z)<110).length;if(nearby)formationClock+=dt;else formationClock=Math.max(0,formationClock-dt*.4)}
 for(const b of bots){
  b.phase+=dt;
  if(b.friendly){const t=checkpoints[Math.min(missionIndex,4)];const f=Math.min(1,dt*.8),shift=b.x<0?-22:22;
   b.x=mix(b.x,t[0]+shift,f);b.z=mix(b.z,t[2]-30,f);b.y=mix(b.y,t[1],f)}
  else{b.x=80*Math.sin(b.phase*.45);b.z=205+70*Math.cos(b.phase*.45);b.y=95+11*Math.sin(b.phase*.8)}
 }
 if(selectedMission===5&&bots[0]?.hp>0&&!grounded){
  const enemy=bots[0],dist=Math.hypot(enemy.x-state.x,enemy.y-state.y,enemy.z-state.z);
  enemyFireClock+=dt;
  if(dist<150&&enemyFireClock>3.5){enemyFireClock=0;damage=Math.max(0,damage-(difficulty==='arcade'?3:difficulty==='balanced'?6:10));announce('Enemy practice fire! Hull integrity '+Math.round(damage)+'%.');}
 }
 if(selectedMission===5&&!enemyDefeated&&bots[0]?.hp<=0){enemyDefeated=true;grant(180);announce('Training opponent disabled! Return to base.')}
 if(damage<=0){crashed=true;announce('Aircraft critically damaged. Restart the mission.')}
 updateMissionDisplay();
}
function takePhoto(){
 if(selectedMission!==2||missionFinished||!active||paused)return;
 const place=landmarks[missionIndex];if(!place)return;
 const d=Math.hypot(state.x-place.x,state.y-place.y,state.z-place.z);
 if(d>145){announce('Move closer to '+place.name+' before taking the photograph.');return}
 photoDone.add(place.name);missionIndex++;grant(60);announce(place.name+' photographed ('+missionIndex+'/3).');updateMissionDisplay();
}
function shoot(){
 if(selectedMission!==5||missionFinished||!active||paused||fireCooldown>0)return;
 fireCooldown=.16;trainingShots++;
 const e=bots.find(b=>!b.friendly&&b.hp>0);
 if(!e)return;
 const dx=e.x-state.x,dz=e.z-state.z,dy=e.y-state.y,dist=Math.hypot(dx,dy,dz);
 const bearing=Math.atan2(dx,dz),angle=Math.atan2(Math.sin(bearing-state.yaw),Math.cos(bearing-state.yaw));
 const elevation=Math.atan2(dy,Math.hypot(dx,dz));
 if(dist<235&&Math.abs(angle)<.20&&Math.abs(elevation-state.pitch)<.20){e.hp-=17;grant(9);announce('Target hit! '+Math.max(0,Math.round(e.hp))+'% remaining.')}else{announce('Missed! Aim toward the aircraft ahead and close the distance.')}
}
$('fire').addEventListener('click',shoot);$('photo').addEventListener('click',takePhoto);
$('exportSave').addEventListener('click',()=>{const blob=new Blob([JSON.stringify(cleanCareer(career),null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='wings-of-1918-pilot.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1200)});
$('importSave').addEventListener('click',()=>$('importFile').click());
$('resetCareer').addEventListener('click',()=>{
 if(!window.confirm('Delete saved ranks, XP, medals and mission records on this device? This cannot be undone without an exported backup.'))return;
 career=fallbackProgress();difficulty='arcade';weather='clear';paintScheme='classic';
 for(const id of ['difficulty','weather','livery','airfield'])$(id).value=career.settings[id];airfield='flanders';field.destroy();field=makeField(airfield);$('airfieldLabel').textContent=AIRFIELDS[airfield];$('app').dataset.weather=weather;
 saveCareer();selectedMission=0;missionPending=true;choose(0);
 announce('Pilot career reset. Export a backup before resetting next time.');
});
$('importFile').addEventListener('change',async()=>{const file=$('importFile').files?.[0];if(!file)return;if(file.size>50000){announce('Save file is too large.');return}try{const parsed=JSON.parse(await file.text());if(parsed.version!==1)throw Error('Unsupported save format');career=cleanCareer(parsed);difficulty=career.settings.difficulty;weather=career.settings.weather;paintScheme=career.settings.livery;for(const id of ['difficulty','weather','livery','airfield'])$(id).value=career.settings[id];airfield=career.settings.airfield;field.destroy();field=makeField(airfield);$('airfieldLabel').textContent=AIRFIELDS[airfield];$('app').dataset.weather=weather;saveCareer();setLivery();announce('Pilot career imported.')}catch{announce('Unable to import that pilot file.')}finally{$('importFile').value=''}});
refreshCareer();
let audioContext=null,engineOsc=null,engineGain=null,soundEnabled=false;
function audioSetup(){if(audioContext)return;const C=window.AudioContext||window.webkitAudioContext;if(!C)return;audioContext=new C();engineOsc=audioContext.createOscillator();engineGain=audioContext.createGain();engineOsc.type='sawtooth';engineGain.gain.value=0;engineOsc.connect(engineGain);engineGain.connect(audioContext.destination);engineOsc.start()}
$('sound').addEventListener('click',()=>{soundEnabled=!soundEnabled;if(soundEnabled){audioSetup();audioContext?.resume()}$('sound').textContent=soundEnabled?'SOUND ON':'SOUND OFF'});
function updateAudio(){if(!audioContext||!engineOsc||!engineGain)return;const now=audioContext.currentTime;engineOsc.frequency.setTargetAtTime(52+state.throttle*70,now,.12);engineGain.gain.setTargetAtTime(soundEnabled&&active&&!paused?.025+state.throttle*.045:0,now,.12)}
function joystickInput(){return{x:joystick.x,y:joystick.y}}
const joy=$('joyArea'),knob=$('joyKnob');
function joystickMove(e){if(joystickPointer!==e.pointerId)return;const r=joy.getBoundingClientRect(),x=e.clientX-(r.left+r.width/2),y=e.clientY-(r.top+r.height/2),mag=Math.max(1,Math.hypot(x,y)),scale=Math.min(43,mag)/mag;joystick.x=clamp(x*scale/43,-1,1);joystick.y=clamp(-y*scale/43,-1,1);knob.style.transform='translate('+joystick.x*36+'px,'+(-joystick.y*36)+'px)'}
joy.addEventListener('pointerdown',e=>{joystickPointer=e.pointerId;joy.setPointerCapture(e.pointerId);joystickMove(e);e.preventDefault()});
joy.addEventListener('pointermove',joystickMove);
for(const event of ['pointerup','pointercancel','lostpointercapture'])joy.addEventListener(event,()=>{joystickPointer=null;joystick.x=0;joystick.y=0;knob.style.transform='translate(0,0)'});

const identity=()=>[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];
function multiply(a,b){const m=Array(16).fill(0);for(let col=0;col<4;col++)for(let row=0;row<4;row++)for(let k=0;k<4;k++)m[col*4+row]+=a[k*4+row]*b[col*4+k];return m}
function move(x,y,z){const m=identity();m[12]=x;m[13]=y;m[14]=z;return m}
function yaw(a){const c=Math.cos(a),s=Math.sin(a);return[c,0,-s,0,0,1,0,0,s,0,c,0,0,0,0,1]}
function pitch(a){const c=Math.cos(a),s=Math.sin(a);return[1,0,0,0,0,c,s,0,0,-s,c,0,0,0,0,1]}
function roll(a){const c=Math.cos(a),s=Math.sin(a);return[c,s,0,0,-s,c,0,0,0,0,1,0,0,0,0,1]}
function projection(fovy,aspect,near,far){const f=1/Math.tan(fovy/2);return[f/aspect,0,0,0,0,f,0,0,0,0,(far+near)/(near-far),-1,0,0,2*far*near/(near-far),0]}
function viewMatrix(eye,target){const f=unit(sub(target,eye)),r=unit(cross([0,1,0],f)),u=cross(f,r);return[r[0],u[0],-f[0],0,r[1],u[1],-f[1],0,r[2],u[2],-f[2],0,-dot(r,eye),-dot(u,eye),dot(f,eye),1]}
function compile(type,src){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s}
const vsource='attribute vec3 aPos,aNrm,aCol;uniform mat4 uModel,uView,uProj;uniform vec3 uEye;varying vec3 vCol;varying float fog;void main(){vec4 pos=uModel*vec4(aPos,1.);vec3 n=normalize(mat3(uModel)*aNrm);float l=.59+.41*max(0.,dot(n,normalize(vec3(-.44,.83,.3))));vCol=aCol*l;fog=clamp((distance(pos.xyz,uEye)-210.)/950.,0.,1.);gl_Position=uProj*uView*pos;}';
const fsource='precision mediump float;varying vec3 vCol;varying float fog;void main(){gl_FragColor=vec4(mix(vCol,vec3(.65,.78,.84),fog),1.);}';
const program=gl.createProgram();gl.attachShader(program,compile(gl.VERTEX_SHADER,vsource));gl.attachShader(program,compile(gl.FRAGMENT_SHADER,fsource));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.useProgram(program);gl.enable(gl.DEPTH_TEST);
const attributes=['aPos','aNrm','aCol'].map(k=>gl.getAttribLocation(program,k)),uniforms=['uModel','uView','uProj','uEye'].map(k=>gl.getUniformLocation(program,k));
function draw(mesh,mat,view,proj,eye){mesh.upload();for(const [loc,m] of [[uniforms[0],mat],[uniforms[1],view],[uniforms[2],proj]])gl.uniformMatrix4fv(loc,false,new Float32Array(m));gl.uniform3fv(uniforms[3],new Float32Array(eye));mesh.buf.forEach((b,i)=>{gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.enableVertexAttribArray(attributes[i]);gl.vertexAttribPointer(attributes[i],3,gl.FLOAT,false,0,0)});gl.drawArrays(gl.TRIANGLES,0,mesh.count)}
function choose(i){if(planes[i].unlock&&career.xp<planes[i].unlock){announce('Earn '+planes[i].unlock+' XP to unlock '+planes[i].name+'.');return}if(selected!==i)planePending=true;selected=i;setLivery();const p=planes[i];$('aircraftInfo').textContent=p.details+' The models and flight physics are historical-inspired approximations.';$('selectedAircraft').textContent=p.name+' · '+p.country;document.querySelectorAll('.plane').forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.index===i)))}
$('planes').innerHTML=planes.map((p,i)=>'<button class="plane" data-index="'+i+'" aria-pressed="'+(i===0)+'"><span class="flag">'+p.flag+'</span><strong>'+p.name+'</strong><small>'+p.country+' · '+p.year+' · '+(p.levels===3?'Triplane':'Biplane')+(p.unlock?' · '+p.unlock+' XP unlock':'')+'</small></button>').join('');
document.querySelectorAll('.plane').forEach(b=>b.addEventListener('click',()=>choose(+b.dataset.index)));choose(0);
function announce(t){$('notice').textContent=t}
function reset(){Object.assign(state,{x:0,y:.48,z:-140,yaw:0,pitch:0,roll:0,speed:0,vs:0,throttle:0});setupMission();snapCamera();grounded=true;brake=true;crashed=false;touch.clear();keys.clear();$('brake').classList.add('on');announce('Increase power, release wheel brake and accelerate along the runway.')}
let last=performance.now();
function begin(){reset();missionPending=false;planePending=false;career.flights++;saveCareer();active=true;paused=false;$('menu').hidden=true;$('start').textContent='RESUME FLIGHT →';last=performance.now()}
$('start').addEventListener('click',()=>{if(active&&paused&&!crashed&&!missionPending&&!planePending){paused=false;$('menu').hidden=true;last=performance.now()}else begin()});
function pause(){if(!active)return;paused=!paused;$('menu').hidden=!paused;$('start').textContent=paused?'RESUME FLIGHT →':'START FLIGHT →'}
$('camera').addEventListener('click',()=>{camera=(camera+1)%3;snapCamera();$('camName').textContent=['CHASE','CLOSE','COCKPIT'][camera]});
const keyMap={KeyW:'w',KeyS:'s',KeyA:'a',KeyD:'d',KeyQ:'q',KeyE:'e',ArrowUp:'up',ArrowDown:'down'};
document.addEventListener('keydown',e=>{let k=keyMap[e.code];if(k){keys.add(k);e.preventDefault()}if(e.repeat)return;if(e.code==='Space'){brake=!brake;$('brake').classList.toggle('on',brake);e.preventDefault()}if(e.code==='KeyC')$('camera').click();if(e.code==='KeyR'){begin()}if(e.code==='Escape')pause();if(e.code==='KeyF')shoot();if(e.code==='KeyP')takePhoto();if(e.code==='KeyM')pause()});
document.addEventListener('keyup',e=>{let k=keyMap[e.code];if(k){keys.delete(k);e.preventDefault()}});
window.addEventListener('blur',()=>{keys.clear();touch.clear();if(active&&!paused)pause()});
document.querySelectorAll('[data-control]').forEach(el=>{const k=el.dataset.control;el.addEventListener('pointerdown',e=>{touch.add(k);el.setPointerCapture(e.pointerId);e.preventDefault()});for(const ev of ['pointerup','pointercancel','lostpointercapture'])el.addEventListener(ev,()=>touch.delete(k))});
for(const [id,k] of [['throttleUp','up'],['throttleDown','down']]){const el=$(id);el.addEventListener('pointerdown',e=>{touch.add(k);el.setPointerCapture(e.pointerId);e.preventDefault()});for(const event of ['pointerup','pointercancel','lostpointercapture'])el.addEventListener(event,()=>touch.delete(k))}
$('brake').addEventListener('click',()=>{brake=!brake;$('brake').classList.toggle('on',brake)});
const held=k=>keys.has(k)||touch.has(k),axis=(a,b)=>(held(a)?1:0)-(held(b)?1:0);
function step(dt){if(!active||paused||crashed)return;const p=planes[selected],joyInput=joystickInput(),w=clamp(axis('w','s')+joyInput.y,-1,1),a=clamp(axis('d','a')+joyInput.x,-1,1),r=axis('e','q');state.throttle=clamp(state.throttle+axis('up','down')*dt*.29,0,1);
if(selectedMission===4&&missionStage===1)state.throttle=Math.min(state.throttle,.20);
 const wind=weather==='clear'?0:weather==='breezy'?1.5:4.0;
 const gust=wind*Math.sin(windClock*.65)*.25;
 const controlFactor=difficulty==='arcade'?1.17:difficulty==='balanced'?1:.82;
 const fuelFactor=fuel>0?1:0;
 const damageFactor=.55+.45*damage/100;
 const drag=.0016*state.speed*state.speed+(grounded?1:.55);
 state.speed=clamp(state.speed+(p.accel*state.throttle*fuelFactor*damageFactor-drag-(brake&&grounded?17:0)+gust*.08)*dt,0,p.max*1.23);
if(grounded){state.roll=mix(state.roll,0,Math.min(1,dt*6));state.pitch=clamp(state.pitch+(w*.47*controlFactor-state.pitch*.4)*dt,0,.22);state.yaw+=r*dt*(.22+state.speed*.008);state.y=.48;state.vs=0;if(state.speed>p.stall*1.28&&state.pitch>.065){grounded=false;state.vs=1.1;announce('Airborne! Hold a gentle climb and keep your airspeed up.')}}else{
 state.pitch=clamp(state.pitch+(w*.40*controlFactor-state.pitch*(difficulty==='arcade'?.3:.12))*dt,-.60,.60);
 state.roll=clamp(state.roll+(a*.82*controlFactor-state.roll*(difficulty==='arcade'?.46:.20))*dt,-.91,.91);
 state.yaw+=(r*.28+Math.sin(state.roll)*(.16+state.speed*.006))*dt;
 const effectiveStall=p.stall*(difficulty==='arcade'?.80:difficulty==='balanced'?1:1.12);const stall=state.speed<effectiveStall?-(effectiveStall-state.speed)*(difficulty==='arcade'?.9:1.9):0;
 const desired=Math.sin(state.pitch)*state.speed*.83+stall;
 state.vs=mix(state.vs,desired,Math.min(1,dt*1.4));state.y+=state.vs*dt;if(weather!=='clear'){state.x+=gust*dt;state.roll=clamp(state.roll+gust*.008*dt,-.91,.91)}
 if(state.y<=.48){state.y=.48;grounded=true;
 if(state.vs< (difficulty==='arcade'?-8:difficulty==='balanced'?-5:-3.8)||Math.abs(state.roll)>(difficulty==='arcade'?.50:.36)||Math.abs(state.pitch)>.33||state.speed>p.stall*(difficulty==='arcade'?2.1:1.85)){crashed=true;state.speed=0;notifyLanding(false);announce('Hard landing! Press R or Start Flight to retry.');$('flightState').textContent='HARD LANDING'}
 else{state.vs=0;state.pitch=0;state.roll=0;state.speed*=.80;notifyLanding(true);if(!missionFinished)announce('Smooth touchdown! Brake to stop or throttle up to take off again.')}
}}
state.x+=Math.sin(state.yaw)*Math.cos(state.pitch)*state.speed*dt;state.z+=Math.cos(state.yaw)*Math.cos(state.pitch)*state.speed*dt;
propAngle+=dt*(4+state.throttle*55);flightTick(dt);
$('speed').textContent=Math.round(state.speed*3.6);$('alt').textContent=Math.round(Math.max(0,state.y-.48));$('vs').textContent=state.vs.toFixed(1);$('power').textContent=Math.round(state.throttle*100);$('powerBar').style.width=Math.round(state.throttle*100)+'%';
if(!crashed){$('flightState').textContent=grounded?(brake?'BRAKES ON':state.speed>3?'TAKEOFF ROLL':'ON RUNWAY'):(state.speed<p.stall?'STALL WARNING':state.vs>1?'CLIMBING':state.vs< -1?'DESCENDING':'LEVEL FLIGHT');if(!grounded&&state.speed<p.stall)announce('STALL WARNING! Lower the nose and increase power.');else if(grounded&&brake&&state.throttle>.4)announce('Release the brake before takeoff.')}
}
// Start aligned behind the parked aircraft; do not ease from a camera hundreds of feet away.
let camEye=[0,5.7,-153],camTarget=[0,2.0,-138],cameraSnap=true;
function snapCamera(){cameraSnap=true;}
function render(){const dpi=Math.min(window.devicePixelRatio||1,1.6),w=Math.max(1,Math.round(cv.clientWidth*dpi)),h=Math.max(1,Math.round(cv.clientHeight*dpi));if(cv.width!==w||cv.height!==h){cv.width=w;cv.height=h;gl.viewport(0,0,w,h)}
if(weather==='storm')gl.clearColor(.42,.52,.60,1);else if(weather==='breezy')gl.clearColor(.57,.72,.79,1);else gl.clearColor(.61,.77,.87,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
const f=[Math.sin(state.yaw)*Math.cos(state.pitch),Math.sin(state.pitch),Math.cos(state.yaw)*Math.cos(state.pitch)],pos=[state.x,state.y,state.z];let eye,target;
if(camera===2){
 eye=add(pos,add(f.map(n=>n*1.0),[0,1.48,0]));
 target=add(eye,f.map(n=>n*40));
}else{
 // The previous camera looked 23 metres ahead of the aircraft rather than AT it,
 // projecting the fuselage below the viewport. Keep the model near screen centre.
 const distance=camera===1?7.3:13.5;
 const lift=camera===1?3.2:5.3;
 eye=add(pos,add(f.map(n=>-n*distance),[0,lift,0]));
 target=add(pos,add(f.map(n=>n*2.3),[0,1.4,0]));
}
if(cameraSnap){camEye=eye.slice();camTarget=target.slice();cameraSnap=false}
else{const factor=1-Math.exp(-6/60);camEye=camEye.map((v,i)=>mix(v,eye[i],factor));camTarget=camTarget.map((v,i)=>mix(v,target[i],factor))}
const view=viewMatrix(camEye,camTarget),proj=projection((camera===2?73:camera===1?62:61)*Math.PI/180,w/h,.15,2300);
draw(field,identity(),view,proj,camEye);
 draw(worldObjects,identity(),view,proj,camEye);
 if(active&&!missionFinished&&(selectedMission===1||selectedMission===3)){
  const indexLimit=selectedMission===3?5:checkpoints.length;
  for(let i=missionIndex;i<Math.min(indexLimit,missionIndex+3);i++){
   const point=checkpoints[i];
   draw(markerMeshes.ring,move(point[0],point[1],point[2]),view,proj,camEye);
  }
 }
 if(active&&selectedMission===2&&!missionFinished&&missionIndex<3){
  const point=landmarks[missionIndex];draw(markerMeshes.ring,move(point.x,point.y,point.z),view,proj,camEye);
 }
 if(active)for(const bot of bots){
  if(bot.hp<=0)continue;
  const shape=bot.friendly?aiShape:enemyShape,botMat=multiply(move(bot.x,bot.y,bot.z),yaw(bot.phase*.24));
  draw(shape.mesh,botMat,view,proj,camEye);
  draw(shape.prop,multiply(botMat,move(...shape.offset)),view,proj,camEye);
  if(bot.hp<50&&!bot.friendly){
   // Low-poly dark plume communicates a damaged aircraft at a distance.
   const smokeMesh=markerMeshes.ring;
   const plume=move(bot.x,bot.y+6+Math.sin(bot.phase*3)*2,bot.z-8);
   draw(smokeMesh,multiply(plume,roll(Math.PI/2)),view,proj,camEye);
  }
 }
const orientation=multiply(yaw(state.yaw),multiply(pitch(-state.pitch),roll(-state.roll))),base=multiply(move(...pos),orientation);
draw(model.mesh,base,view,proj,camEye);draw(model.prop,multiply(base,multiply(move(...model.offset),roll(propAngle))),view,proj,camEye)
}
function frame(time){const dt=Math.min(.055,Math.max(0,(time-last)/1000));last=time;step(dt);render();updateAudio();requestAnimationFrame(frame)}
reset();requestAnimationFrame(frame);
})();