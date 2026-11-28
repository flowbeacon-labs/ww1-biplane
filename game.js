(()=>{'use strict';
const $=id=>document.getElementById(id),cv=$('flight'),gl=cv.getContext('webgl',{antialias:true,alpha:false,powerPreference:'high-performance'});
cv.addEventListener('webglcontextlost',e=>{e.preventDefault();$('error').hidden=false;$('error').textContent='Graphics context lost. Reload the game to restore the 3D scene.'});
if(!gl){$('error').hidden=false;$('error').textContent='WebGL unavailable. Try a newer browser with hardware acceleration enabled.';return}
try {
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
 upload(){
 if(this.buf)return;
 this.count=this.pos.length/3;
 this.buf=[this.pos,this.nrm,this.col].map(data=>{
  const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.STATIC_DRAW);return b;
 });
 // WebGL owns a copy after bufferData. Free CPU geometry buffers to avoid
 // retaining the full scene twice. Meshes are rebuilt after quality changes.
 this.pos=[];this.nrm=[];this.col=[];
}
 destroy(){if(this.buf){for(const b of this.buf)gl.deleteBuffer(b);this.buf=null}}
}

// World-space runway metadata shared by rendering, touchdown detection and navigation.
// Axis "z" means length runs north/south; "x" runs east/west.
const RUNWAYS=Object.freeze([
 {id:'home',name:'Home Airfield',x:0,z:0,length:610,width:28,axis:'z'},
 {id:'west',name:'Western Meadow Strip',x:-560,z:-310,length:310,width:26,axis:'z'},
 {id:'east',name:'Eastern Patrol Strip',x:565,z:-310,length:320,width:26,axis:'z'},
 {id:'north',name:'Northern Farm Strip',x:0,z:635,length:320,width:28,axis:'x'}
]);
function runwayLocal(strip,x,z){return {along:strip.axis==='z'?z-strip.z:x-strip.x,across:strip.axis==='z'?x-strip.x:z-strip.z}}
function runwayAt(x,z,margin=0){return RUNWAYS.find(strip=>{const p=runwayLocal(strip,x,z);return Math.abs(p.along)<=strip.length/2+margin&&Math.abs(p.across)<=strip.width/2+margin})||null}
function touchdownIsHard(flight,strip,mode,stallSpeed){
 const arcadeStrip=mode==='arcade'&&strip;
 const sideways=strip&&Math.abs(strip.axis==='z'?Math.sin(flight.yaw):Math.cos(flight.yaw))>Math.sin(Math.PI/6);
 return sideways||flight.vs<(arcadeStrip?-10:mode==='arcade'?-8:mode==='balanced'?-5:-3.8)||
  Math.abs(flight.roll)>(arcadeStrip?.65:mode==='arcade'?.50:.36)||
  Math.abs(flight.pitch)>(arcadeStrip?.42:.33)||
  flight.speed>stallSpeed*(arcadeStrip?2.3:mode==='arcade'?2.1:1.85);
}
function nearestRunway(x,z){return RUNWAYS.map(strip=>{const p=runwayLocal(strip,x,z),dx=Math.max(0,Math.abs(p.across)-strip.width/2),dz=Math.max(0,Math.abs(p.along)-strip.length/2);return {strip,distance:Math.hypot(dx,dz)} }).sort((a,b)=>a.distance-b.distance)[0]}
function runwayMesh(mesh,strip,surface){
 const len=strip.length,width=strip.width,x=strip.x,z=strip.z,alongZ=strip.axis==='z';
 const box=(offset,across,w,l,c,y=.07)=>alongZ?mesh.box(x+across,y,z+offset,w,.06,l,c):mesh.box(x+offset,y,z+across,l,.06,w,c);
 box(0,0,width,len,surface,.03);
 for(let d=-len/2+17;d<len/2-15;d+=27)box(d,0,1.25,12,D.white,.088);
 for(const side of [-1,1])for(let d=-len/2+12;d<len/2-8;d+=17)box(d,side*(width/2-1.2),.48,3,D.white,.089);
 for(const d of [-len/2+5,len/2-5])box(d,0,width-3,1,D.white,.091);
 // Threshold markers, windsock, a small hangar and a radio marker identify each strip.
 if(strip.id!=='home'){
  const hx=alongZ?x+width/2+24:x+len/2+26,hz=alongZ?z:z+width/2+25;
  mesh.box(hx,4,hz,18,8,14,D.wood);mesh.box(hx,8.8,hz,21,2,17,D.steel);
  const wx=alongZ?x-width/2-11:x-len/2-11,wz=alongZ?z-len/2+38:z-width/2-10;
  mesh.tube([wx,0,wz],[wx,10,wz],.10,D.steel,5);
  mesh.box(wx+1.4,10,wz,3.3,.9,1.25,D.red);
 }
}

function makeField(theme='flanders',quality='normal'){const m=new Mesh();
const low=quality==='low';
const grass=theme==='picardy'?[.48,.47,.30]:theme==='italy'?[.33,.50,.32]:D.grass;
const strip=theme==='picardy'?[.63,.52,.36]:theme==='italy'?[.55,.57,.46]:D.strip;
m.box(0,-.30,0,1700,.55,1700,grass);
let seed=42;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)|0;return(seed>>>0)/4294967296};
for(let i=0;i<(low?45:260);i++){const x=(rand()-.5)*1550,z=(rand()-.5)*1550;if(Math.abs(x)<24&&Math.abs(z)<320)continue;m.box(x,.004,z,2+rand()*9,.025,3+rand()*9,rand()<.5?grass:theme==='picardy'?[.55,.52,.34]:D.patch)}
for(const x of (low?[-83,88]:[-83,-50,53,88])){m.box(x,5.5,78,27,11,27,theme==='italy'?D.white:D.wood);m.box(x,11.9,78,30,2,30,theme==='picardy'?D.red:D.steel);m.box(x,5.6,64,17,9,.45,D.black)}
for(let i=0;i<(low?14:62);i++){let x=(rand()-.5)*1450,z=(rand()-.5)*1450;if(Math.abs(x)<130&&Math.abs(z)<365)continue;let h=6+rand()*10;m.tube(v(x,.1,z),v(x,h*.42,z),.46,D.wood,5);m.tube(v(x,h*.4,z),v(x,h,z),2,rand()<.5?D.grass:D.patch,8)}
// Additional landing strips and threshold markings are generated above.
if(theme==='italy'&&!low){
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
for(const stripInfo of RUNWAYS)runwayMesh(m,stripInfo,strip);
return m}
let field=makeField();
// Decorative lights are generated once and only rendered in Evening mode.
// These lights help pilots recognize all four airstrips on approach.
const sunsetScenery=(()=>{
 const m=new Mesh();
 for(const strip of RUNWAYS){
  const half=strip.length/2;
  for(let d=-half+10;d<=half-10;d+=19){
   for(const side of [-1,1]){
    const x=strip.axis==='z'?strip.x+side*(strip.width/2+1.6):strip.x+d;
    const z=strip.axis==='z'?strip.z+d:strip.z+side*(strip.width/2+1.6);
    m.box(x,.26,z,.9,.35,.9,[1,.81,.38]);
   }
  }
  for(const end of [-1,1]){
   for(let i=-2;i<=2;i++){
    const x=strip.axis==='z'?strip.x+i*2.8:strip.x+end*(half-4);
    const z=strip.axis==='z'?strip.z+end*(half-4):strip.z+i*2.8;
    m.box(x,.27,z,1.1,.35,1.1,[.95,.78,.46]);
   }
  }
 }
 return m;
})();
function makeSunDisc(){
 const m=new Mesh(),cx=-350,cy=175,cz=940;
 for(const [radius,color] of [[64,[.99,.68,.42]],[44,[1,.86,.57]],[30,[1,.96,.74]]]){
  for(let i=0;i<40;i++){
   const a=i*TAU/40,b=(i+1)*TAU/40;
   m.tri([cx,cy,cz],[cx+Math.cos(a)*radius,cy+Math.sin(a)*radius,cz],[cx+Math.cos(b)*radius,cy+Math.sin(b)*radius,cz],color);
  }
 }
 return m;
}
const sunsetSun=makeSunDisc();
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
// Flight-school rings remain well clear of the runway corridor (|x| <= 14 m).
// Start east of the field, loop over farmland, and finish west of the runway.
const checkpoints=[
 [95,82,95],[175,105,175],[270,110,265],[335,120,375],[240,120,480],
 [105,100,515],[-105,115,485],[-245,100,365],[-285,90,215],[-110,80,95]
];
const landmarks=[
 {name:'Village',x:-325,z:300,y:48},
 {name:'River Bridge',x:345,z:315,y:47},
 {name:'Railway Station',x:-330,z:-285,y:48}
];
const fallbackProgress=()=>({version:1,xp:0,flights:0,landings:0,medals:0,completed:{},best:{},settings:{difficulty:'arcade',weather:'clear',livery:'classic',airfield:'flanders',timeOfDay:'day',trainingInstructions:'on',graphicsQuality:'normal'},missionsCompleted:0});
function cleanCareer(value){
 const c=fallbackProgress();if(!value||typeof value!=='object')return c;
 for(const k of ['xp','flights','landings','medals'])c[k]=Math.max(0,Math.min(10000000,Number.isFinite(value[k])?Math.floor(value[k]):0));
 for(const k of ['completed','best']){if(value[k]&&typeof value[k]==='object'&&!Array.isArray(value[k]))for(const m of missions){let v=value[k][m.id];if(k==='completed')c[k][m.id]=Boolean(v);else if(Number.isFinite(v))c[k][m.id]=Math.max(0,Math.min(1000000,Math.floor(v)))}}
 if(value.settings&&typeof value.settings==='object'){
  if(DIFFICULTIES.includes(value.settings.difficulty))c.settings.difficulty=value.settings.difficulty;
  if(WEATHERS.includes(value.settings.weather))c.settings.weather=value.settings.weather;
  if(['on','off'].includes(value.settings.trainingInstructions))c.settings.trainingInstructions=value.settings.trainingInstructions;
  if(['normal','low'].includes(value.settings.graphicsQuality))c.settings.graphicsQuality=value.settings.graphicsQuality;
  if(['day','evening'].includes(value.settings.timeOfDay))c.settings.timeOfDay=value.settings.timeOfDay;
  if(['classic','sky','ace'].includes(value.settings.livery))c.settings.livery=value.settings.livery;
  if(Object.prototype.hasOwnProperty.call(AIRFIELDS,value.settings.airfield))c.settings.airfield=value.settings.airfield;
 }
 c.missionsCompleted=missions.filter(m=>c.completed[m.id]).length;
 return c;
}
function loadCareer(){try{return cleanCareer(JSON.parse(localStorage.getItem(SAVE_KEY)||'null'))}catch{return fallbackProgress()}}
let lastLandingStrip=null;
let career=loadCareer(),selectedMission=0,missionTime=0,missionScore=0,missionStage=0,missionIndex=0,missionFinished=false,airborne=false,damage=100,fuel=100,trainingShots=0,photoDone=new Set(),formationClock=0,weatherClock=0,fireCooldown=0,smokeTime=0,missionMarks=[],missionRender=[],enemyDefeated=false;
let difficulty=career.settings.difficulty,weather=career.settings.weather,paintScheme=career.settings.livery,airfield=career.settings.airfield,timeOfDay=career.settings.timeOfDay,trainingInstructions=career.settings.trainingInstructions,graphicsQuality=career.settings.graphicsQuality,windClock=0,joystick={x:0,y:0},joystickPointer=null,enemyFireClock=0,missionPending=false,planePending=false;
const friendlyWingmen=[{offset:-17,phase:0,color:'#dfc18c'},{offset:17,phase:2,color:'#b8c8d0'}],bots=[];
const aiShape=makeAircraft(planes[3]),enemyShape=makeAircraft(planes[1]);
const markerMeshes=(()=>{const ring=new Mesh(),gold=D.gold;for(let i=0;i<40;i++){const a=i*TAU/40,b=(i+1)*TAU/40;ring.tube([Math.cos(a)*10,Math.sin(a)*10,0],[Math.cos(b)*10,Math.sin(b)*10,0],.58,i%2?D.white:gold,5)}
 return {ring,marker:ring}})();
// Quiet remembrance garden is placed west of the home runway, outside all
// landing zones and the checkpoint-ring corridor. Visual only, no collision.
const WAR_MEMORIAL=Object.freeze({x:-195,z:125,flagHeight:17});
function buildMemorialBase(m){
 const {x,z,flagHeight}=WAR_MEMORIAL;
 m.box(x,0.18,z,24,.35,23,D.strip);
 for(const side of [-1,1]){
  m.box(x+side*9,1.1,z,1.8,1.8,17,D.steel);
  m.box(x+side*9,2.2,z,2.5,.5,18,D.white);
 }
 m.box(x,1.2,z-2,10,2.4,7,D.steel);
 m.box(x,3.3,z-2,7,2.1,4.5,D.white);
 m.box(x,5.9,z-2,2.1,3.4,2.1,D.steel);
 m.box(x,7.8,z-2,3.6,.6,3.6,D.white);
 m.box(x,3.55,z-4.35,4.8,.45,.12,D.gold); // plaque
 m.tube([x-9,0,z+7],[x-9,flagHeight,z+7],.28,D.steel,8);
 m.box(x-9,flagHeight+.25,z+7,1,.5,1,D.gold);
 for(const dx of [-6,-3,0,3,6])m.box(x+dx,.5,z+6,1,1.0,1.8,dx%2?D.white:D.red);
}
// Flag geometry faces north/south and uses only a few triangles; regenerate
// when the chosen aircraft country changes, releasing its old GPU buffers.
function makeMemorialFlag(country){
 const m=new Mesh(),{x,z,flagHeight}=WAR_MEMORIAL;
 const poleX=x-9,baseX=poleX+.45,baseZ=z+7;
 const w=11,h=6,top=flagHeight-.7;
 const panel=(px,py,pw,ph,c)=>m.box(baseX+px,top-py,baseZ,pw,ph,.12,c);
 const white=[.96,.95,.89],red=[.82,.15,.13],blue=[.11,.20,.52],black=[.10,.10,.12],gold=[.95,.78,.18],green=[.10,.51,.24];
 const side=country==='France'||country==='Italy';
 const colors=country==='France'?[blue,white,red]:[green,white,red];
 if(side){
  for(let i=0;i<3;i++)panel((i+.5)*w/3,(h/2),w/3,h,colors[i]);
 }else if(country==='Germany'){
  for(let i=0;i<3;i++)panel(w/2,(i+.5)*h/3,w,h/3,[black,red,gold][i]);
 }else if(country==='United States'){
  for(let i=0;i<13;i++)panel(w/2,(i+.5)*h/13,w,h/13,i%2===0?red:white);
  panel(w*.21,h*.27,w*.42,h*.54,blue);
  for(let row=0;row<4;row++)for(let col=0;col<5;col++)
   panel(.48+col*.82,.55+row*.66,.23,.23,white);
 }else{ // Simplified Union Jack for United Kingdom
  panel(w/2,h/2,w,h,blue);
  const diagonals=[
   [[0,0],[w,h]],[[0,h],[w,0]]
  ];
  for(const [a,b] of diagonals){
   const segments=20;
   for(let i=0;i<segments;i++){
    const t=(i+.5)/segments,px=a[0]+(b[0]-a[0])*t,py=a[1]+(b[1]-a[1])*t;
    panel(px,py,w/segments+0.3,.55,white);
   }
  }
  panel(w/2,h/2,w,1.5,white);panel(w/2,h/2,1.8,h,white);
  panel(w/2,h/2,w,.68,red);panel(w/2,h/2,.85,h,red);
 }
 return m;
}
function makeWorldObjects(quality='normal'){const m=new Mesh();const low=quality==='low';const r=()=>Math.random();
 buildMemorialBase(m);
 // River and a stone bridge, deliberately outside the takeoff strip.
 m.box(355,-.07,150,53,.06,780,[.22,.50,.64]);
 m.box(355,1.2,315,63,2.5,10,D.steel);
 // Railroad with sleepers and a station.
 for(const x of [-342,-330])m.box(x,.16,-260,1,.35,560,D.steel);
 for(let z=-540;z<20;z+=(low?30:9))m.box(-336,.20,z,25,.20,1.4,D.wood);
 m.box(-382,6,-290,36,12,20,D.wood);m.box(-382,13,-290,39,3,24,D.red);
 // Countryside village blocks.
 for(let i=0;i<(low?5:17);i++){const x=-390+(i%5)*25,z=250+Math.floor(i/5)*28,hh=6+(i%3)*3;m.box(x,hh/2,z,14,hh,14,i%3===0?D.wood:D.white);m.box(x,hh+1,z,17,2.5,17,i%2?D.red:D.steel)}
 // Village church and water tower make the route recognizable.
 m.box(-330,20,370,9,40,9,D.white);m.box(-330,42,370,13,5,13,D.red);
 m.tube([480,0,-330],[480,38,-330],3,D.steel);m.box(480,42,-330,18,9,18,D.wood);
 // A few farms and roads.
 m.box(-250,.02,400,12,.04,360,D.strip);m.box(250,.02,-320,10,.04,260,D.strip);
 for(const [x,z] of [[-230,480],[230,-385],[450,-30],[-480,-80]]){m.box(x,5,z,24,10,20,D.wood);m.box(x,11,z,28,2,24,D.red)}
 // Layered clouds create visible sky landmarks at different altitudes.
 for(const [x,y,z] of (low?[]:[[-150,170,120],[140,190,310],[-370,200,-200],[390,170,-140],[-70,230,510],[470,235,405],[-510,210,420]])){
  const cloud=[.89,.92,.95];m.box(x,y,z,50,11,25,cloud);
  m.box(x-19,y+5,z,33,13,27,cloud);m.box(x+13,y+7,z,30,17,28,D.white);
 }
 return m;
}
let worldObjects=makeWorldObjects(graphicsQuality);
let memorialFlag=makeMemorialFlag(planes[selected].country);
function saveCareer(){career.settings={difficulty,weather,livery:paintScheme,airfield,timeOfDay,trainingInstructions,graphicsQuality};try{localStorage.setItem(SAVE_KEY,JSON.stringify(cleanCareer(career)))}catch{announce('Save unavailable. Export your pilot file to back up progress.')}refreshCareer()}
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
 timeOfDay=$('timeOfDay').value==='evening'?'evening':'day';
 const desiredQuality=$('graphicsQuality')?.value==='low'?'low':'normal';
 trainingInstructions=$('trainingInstructions')?.value==='off'?'off':'on';
 $('app').dataset.weather=weather;$('app').dataset.graphics=desiredQuality;
 const newAirfield=AIRFIELDS[$('airfield').value]?$('airfield').value:'flanders';
 if(newAirfield!==airfield||desiredQuality!==graphicsQuality){
  field.destroy();worldObjects.destroy();
  airfield=newAirfield;graphicsQuality=desiredQuality;
  field=makeField(airfield,graphicsQuality);worldObjects=makeWorldObjects(graphicsQuality);
 }
 $('airfieldLabel').textContent=AIRFIELDS[airfield];
 if((paintScheme==='sky'&&career.xp<100)||(paintScheme==='ace'&&career.xp<400)){paintScheme='classic';$('livery').value='classic';announce('Earn XP to unlock that paint scheme.')}
 setLivery();saveCareer();updateLandingCoach();
}
for(const id of ['difficulty','weather','livery','airfield','timeOfDay','trainingInstructions','graphicsQuality']){
 const control=$(id);
 if(!control){
  // Older HTML may remain cached while a newer game.js loads. Training defaults ON.
  if(id==='trainingInstructions'||id==='graphicsQuality'){console.warn('Optional setting '+id+' missing in cached page; using default.');continue}
  throw Error('Required game setting missing: '+id+'. Refresh the page to load matching HTML and JavaScript.');
 }
 control.value=career.settings[id];
 control.addEventListener('change',syncSettings);
}
field.destroy();worldObjects.destroy();field=makeField(airfield,graphicsQuality);worldObjects=makeWorldObjects(graphicsQuality);$('app').dataset.graphics=graphicsQuality;$('airfieldLabel').textContent=AIRFIELDS[airfield];$('app').dataset.weather=weather;
$('missionMenu').addEventListener('click',()=>{pause()});
$('pauseFlight').addEventListener('click',()=>{pause()});
function setupMission(){
 missionTime=0;missionScore=0;missionStage=0;missionIndex=0;coachCollapsed=false;missionFinished=false;airborne=false;lastLandingStrip=null;photoDone.clear();formationClock=0;enemyDefeated=false;trainingShots=0;damage=100;fuel=100;fireCooldown=0;smokeTime=0;windClock=0;enemyFireClock=0;
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
function landingTarget(){const strip=nearestRunway(state.x,state.z).strip;return [strip.x,6,strip.z]}
function currentTarget(){
 if(selectedMission===1||selectedMission===3)return missionIndex>=(selectedMission===3?5:checkpoints.length)?landingTarget():checkpoints[missionIndex];
 if(selectedMission===2)return landmarks[missionIndex]?[landmarks[missionIndex].x,landmarks[missionIndex].y,landmarks[missionIndex].z]:landingTarget();
 if(selectedMission===5)return bots.find(b=>!b.friendly&&b.hp>0)?[bots[0].x,bots[0].y,bots[0].z]:landingTarget();
 return null;
}
function objectiveText(){
 if(missionFinished)return 'Mission complete! Choose another mission from the menu.';
 const m=missions[selectedMission];
 if(selectedMission===0)return missionStage===0?'Take off and climb above 80 metres.':missionStage===1?'Land gently at any marked airstrip.':'Complete';
 if(selectedMission===1)return missionIndex<checkpoints.length?'Pass ring '+(missionIndex+1)+' of '+checkpoints.length+'.':'Land at any marked airstrip.';
 if(selectedMission===2)return missionIndex<3?'Fly near '+landmarks[missionIndex].name+' and press PHOTO.':'Land at any marked airstrip.';
 if(selectedMission===3)return missionIndex<5?'Follow wingmen through waypoint '+(missionIndex+1)+' / 5.':'Return to base and land.';
 if(selectedMission===4)return missionStage===0?'Climb above 75 m; your engine will lose power.':'Engine failure: land on any marked strip.';
 if(selectedMission===5)return enemyDefeated?'Return to base and land.':'Get behind the red training aircraft and press FIRE.';
 return m.goal;
}
// Calculated from each aircraft's simplified stall speed; these are GAME targets,
// not real-world aircraft operating speeds.
function landingLessonSnapshot(){
 const aircraft=planes[selected],speedKmh=Math.round(state.speed*3.6),altitude=Math.max(0,state.y-.48);
 const targetKmh=Math.round(aircraft.stall*1.45*3.6),takeoffKmh=Math.round(aircraft.stall*1.3*3.6);
 const nearest=nearestRunway(state.x,state.z),strip=nearest.strip;
 const distance=Math.round(Math.hypot(state.x-strip.x,state.z-strip.z));
 const bearing=Math.atan2(strip.x-state.x,strip.z-state.z);
 const delta=Math.atan2(Math.sin(bearing-state.yaw),Math.cos(bearing-state.yaw));
 const turn=delta>.20?'RIGHT (D / joystick right)':delta<-.20?'LEFT (A / joystick left)':'straight';
 const targetDirection=bearingToCardinal(strip.x-state.x,strip.z-state.z);
 const direction=strip.axis==='z'?(state.z>=strip.z?180:0):(state.x>=strip.x?270:90);
 const heading=(Math.round((state.yaw*180/Math.PI)%360)+360)%360;
 const headingError=Math.abs(Math.atan2(Math.sin(state.yaw-direction*Math.PI/180),Math.cos(state.yaw-direction*Math.PI/180)));
 const readout='Speed '+speedKmh+' km/h · Alt '+Math.round(altitude)+' m · Heading '+String(heading).padStart(3,'0')+'° · Sink '+state.vs.toFixed(1)+' m/s';
 let step=1,title='',instruction='';
 if(missionFinished){step=5;title='Lesson completed';instruction='You landed safely. Open PAUSE to choose another mission.';}
 else if(grounded&&!airborne){
  step=1;title='Take off from the runway';
  instruction=brake?'Release BRAKE, then hold + POWER.':'Hold + POWER. At about '+takeoffKmh+' km/h, pull the joystick gently up (W).';
 }else if(missionStage===0){
  step=2;title='Climb steadily to 80 m';
  instruction='Aim for '+Math.round(targetKmh*1.25)+'–'+Math.round(targetKmh*1.7)+' km/h. Hold a gentle climb, not a steep pull. Current altitude: '+Math.round(altitude)+' / 80 m.';
 }else if(distance>190){
  step=3;title='Turn back toward an airstrip';
  instruction=turn==='straight'?'Good direction. Head '+targetDirection+' toward '+strip.name+' ('+distance+' m), and gradually descend toward 50 m.':'Head '+targetDirection+'. Bank '+turn+' in short presses until the airstrip is ahead. Target: '+strip.name+' ('+distance+' m). Keep altitude around 50–80 m.';
 }else if(altitude>22||distance>75||headingError>.42){
  step=4;title='Line up and slow down';
  const directionText=strip.axis==='z'?'north–south':'east–west';
  if(headingError>.42)instruction='Align with the '+directionText+' strip. Aim '+compassHeading(direction*Math.PI/180).cardinal+' ('+String(direction).padStart(3,'0')+'°). Use brief gentle turns and level the wings.';
  else if(speedKmh>targetKmh+16)instruction='Reduce throttle toward 20–35% to slow to roughly '+targetKmh+' km/h. Keep the wings level.';
  else if(altitude>22)instruction='Good alignment. Ease the nose down (S / joystick down) until around 15–20 m. Keep '+(targetKmh-12)+'–'+(targetKmh+12)+' km/h.';
  else instruction='Follow the runway centerline. Ease down toward 8–12 m, aiming for about '+targetKmh+' km/h.';
 }else{
  step=5;title='Gentle touchdown';
  if(Math.abs(state.vs)>3.5&&state.vs<0)instruction='Descending too quickly! Raise the nose slightly. Aim for sink rate gentler than 3 m/s.';
  else if(speedKmh>targetKmh+18)instruction='Too fast. Reduce POWER and keep the aircraft centered over the runway.';
  else instruction='Keep wings level and nose almost level. Settle gently onto the marked strip; use BRAKE after touchdown.';
 }
 return{step,title,instruction,readout,targetKmh,strip:strip.id,distance};
}
let coachCollapsed=false;
function trainingReadout(){
 const spd=Math.round(state.speed*3.6),height=Math.max(0,Math.round(state.y-.48));
 return 'Speed '+spd+' km/h · Alt '+height+' m · Throttle '+Math.round(state.throttle*100)+'%';
}
// 0° points north (+Z); 90° points east (+X). 8-point labels help new pilots.
function compassHeading(radians){
 const degrees=((Math.round(radians*180/Math.PI)%360)+360)%360;
 const names=['NORTH','NORTHEAST','EAST','SOUTHEAST','SOUTH','SOUTHWEST','WEST','NORTHWEST'];
 return {degrees,cardinal:names[Math.round(degrees/45)%8]};
}
function bearingToCardinal(dx,dz){return compassHeading(Math.atan2(dx,dz)).cardinal}
function updateCompass(){
 const heading=compassHeading(state.yaw),needle=$('compassNeedle');
 if(needle)needle.style.transform='rotate('+heading.degrees+'deg)';
 const name=$('directionalHeading');if(name)name.textContent=heading.cardinal;
 const degrees=$('compassDegrees');if(degrees)degrees.textContent=String(heading.degrees).padStart(3,'0')+'°';
 const box=$('headingCompass');if(box)box.setAttribute('aria-label','Flying '+heading.cardinal+' at '+heading.degrees+' degrees');
}
function trainingNavigation(target){
 const dx=target[0]-state.x,dz=target[2]-state.z,dist=Math.round(Math.hypot(dx,dz));
 const bearing=Math.atan2(dx,dz);
 const delta=Math.atan2(Math.sin(bearing-state.yaw),Math.cos(bearing-state.yaw));
 const cardinal=bearingToCardinal(dx,dz);
 const turn=delta>.17?'Head '+cardinal+': turn RIGHT using D / joystick right.':delta<-.17?'Head '+cardinal+': turn LEFT using A / joystick left.':'Head '+cardinal+': keep this heading and fly straight.';
 return {dist,turn,alt:Math.round(Math.abs(target[1]-state.y)),turnError:Math.abs(delta)};
}
function genericTakeoff(missionName){
 const p=planes[selected],takeoff=Math.round(p.stall*1.3*3.6);
 return {step:1,title:missionName+': Take off',instruction:brake?'Release BRAKE, then hold + POWER.':'Increase throttle. At about '+takeoff+' km/h, gently pull back (W / joystick up) to climb.',readout:trainingReadout()};
}
function returnLandingLesson(missionName){
 const p=planes[selected],approach=Math.round(p.stall*1.45*3.6),near=nearestRunway(state.x,state.z),strip=near.strip;
 const nav=trainingNavigation([strip.x,12,strip.z]),height=state.y-.48,spd=Math.round(state.speed*3.6);
 const angle=(Math.round((state.yaw*180/Math.PI)%360)+360)%360;
 const direction=strip.axis==='z'?(state.z>=strip.z?180:0):(state.x>=strip.x?270:90);
 const alignment=Math.abs(Math.atan2(Math.sin(state.yaw-direction*Math.PI/180),Math.cos(state.yaw-direction*Math.PI/180)));
 const readout=trainingReadout()+' · Runway '+strip.name;
 if(near.distance>190){
  return{step:4,title:missionName+': Return to an airstrip',instruction:nav.turn+' Target '+strip.name+', approximately '+nav.dist+' m away. Start a gentle descent toward 40–60 m.',readout};
 }
 if(alignment>.35){
  return{step:4,title:'Align with the runway',instruction:'Approach along the runway, not sideways. Head '+compassHeading(direction*Math.PI/180).cardinal+' ('+String(direction).padStart(3,'0')+'°), currently '+String(angle).padStart(3,'0')+'°. Make short turns, then level your wings.',readout};
 }
 if(height>18||spd>approach+18){
  return{step:4,title:'Slow down and descend',instruction:'Aim for about '+approach+' km/h. If too fast, reduce POWER toward 20–35%. Descend toward 10–18 m, keeping the runway centered.',readout};
 }
 return{step:5,title:'Final approach: Touch down',instruction:'Maintain about '+approach+' km/h, wings level, a nearly level nose and a descent slower than 3 m/s. Settle on the marked runway, then apply BRAKE.',readout};
}
function missionLessonSnapshot(){
 if(selectedMission===0)return landingLessonSnapshot();
 const mission=missions[selectedMission],name=mission.name,p=planes[selected];
 const safeSpeed=Math.round(p.stall*1.5*3.6);
 const base=trainingReadout();
 if(missionFinished)return {step:5,title:'Mission complete',instruction:'Great flying. Press PAUSE to select another mission or aircraft.',readout:base};
 if(grounded&&!airborne)return genericTakeoff(name);
 if(selectedMission===1){
  if(missionIndex>=checkpoints.length)return returnLandingLesson('Sky Rings');
  const point=checkpoints[missionIndex],nav=trainingNavigation(point),current=missionIndex+1;
  if(missionIndex===0&&state.y<point[1]-30)return{step:2,title:'Climb to the first ring',instruction:'Climb toward '+Math.round(point[1])+' m. Keep around '+safeSpeed+' km/h or faster, and avoid steep climbs.',readout:base+' · Ring '+current+'/10'};
  return{step:missionIndex<3?2:3,title:'Fly through ring '+current+' of 10',instruction:nav.turn+' Ring '+nav.dist+' m away, target altitude '+point[1]+' m (difference '+nav.alt+' m). Fly through its CENTER, then follow the next ring.',readout:base+' · Rings '+missionIndex+'/10'};
 }
 if(selectedMission===2){
  if(missionIndex>=landmarks.length)return returnLandingLesson('Recon Patrol');
  const place=landmarks[missionIndex],nav=trainingNavigation([place.x,place.y,place.z]);
  return{step:missionIndex===0?2:3,title:'Photograph '+place.name+' ('+(missionIndex+1)+'/3)',instruction:nav.turn+' Fly within 145 m of '+place.name+' (now '+Math.round(Math.hypot(state.x-place.x,state.y-place.y,state.z-place.z))+' m away). Hold a steady height near '+place.y+' m and press PHOTO (P).',readout:base+' · Photos '+missionIndex+'/3'};
 }
 if(selectedMission===3){
  if(missionIndex>=5)return returnLandingLesson('Formation');
  const wp=checkpoints[missionIndex],nav=trainingNavigation(wp);
  const friendly=bots.filter(b=>b.friendly);
  const close=friendly.length?Math.round(Math.min(...friendly.map(b=>Math.hypot(state.x-b.x,state.y-b.y,state.z-b.z)))):0;
  const ready=formationClock>=3;
  return{step:missionIndex<2?2:3,title:'Follow wingmen · checkpoint '+(missionIndex+1)+'/5',instruction:nav.turn+' Stay within 110 m of a friendly plane (nearest '+close+' m) to build 3 seconds of formation time ('+formationClock.toFixed(1)+'/3 s). '+(ready?'Now pass near the waypoint.':'Stay close before crossing the waypoint.')+' Waypoint '+nav.dist+' m away.',readout:base};
 }
 if(selectedMission===4){
  if(missionStage===0)return{step:2,title:'Climb to 75 m before engine failure',instruction:'Gain altitude slowly, using enough throttle to stay above about '+safeSpeed+' km/h. At 75 m the engine will lose most power. Start planning a return to the nearest runway.',readout:base};
  const landing=returnLandingLesson('Engine Emergency');
  landing.instruction='ENGINE POWER LIMITED TO 20%. '+landing.instruction+' Keep the nose gently down to maintain flying speed; avoid steep turns.';
  return landing;
 }
 if(selectedMission===5){
  if(enemyDefeated)return returnLandingLesson('Dogfight');
  const enemy=bots.find(b=>!b.friendly&&b.hp>0);
  if(!enemy)return{step:3,title:'Opponent disabled',instruction:'Return to a marked runway and land gently.',readout:base};
  const nav=trainingNavigation([enemy.x,enemy.y,enemy.z]),dist=Math.round(Math.hypot(enemy.x-state.x,enemy.y-state.y,enemy.z-state.z));
  if(dist>210)return{step:2,title:'Intercept the training opponent',instruction:nav.turn+' Climb toward '+Math.round(enemy.y)+' m and approach within 200 m. Keep roughly '+safeSpeed+' km/h or faster. Opponent '+dist+' m away.',readout:base+' · Hull '+Math.round(damage)+'%'};
  const bearing=Math.atan2(enemy.x-state.x,enemy.z-state.z);
  const angle=Math.atan2(Math.sin(bearing-state.yaw),Math.cos(bearing-state.yaw));
  const elevation=Math.atan2(enemy.y-state.y,Math.hypot(enemy.x-state.x,enemy.z-state.z));
  return{step:3,title:'Aim and fire on the opponent',instruction:Math.abs(angle)>.20?nav.turn+' Bring the opponent to the center of your view.':Math.abs(elevation-state.pitch)>.20?'Adjust pitch gently (W/S) until the opponent is centered vertically.':'Target centered and in range! Press FIRE (F) repeatedly. Stay within 235 m and watch HULL health.',readout:base+' · Enemy HP '+Math.max(0,Math.round(enemy.hp))+'% · Hull '+Math.round(damage)+'%'};
 }
 return{step:2,title:name,instruction:objectiveText(),readout:base};
}
function updateLandingCoach(){
 const visible=active&&!paused&&trainingInstructions==='on'&&!crashed;
 const panel=$('landingCoach');panel.hidden=!visible;
 if(!visible)return;
 const lesson=missionLessonSnapshot();
 $('coachStep').textContent=missions[selectedMission].name.toUpperCase()+' · STEP '+lesson.step+'/5';
 $('coachTitle').textContent=lesson.title;
 $('coachInstruction').textContent=lesson.instruction;
 $('coachReadout').textContent=lesson.readout;
 panel.classList.toggle('coach-collapsed',coachCollapsed);
 $('coachToggle').textContent=coachCollapsed?'SHOW TIPS':'HIDE TIPS';
 $('coachToggle').setAttribute('aria-expanded',String(!coachCollapsed));
}
$('coachToggle').addEventListener('click',()=>{coachCollapsed=!coachCollapsed;updateLandingCoach()});

function updateMissionDisplay(){
 $('objective').textContent=objectiveText();$('missionTime').textContent=formatTime(missionTime);
 $('missionScore').textContent=Math.round(missionScore)+' pts';
 $('fuel').textContent=Math.max(0,Math.round(fuel))+'%';$('health').textContent=Math.round(damage)+'%';
 const heading=compassHeading(state.yaw);$('compass').textContent=heading.cardinal+' '+String(heading.degrees).padStart(3,'0')+'°';updateCompass();
 $('windReadout').textContent=weather==='clear'?'CALM':weather==='breezy'?'BREEZY':'STORM';
 $('formationInfo').textContent=bots.filter(b=>b.friendly).length?'WINGMEN: '+bots.filter(b=>b.friendly).length:'WINGMEN: —';
 const nearest=nearestRunway(state.x,state.z);
 $('nearestStrip').textContent='NEAREST: '+nearest.strip.name+' · '+Math.round(nearest.distance)+' m';
 updateLandingCoach();
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
function notifyLanding(safe,runway=runwayAt(state.x,state.z)){
 if(!active||paused||missionFinished||!airborne)return;
 if(!safe){damage=Math.max(0,damage-45);grant(-60);announce('Hard landing! Mission failed. Restart to try again.');return}
 if(!runway){airborne=false;announce('Safe grass landing, but no runway credit. Take off and land on a marked strip.');return}
 lastLandingStrip=runway.id;announce('Touchdown at '+runway.name+'!');
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
 for(const id of ['difficulty','weather','livery','airfield','timeOfDay','trainingInstructions','graphicsQuality']){const control=$(id);if(control)control.value=career.settings[id]}trainingInstructions='on';graphicsQuality='normal';coachCollapsed=false;timeOfDay='day';airfield='flanders';field.destroy();worldObjects.destroy();field=makeField(airfield,graphicsQuality);worldObjects=makeWorldObjects(graphicsQuality);$('app').dataset.graphics=graphicsQuality;$('airfieldLabel').textContent=AIRFIELDS[airfield];$('app').dataset.weather=weather;
 saveCareer();selectedMission=0;missionPending=true;choose(0);
 announce('Pilot career reset. Export a backup before resetting next time.');
});
$('importFile').addEventListener('change',async()=>{const file=$('importFile').files?.[0];if(!file)return;if(file.size>50000){announce('Save file is too large.');return}try{const parsed=JSON.parse(await file.text());if(parsed.version!==1)throw Error('Unsupported save format');career=cleanCareer(parsed);difficulty=career.settings.difficulty;weather=career.settings.weather;paintScheme=career.settings.livery;timeOfDay=career.settings.timeOfDay;for(const id of ['difficulty','weather','livery','airfield','timeOfDay','trainingInstructions','graphicsQuality']){const control=$(id);if(control)control.value=career.settings[id]}trainingInstructions=career.settings.trainingInstructions;graphicsQuality=career.settings.graphicsQuality;coachCollapsed=false;airfield=career.settings.airfield;field.destroy();worldObjects.destroy();field=makeField(airfield,graphicsQuality);worldObjects=makeWorldObjects(graphicsQuality);$('app').dataset.graphics=graphicsQuality;$('airfieldLabel').textContent=AIRFIELDS[airfield];$('app').dataset.weather=weather;saveCareer();setLivery();announce('Pilot career imported.')}catch{announce('Unable to import that pilot file.')}finally{$('importFile').value=''}});
refreshCareer();
let audioContext=null,engineOsc=null,engineGain=null,soundEnabled=false;
function audioSetup(){if(audioContext)return;const C=window.AudioContext||window.webkitAudioContext;if(!C)return;audioContext=new C();engineOsc=audioContext.createOscillator();engineGain=audioContext.createGain();engineOsc.type='sawtooth';engineGain.gain.value=0;engineOsc.connect(engineGain);engineGain.connect(audioContext.destination);engineOsc.start()}
$('sound').addEventListener('click',()=>{soundEnabled=!soundEnabled;if(soundEnabled){audioSetup();audioContext?.resume()}$('sound').classList.toggle('sound-enabled',soundEnabled);$('sound').setAttribute('aria-pressed',String(soundEnabled));$('sound').setAttribute('aria-label',soundEnabled?'Disable engine sound':'Enable engine sound');$('sound').title=soundEnabled?'Sound on':'Sound off'});
function updateAudio(){if(!audioContext||!engineOsc||!engineGain)return;const now=audioContext.currentTime;engineOsc.frequency.setTargetAtTime(52+state.throttle*70,now,.12);engineGain.gain.setTargetAtTime(soundEnabled&&active&&!paused?.025+state.throttle*.045:0,now,.12)}
function joystickInput(){return{x:joystick.x,y:joystick.y}}
const joy=$('joyArea'),knob=$('joyKnob');
function joystickMove(e){if(joystickPointer!==e.pointerId)return;const r=joy.getBoundingClientRect(),x=e.clientX-(r.left+r.width/2),y=e.clientY-(r.top+r.height/2),mag=Math.max(1,Math.hypot(x,y)),scale=Math.min(43,mag)/mag;joystick.x=clamp(x*scale/43,-1,1);joystick.y=clamp(-y*scale/43,-1,1);knob.style.transform='translate('+joystick.x*36+'px,'+(-joystick.y*36)+'px)'}
function joystickSelectionLock(locked){
 document.documentElement.classList.toggle('joystick-held',locked);
 if(locked&&window.getSelection)window.getSelection()?.removeAllRanges();
}
function stopJoystick(e){
 if(e&&joystickPointer!==e.pointerId)return;
 joystickPointer=null;joystick.x=0;joystick.y=0;
 knob.style.transform='translate(0,0)';
 joystickSelectionLock(false);
}
joy.addEventListener('pointerdown',e=>{
 if(joystickPointer!==null)return;
 if(e.pointerType==='mouse'&&e.button!==0)return;
 joystickPointer=e.pointerId;
 joystickSelectionLock(true);
 joy.setPointerCapture(e.pointerId);joystickMove(e);e.preventDefault();
});
joy.addEventListener('pointermove',joystickMove);
for(const event of ['pointerup','pointercancel','lostpointercapture'])joy.addEventListener(event,stopJoystick);
// iOS long-press selection may start on an ancestor rather than the joystick.
// Suppress native callouts while touching the stick, including long stationary holds.
for(const event of ['touchstart','touchmove'])joy.addEventListener(event,e=>e.preventDefault(),{passive:false});
joy.addEventListener('contextmenu',e=>e.preventDefault());
document.addEventListener('selectstart',e=>{
 if(joystickPointer!==null||(active&&!paused&&e.target?.closest?.('#app'))){e.preventDefault()}
});
window.addEventListener('blur',()=>stopJoystick());

const identity=()=>[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];
function multiply(a,b){const m=Array(16).fill(0);for(let col=0;col<4;col++)for(let row=0;row<4;row++)for(let k=0;k<4;k++)m[col*4+row]+=a[k*4+row]*b[col*4+k];return m}
function move(x,y,z){const m=identity();m[12]=x;m[13]=y;m[14]=z;return m}
function yaw(a){const c=Math.cos(a),s=Math.sin(a);return[c,0,-s,0,0,1,0,0,s,0,c,0,0,0,0,1]}
function pitch(a){const c=Math.cos(a),s=Math.sin(a);return[1,0,0,0,0,c,s,0,0,-s,c,0,0,0,0,1]}
function roll(a){const c=Math.cos(a),s=Math.sin(a);return[c,s,0,0,-s,c,0,0,0,0,1,0,0,0,0,1]}
function projection(fovy,aspect,near,far){const f=1/Math.tan(fovy/2);return[f/aspect,0,0,0,0,f,0,0,0,0,(far+near)/(near-far),-1,0,0,2*far*near/(near-far),0]}
function viewMatrix(eye,target){const f=unit(sub(target,eye)),r=unit(cross([0,1,0],f)),u=cross(f,r);return[r[0],u[0],-f[0],0,r[1],u[1],-f[1],0,r[2],u[2],-f[2],0,-dot(r,eye),-dot(u,eye),dot(f,eye),1]}
function compile(type,src){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s}
const vsource='precision mediump float;attribute vec3 aPos,aNrm,aCol;uniform mat4 uModel,uView,uProj;uniform vec3 uEye;uniform float uDusk;uniform float uEmissive;varying vec3 vCol;varying float fog;void main(){vec4 pos=uModel*vec4(aPos,1.);vec3 n=normalize(mat3(uModel)*aNrm);float day=max(0.,dot(n,normalize(vec3(-.44,.83,.3))));float dusk=max(0.,dot(n,normalize(vec3(-.85,.43,.25))));float l=mix(.59+.41*day,.37+.44*dusk,uDusk);vCol=mix(aCol*l,aCol,uEmissive);fog=clamp((distance(pos.xyz,uEye)-210.)/950.,0.,1.);gl_Position=uProj*uView*pos;}';
const fsource='precision mediump float;uniform float uDusk;varying vec3 vCol;varying float fog;void main(){vec3 haze=mix(vec3(.65,.78,.84),vec3(.84,.56,.47),uDusk);gl_FragColor=vec4(mix(vCol,haze,fog),1.);}';
const program=gl.createProgram();gl.attachShader(program,compile(gl.VERTEX_SHADER,vsource));gl.attachShader(program,compile(gl.FRAGMENT_SHADER,fsource));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.useProgram(program);gl.enable(gl.DEPTH_TEST);
const attributes=['aPos','aNrm','aCol'].map(k=>gl.getAttribLocation(program,k)),uniforms=['uModel','uView','uProj','uEye'].map(k=>gl.getUniformLocation(program,k)),duskUniform=gl.getUniformLocation(program,'uDusk'),emissiveUniform=gl.getUniformLocation(program,'uEmissive');
function draw(mesh,mat,view,proj,eye,unlit=false){mesh.upload();gl.uniform1f(emissiveUniform,unlit?1:0);for(const [loc,m] of [[uniforms[0],mat],[uniforms[1],view],[uniforms[2],proj]])gl.uniformMatrix4fv(loc,false,new Float32Array(m));gl.uniform3fv(uniforms[3],new Float32Array(eye));mesh.buf.forEach((b,i)=>{gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.enableVertexAttribArray(attributes[i]);gl.vertexAttribPointer(attributes[i],3,gl.FLOAT,false,0,0)});gl.drawArrays(gl.TRIANGLES,0,mesh.count)}
function choose(i){if(planes[i].unlock&&career.xp<planes[i].unlock){announce('Earn '+planes[i].unlock+' XP to unlock '+planes[i].name+'.');return}if(selected!==i)planePending=true;selected=i;setLivery();const p=planes[i];
 if(memorialFlag){memorialFlag.destroy();memorialFlag=makeMemorialFlag(p.country)}$('aircraftInfo').textContent=p.details+' The models and flight physics are historical-inspired approximations.';$('selectedAircraft').textContent=p.name+' · '+p.country;document.querySelectorAll('.plane').forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.index===i)))}
$('planes').innerHTML=planes.map((p,i)=>'<button class="plane" data-index="'+i+'" aria-pressed="'+(i===0)+'"><span class="flag">'+p.flag+'</span><strong>'+p.name+'</strong><small>'+p.country+' · '+p.year+' · '+(p.levels===3?'Triplane':'Biplane')+(p.unlock?' · '+p.unlock+' XP unlock':'')+'</small></button>').join('');
document.querySelectorAll('.plane').forEach(b=>b.addEventListener('click',()=>choose(+b.dataset.index)));choose(0);
function announce(t){$('notice').textContent=t}
function reset(){Object.assign(state,{x:0,y:.48,z:-140,yaw:0,pitch:0,roll:0,speed:0,vs:0,throttle:0});$('brake').setAttribute('aria-pressed','true');setupMission();snapCamera();grounded=true;brake=true;crashed=false;touch.clear();keys.clear();$('brake').classList.add('on');announce('Increase power, release wheel brake and accelerate along the runway.')}
let last=performance.now();
function begin(){reset();missionPending=false;planePending=false;career.flights++;saveCareer();active=true;paused=false;$('menu').hidden=true;$('app').classList.add('flight-active');$('start').textContent='RESUME FLIGHT →';last=performance.now();updateLandingCoach()}
$('start').addEventListener('click',()=>{if(active&&paused&&!crashed&&!missionPending&&!planePending){paused=false;$('menu').hidden=true;$('app').classList.add('flight-active');updateLandingCoach();last=performance.now()}else begin()});
function pause(){if(!active)return;paused=!paused;$('menu').hidden=!paused;$('app').classList.toggle('flight-active',!paused);updateLandingCoach();$('start').textContent=paused?'RESUME FLIGHT →':'START FLIGHT →'}
function returnToPlaneSelection(){
 // Preserve earned career progress, but require a new start when switching aircraft.
 keys.clear();touch.clear();joystick.x=0;joystick.y=0;
 $('joyKnob').style.transform='translate(0,0)';
 paused=true;planePending=true;
 $('menu').hidden=false;$('app').classList.remove('flight-active');updateLandingCoach();
 $('start').textContent='START NEW FLIGHT →';
 $('notice').textContent='Select your aircraft, then choose Start New Flight.';
 if(typeof document.getElementById==='function')$('planes').scrollIntoView?.({behavior:'smooth',block:'center'});
}
$('backToPlanes').addEventListener('click',returnToPlaneSelection);
const statsButton=$('hudToggle');
statsButton.addEventListener('click',()=>{
 const expanded=$('app').classList.toggle('stats-open');
 statsButton.setAttribute('aria-pressed',String(expanded));
 statsButton.setAttribute('aria-label',expanded?'Hide flight statistics':'Show flight statistics');statsButton.title=expanded?'Hide statistics':'Show statistics';
});

$('camera').addEventListener('click',()=>{camera=(camera+1)%3;snapCamera();const label=['Chase','Close','Cockpit'][camera];$('camName').textContent=label.toUpperCase();$('camera').setAttribute('aria-label','Change camera view: '+label)});
const keyMap={KeyW:'w',KeyS:'s',KeyA:'a',KeyD:'d',KeyQ:'q',KeyE:'e',ArrowUp:'up',ArrowDown:'down'};
document.addEventListener('keydown',e=>{let k=keyMap[e.code];if(k){keys.add(k);e.preventDefault()}if(e.repeat)return;if(e.code==='Space'){brake=!brake;$('brake').classList.toggle('on',brake);$('brake').setAttribute('aria-pressed',String(brake));e.preventDefault()}if(e.code==='KeyC')$('camera').click();if(e.code==='KeyR'){begin()}if(e.code==='Escape')pause();if(e.code==='KeyF')shoot();if(e.code==='KeyP')takePhoto();if(e.code==='KeyM')pause()});
document.addEventListener('keyup',e=>{let k=keyMap[e.code];if(k){keys.delete(k);e.preventDefault()}});
window.addEventListener('blur',()=>{keys.clear();touch.clear();if(active&&!paused)pause()});
document.querySelectorAll('[data-control]').forEach(el=>{const k=el.dataset.control;el.addEventListener('pointerdown',e=>{touch.add(k);el.setPointerCapture(e.pointerId);e.preventDefault()});for(const ev of ['pointerup','pointercancel','lostpointercapture'])el.addEventListener(ev,()=>touch.delete(k))});
for(const [id,k] of [['throttleUp','up'],['throttleDown','down']]){const el=$(id);el.addEventListener('pointerdown',e=>{touch.add(k);el.setPointerCapture(e.pointerId);e.preventDefault()});for(const event of ['pointerup','pointercancel','lostpointercapture'])el.addEventListener(event,()=>touch.delete(k))}
$('brake').addEventListener('click',()=>{brake=!brake;$('brake').classList.toggle('on',brake);$('brake').setAttribute('aria-pressed',String(brake))});
// Prevent Safari's text selection/callout while holding actual flight controls.
// Restrict suppression to game controls; menu selects and file import stay native.
for(const surface of [$('touch'),$('camera'),$('coachToggle'),...document.querySelectorAll('.flight-actions, .navigation-actions')]){
 if(!surface)continue;
 surface.addEventListener('contextmenu',event=>event.preventDefault());
 surface.addEventListener('selectstart',event=>event.preventDefault());
}
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
 const strip=runwayAt(state.x,state.z);
 if(touchdownIsHard(state,strip,difficulty,p.stall)){crashed=true;state.speed=0;notifyLanding(false);announce('Hard landing! Press R or Start Flight to retry.');$('flightState').textContent='HARD LANDING'}
 else{state.vs=0;if(!(difficulty==='arcade'&&strip)){state.pitch=0;state.roll=0}state.speed*=.80;notifyLanding(true,strip);if(!missionFinished)announce(strip?'Smooth landing at '+strip.name+'! Brake to stop or take off again.':'Grass landing outside the airstrips: no mission credit.');}
}}
state.x+=Math.sin(state.yaw)*Math.cos(state.pitch)*state.speed*dt;state.z+=Math.cos(state.yaw)*Math.cos(state.pitch)*state.speed*dt;
propAngle+=dt*(4+state.throttle*55);flightTick(dt);
$('speed').textContent=Math.round(state.speed*3.6);$('alt').textContent=Math.round(Math.max(0,state.y-.48));$('vs').textContent=state.vs.toFixed(1);$('power').textContent=Math.round(state.throttle*100);$('powerBar').style.width=Math.round(state.throttle*100)+'%';
if(!crashed){$('flightState').textContent=grounded?(brake?'BRAKES ON':state.speed>3?'TAKEOFF ROLL':'ON RUNWAY'):(state.speed<p.stall?'STALL WARNING':state.vs>1?'CLIMBING':state.vs< -1?'DESCENDING':'LEVEL FLIGHT');if(!grounded&&state.speed<p.stall)announce('STALL WARNING! Lower the nose and increase power.');else if(grounded&&brake&&state.throttle>.4)announce('Release the brake before takeoff.')}
}
// Start aligned behind the parked aircraft; do not ease from a camera hundreds of feet away.
let camEye=[0,5.7,-153],camTarget=[0,2.0,-138],cameraSnap=true;
function snapCamera(){cameraSnap=true;}
function render(){const dpi=graphicsQuality==='low'?Math.min(window.devicePixelRatio||1,.8):Math.min(window.devicePixelRatio||1,1.6),w=Math.max(1,Math.round(cv.clientWidth*dpi)),h=Math.max(1,Math.round(cv.clientHeight*dpi));if(cv.width!==w||cv.height!==h){cv.width=w;cv.height=h;gl.viewport(0,0,w,h)}
const dusk=timeOfDay==='evening'?1:0;
 if(dusk){if(weather==='storm')gl.clearColor(.34,.30,.39,1);else if(weather==='breezy')gl.clearColor(.75,.49,.48,1);else gl.clearColor(.95,.59,.44,1)}
 else if(weather==='storm')gl.clearColor(.42,.52,.60,1);else if(weather==='breezy')gl.clearColor(.57,.72,.79,1);else gl.clearColor(.61,.77,.87,1);
 gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
 gl.uniform1f(duskUniform,dusk);
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
if(dusk&&graphicsQuality!=='low')draw(sunsetSun,identity(),view,proj,camEye,true);
 draw(field,identity(),view,proj,camEye);
 draw(worldObjects,identity(),view,proj,camEye);
 draw(memorialFlag,identity(),view,proj,camEye);
 if(dusk)draw(sunsetScenery,identity(),view,proj,camEye,true);
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
let lastRender=0;
function frame(time){
 const dt=Math.min(.055,Math.max(0,(time-last)/1000));last=time;
 step(dt);
 if(graphicsQuality==='normal'||!lastRender||time-lastRender>=33){
  render();lastRender=time;
 }
 updateAudio();requestAnimationFrame(frame);
}
reset();requestAnimationFrame(frame);
} catch (error) {
 console.error('Wings of 1918 startup failed:',error);
 const overlay=$('error');
 if(overlay){
  overlay.hidden=false;
  overlay.textContent='Flight simulator could not start: '+(error?.message||String(error))+'. Reload this page. If the issue persists, report this error in GitHub.';
 }
}
})();

