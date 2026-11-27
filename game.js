(()=>{'use strict';
const $=id=>document.getElementById(id),cv=$('flight'),gl=cv.getContext('webgl',{antialias:true,alpha:false,powerPreference:'high-performance'});
if(!gl){$('error').hidden=false;$('error').textContent='WebGL unavailable. Try a newer browser with hardware acceleration enabled.';return}
const TAU=Math.PI*2,clamp=(v,a,b)=>Math.min(b,Math.max(a,v)),mix=(a,b,t)=>a+(b-a)*t;
const planes=[
{name:'Sopwith Camel',country:'United Kingdom',flag:'🇬🇧',year:1917,span:9,body:7,levels:2,color:'#947c56',wing:'#c5b18b',trim:'#eadabe',mark:'round',max:53,stall:19,accel:10,details:'British rotary-engine fighter, with a compact fuselage and two braced wings.'},
{name:'Fokker Dr.I',country:'Germany',flag:'🇩🇪',year:1917,span:7.2,body:5.8,levels:3,color:'#af332e',wing:'#b13931',trim:'#f0dbad',mark:'cross',max:49,stall:17,accel:10,details:'German triplane with three distinctive stacked wings and cross insignia.'},
{name:'SPAD S.XIII',country:'France',flag:'🇫🇷',year:1917,span:9.1,body:7.8,levels:2,color:'#a58b5d',wing:'#b7ac83',trim:'#e1d0a5',mark:'round',max:61,stall:23,accel:11,details:'French fighter with a long narrow nose and robust twin-wing structure.'},
{name:'Nieuport 17',country:'France',flag:'🇫🇷',year:1916,span:8.2,body:5.9,levels:2,color:'#b2a891',wing:'#d5cbb7',trim:'#e9d6b0',mark:'round',max:50,stall:18,accel:9.4,details:'French sesquiplane, modeled with a visibly narrower lower wing.'},
{name:'Albatros D.Va',country:'Germany',flag:'🇩🇪',year:1917,span:9.0,body:7.3,levels:2,color:'#985a37',wing:'#7c946d',trim:'#ecd5ac',mark:'cross',max:55,stall:21,accel:10.5,details:'German wooden-bodied scout with a tapered fuselage and swept tail.'},
{name:'Ansaldo SVA.5',country:'Italy',flag:'🇮🇹',year:1918,span:9.1,body:8.1,levels:2,color:'#b69a68',wing:'#d1bf92',trim:'#f2e1b6',mark:'italy',max:63,stall:24,accel:11,details:'Italian high-speed reconnaissance aircraft with an elongated fuselage.'},
{name:'Curtiss JN-4 Jenny',country:'United States',flag:'🇺🇸',year:1915,span:13.3,body:8.3,levels:2,color:'#c0a778',wing:'#dfcead',trim:'#fff0ce',mark:'usa',max:41,stall:16,accel:8.8,details:'American training biplane with broad wings and easy low-speed handling.'}
];
const hex=s=>[1,3,5].map(i=>parseInt(s.slice(i,i+2),16)/255);
const D={grass:[.27,.43,.27],patch:[.32,.49,.31],strip:[.55,.54,.43],white:[.94,.92,.81],wood:[.49,.35,.23],steel:[.41,.43,.42],black:[.09,.09,.10],gold:[.84,.73,.40],red:[.8,.22,.16],blue:[.18,.31,.68],green:[.25,.54,.28]};
const dim=(c,f)=>c.map(v=>v*f),v=(x,y,z)=>[x,y,z],sub=(a,b)=>a.map((n,i)=>n-b[i]),add=(a,b)=>a.map((n,i)=>n+b[i]),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2]],dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0),unit=a=>{const l=Math.hypot(...a)||1;return a.map(x=>x/l)};
class Mesh{constructor(){this.pos=[];this.nrm=[];this.col=[];this.buf=null}
 tri(a,b,c,col){let n=unit(cross(sub(b,a),sub(c,a)));for(const p of [a,b,c]){this.pos.push(...p);this.nrm.push(...n);this.col.push(...col)}}
 quad(a,b,c,d,col){this.tri(a,b,c,col);this.tri(a,c,d,col)}
 box(x,y,z,w,h,d,col){const l=x-w/2,r=x+w/2,b=y-h/2,t=y+h/2,n=z-d/2,f=z+d/2;this.quad(v(l,t,n),v(r,t,n),v(r,t,f),v(l,t,f),col);this.quad(v(l,b,f),v(r,b,f),v(r,b,n),v(l,b,n),dim(col,.72));this.quad(v(l,b,n),v(r,b,n),v(r,t,n),v(l,t,n),dim(col,.82));this.quad(v(r,b,f),v(l,b,f),v(l,t,f),v(r,t,f),dim(col,.92));this.quad(v(l,b,f),v(l,b,n),v(l,t,n),v(l,t,f),dim(col,.78));this.quad(v(r,b,n),v(r,b,f),v(r,t,f),v(r,t,n),dim(col,.85))}
 tube(a,b,r,col,segments=7){const axis=unit(sub(b,a)),ref=Math.abs(axis[1])>.9?[1,0,0]:[0,1,0],u=unit(cross(axis,ref)),w=cross(axis,u);for(let i=0;i<segments;i++){const theta=i*TAU/segments,phi=(i+1)*TAU/segments,offset=t=>u.map((n,j)=>n*Math.cos(t)*r+w[j]*Math.sin(t)*r);this.quad(add(a,offset(theta)),add(b,offset(theta)),add(b,offset(phi)),add(a,offset(phi)),col)}}
 disc(x,y,z,r,col){for(let i=0;i<20;i++){let a=i*TAU/20,b=(i+1)*TAU/20;this.tri(v(x,y,z),v(x+Math.cos(a)*r,y,z+Math.sin(a)*r),v(x+Math.cos(b)*r,y,z+Math.sin(b)*r),col)}}
 upload(){if(this.buf)return;this.count=this.pos.length/3;this.buf=[this.pos,this.nrm,this.col].map(data=>{const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.STATIC_DRAW);return b})}
}
function makeField(){const m=new Mesh();m.box(0,-.30,0,1700,.55,1700,D.grass);m.box(0,.01,0,28,.06,610,D.strip);
for(let z=-280;z<300;z+=28)m.box(0,.049,z,1.2,.035,11,D.white);
for(const x of [-15,15])for(let z=-294;z<=294;z+=15)m.box(x,.07,z,.5,.08,.7,D.white);
let seed=42;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)|0;return(seed>>>0)/4294967296};
for(let i=0;i<260;i++){const x=(rand()-.5)*1550,z=(rand()-.5)*1550;if(Math.abs(x)<24&&Math.abs(z)<320)continue;m.box(x,.004,z,2+rand()*9,.025,3+rand()*9,rand()<.5?D.grass:D.patch)}
for(const x of [-83,-50,53,88]){m.box(x,5.5,78,27,11,27,D.wood);m.box(x,11.9,78,30,2,30,D.steel);m.box(x,5.6,64,17,9,.45,D.black)}
for(let i=0;i<62;i++){let x=(rand()-.5)*1450,z=(rand()-.5)*1450;if(Math.abs(x)<130&&Math.abs(z)<365)continue;let h=6+rand()*10;m.tube(v(x,.1,z),v(x,h*.42,z),.46,D.wood,5);m.tube(v(x,h*.4,z),v(x,h,z),2,rand()<.5?D.grass:D.patch,8)}
for(const z of [-275,275])m.box(0,.11,z,35,.2,1.2,D.white);return m}
const field=makeField();
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
function choose(i){selected=i;model=makeAircraft(planes[i]);const p=planes[i];$('aircraftInfo').textContent=p.details+' The models and flight physics are historical-inspired approximations.';$('selectedAircraft').textContent=p.name+' · '+p.country;document.querySelectorAll('.plane').forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.index===i)))}
$('planes').innerHTML=planes.map((p,i)=>'<button class="plane" data-index="'+i+'" aria-pressed="'+(i===0)+'"><span class="flag">'+p.flag+'</span><strong>'+p.name+'</strong><small>'+p.country+' · '+p.year+' · '+(p.levels===3?'Triplane':'Biplane')+'</small></button>').join('');
document.querySelectorAll('.plane').forEach(b=>b.addEventListener('click',()=>choose(+b.dataset.index)));choose(0);
function announce(t){$('notice').textContent=t}
function reset(){Object.assign(state,{x:0,y:.48,z:-140,yaw:0,pitch:0,roll:0,speed:0,vs:0,throttle:0});snapCamera();grounded=true;brake=true;crashed=false;touch.clear();keys.clear();$('brake').classList.add('on');announce('Increase power, release wheel brake and accelerate along the runway.')}
let last=performance.now();
function begin(){reset();active=true;paused=false;$('menu').hidden=true;last=performance.now()}
$('start').addEventListener('click',()=>{if(active&&paused&&!crashed){paused=false;$('menu').hidden=true;last=performance.now()}else begin()});
function pause(){if(!active)return;paused=!paused;$('menu').hidden=!paused;$('start').textContent=paused?'RESUME FLIGHT →':'START FLIGHT →'}
$('camera').addEventListener('click',()=>{camera=(camera+1)%3;snapCamera();$('camName').textContent=['CHASE','CLOSE','COCKPIT'][camera]});
const keyMap={KeyW:'w',KeyS:'s',KeyA:'a',KeyD:'d',KeyQ:'q',KeyE:'e',ArrowUp:'up',ArrowDown:'down'};
document.addEventListener('keydown',e=>{let k=keyMap[e.code];if(k){keys.add(k);e.preventDefault()}if(e.repeat)return;if(e.code==='Space'){brake=!brake;$('brake').classList.toggle('on',brake);e.preventDefault()}if(e.code==='KeyC')$('camera').click();if(e.code==='KeyR'){begin()}if(e.code==='Escape')pause()});
document.addEventListener('keyup',e=>{let k=keyMap[e.code];if(k){keys.delete(k);e.preventDefault()}});
window.addEventListener('blur',()=>{keys.clear();touch.clear();if(active&&!paused)pause()});
document.querySelectorAll('[data-control]').forEach(el=>{const k=el.dataset.control;el.addEventListener('pointerdown',e=>{touch.add(k);el.setPointerCapture(e.pointerId);e.preventDefault()});for(const ev of ['pointerup','pointercancel','lostpointercapture'])el.addEventListener(ev,()=>touch.delete(k))});
for(const [id,k] of [['throttleUp','up'],['throttleDown','down']]){const el=$(id);el.addEventListener('pointerdown',e=>{touch.add(k);el.setPointerCapture(e.pointerId);e.preventDefault()});for(const event of ['pointerup','pointercancel','lostpointercapture'])el.addEventListener(event,()=>touch.delete(k))}
$('brake').addEventListener('click',()=>{brake=!brake;$('brake').classList.toggle('on',brake)});
const held=k=>keys.has(k)||touch.has(k),axis=(a,b)=>(held(a)?1:0)-(held(b)?1:0);
function step(dt){if(!active||paused||crashed)return;const p=planes[selected],w=axis('w','s'),a=axis('d','a'),r=axis('e','q');state.throttle=clamp(state.throttle+axis('up','down')*dt*.29,0,1);
const drag=.0016*state.speed*state.speed+(grounded?1:.55);state.speed=clamp(state.speed+(p.accel*state.throttle-drag-(brake&&grounded?17:0))*dt,0,p.max*1.23);
if(grounded){state.roll=mix(state.roll,0,Math.min(1,dt*6));state.pitch=clamp(state.pitch+(w*.47-state.pitch*.4)*dt,0,.22);state.yaw+=r*dt*(.22+state.speed*.008);state.y=.48;state.vs=0;if(state.speed>p.stall*1.28&&state.pitch>.065){grounded=false;state.vs=1.1;announce('Airborne! Hold a gentle climb and keep your airspeed up.')}}else{
 state.pitch=clamp(state.pitch+(w*.40-state.pitch*.12)*dt,-.60,.60);state.roll=clamp(state.roll+(a*.82-state.roll*.20)*dt,-.91,.91);
 state.yaw+=(r*.28+Math.sin(state.roll)*(.16+state.speed*.006))*dt;
 const stall=state.speed<p.stall?-(p.stall-state.speed)*1.9:0;
 const desired=Math.sin(state.pitch)*state.speed*.83+stall;
 state.vs=mix(state.vs,desired,Math.min(1,dt*1.4));state.y+=state.vs*dt;
 if(state.y<=.48){state.y=.48;grounded=true;
 if(state.vs< -5||Math.abs(state.roll)>.36||Math.abs(state.pitch)>.33||state.speed>p.stall*1.85){crashed=true;state.speed=0;announce('Hard landing! Press R or Start Flight to retry.');$('flightState').textContent='HARD LANDING'}
 else{state.vs=0;state.pitch=0;state.roll=0;state.speed*=.80;announce('Smooth touchdown! Brake to stop or throttle up to take off again.')}
}}
state.x+=Math.sin(state.yaw)*Math.cos(state.pitch)*state.speed*dt;state.z+=Math.cos(state.yaw)*Math.cos(state.pitch)*state.speed*dt;
propAngle+=dt*(4+state.throttle*55);
$('speed').textContent=Math.round(state.speed*3.6);$('alt').textContent=Math.round(Math.max(0,state.y-.48));$('vs').textContent=state.vs.toFixed(1);$('power').textContent=Math.round(state.throttle*100);$('powerBar').style.width=Math.round(state.throttle*100)+'%';
if(!crashed){$('flightState').textContent=grounded?(brake?'BRAKES ON':state.speed>3?'TAKEOFF ROLL':'ON RUNWAY'):(state.speed<p.stall?'STALL WARNING':state.vs>1?'CLIMBING':state.vs< -1?'DESCENDING':'LEVEL FLIGHT');if(!grounded&&state.speed<p.stall)announce('STALL WARNING! Lower the nose and increase power.');else if(grounded&&brake&&state.throttle>.4)announce('Release the brake before takeoff.')}
}
// Start aligned behind the parked aircraft; do not ease from a camera hundreds of feet away.
let camEye=[0,5.7,-153],camTarget=[0,2.0,-138],cameraSnap=true;
function snapCamera(){cameraSnap=true;}
function render(){const dpi=Math.min(window.devicePixelRatio||1,1.6),w=Math.max(1,Math.round(cv.clientWidth*dpi)),h=Math.max(1,Math.round(cv.clientHeight*dpi));if(cv.width!==w||cv.height!==h){cv.width=w;cv.height=h;gl.viewport(0,0,w,h)}
gl.clearColor(.61,.77,.87,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
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
const orientation=multiply(yaw(state.yaw),multiply(pitch(-state.pitch),roll(-state.roll))),base=multiply(move(...pos),orientation);
draw(model.mesh,base,view,proj,camEye);draw(model.prop,multiply(base,multiply(move(...model.offset),roll(propAngle))),view,proj,camEye)
}
function frame(time){const dt=Math.min(.055,Math.max(0,(time-last)/1000));last=time;step(dt);render();requestAnimationFrame(frame)}
reset();requestAnimationFrame(frame);
})();