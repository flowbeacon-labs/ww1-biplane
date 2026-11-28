'use strict';
const {chromium}=require('playwright');
const path=require('node:path');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox','--enable-webgl','--enable-unsafe-swiftshader','--use-angle=swiftshader']});
 const page=await browser.newPage({viewport:{width:1280,height:800}});
 const errors=[];
 page.on('pageerror',e=>errors.push('PAGE ERROR: '+e.stack));
 page.on('console',m=>{if(m.type()==='error')errors.push('CONSOLE: '+m.text())});
 page.on('requestfailed',r=>errors.push('REQUEST: '+r.url()+' '+r.failure()?.errorText));
 await page.goto('file://'+path.resolve(__dirname,'../index.html'),{waitUntil:'load'});
 await page.waitForTimeout(700);
 const start=await page.evaluate(()=>({
  webgl:!!document.querySelector('canvas').getContext('webgl'),
  menuHidden:document.getElementById('menu').hidden,
  errorText:document.getElementById('error').textContent,
  errorHidden:document.getElementById('error').hidden,
  button:!!document.getElementById('start')
 }));
 console.log('BEFORE START',JSON.stringify(start));console.log(errors.join('\n'));
 if(!start.webgl)throw Error('WebGL unavailable in test runner; cannot validate launch');
 if(!start.errorHidden)throw Error('Game has startup error: '+start.errorText);
 await page.locator('#start').click();
 await page.waitForTimeout(800);
 const result=await page.evaluate(()=>({
  menuHidden:document.getElementById('menu').hidden,
  stageWidth:document.querySelector('canvas').width,
  stageHeight:document.querySelector('canvas').height,
  errorHidden:document.getElementById('error').hidden,
  errorText:document.getElementById('error').textContent,
  text:document.getElementById('flightState').textContent,
 }));
 console.log('AFTER START',JSON.stringify(result));console.log(errors.join('\\n'));
 const tutorial=await page.evaluate(()=>({
  missionBarVisible:getComputedStyle(document.querySelector('.mission-hud')).display!=='none',
  coachVisible:getComputedStyle(document.getElementById('landingCoach')).display!=='none',
  coachTitle:document.getElementById('coachTitle').textContent,
  active:document.getElementById('app').classList.contains('flight-active')
 }));
 console.log('LANDING TUTORIAL',JSON.stringify(tutorial));
 if(tutorial.missionBarVisible||!tutorial.coachVisible||!tutorial.active)throw Error('Flight tutorial layout failed: '+JSON.stringify(tutorial));
 await page.locator('#coachToggle').click();
 const hiddenTips=await page.evaluate(()=>document.getElementById('landingCoach').classList.contains('coach-collapsed'));
 if(!hiddenTips)throw Error('Hide landing tips did not work');
 await page.locator('#coachToggle').click();
 const iconUI=await page.evaluate(()=>{
  const ids=['throttleUp','throttleDown','brake','camera','fire','photo','sound','pauseFlight','backToPlanes','hudToggle'];
  return ids.map(id=>{const el=document.getElementById(id),svg=el?.querySelector('svg');
   return{id,hasSvg:!!svg,iconHidden:svg?.getAttribute('aria-hidden'),touchCallout:getComputedStyle(el).getPropertyValue('-webkit-touch-callout'),userSelect:getComputedStyle(el).userSelect};
  });
 });
 console.log('FLIGHT ICONS',JSON.stringify(iconUI));
 if(iconUI.some(i=>!i.hasSvg||i.iconHidden!=='true'||i.userSelect!=='none'))throw Error('Icon buttons incomplete: '+JSON.stringify(iconUI));
 const calloutSuppressed=await page.evaluate(()=>{
  const ev=new MouseEvent('contextmenu',{bubbles:true,cancelable:true});
  const allowed=document.getElementById('throttleUp').dispatchEvent(ev);
  return !allowed;
 });
 if(!calloutSuppressed)throw Error('Throttle long-press context menu is not blocked');


 // Training mode is a saved UI preference; the game should switch without a reload.
 await page.locator('#pauseFlight').click();
 await page.locator('#trainingInstructions').selectOption('off');
 await page.locator('#start').click();
 let training=await page.evaluate(()=>({
  setting:document.getElementById('trainingInstructions').value,
  hidden:document.getElementById('landingCoach').hidden,
  menuHidden:document.getElementById('menu').hidden
 }));
 if(training.setting!=='off'||!training.hidden||!training.menuHidden)throw Error('Instructions OFF preference failed: '+JSON.stringify(training));
 await page.locator('#pauseFlight').click();
 await page.locator('#trainingInstructions').selectOption('on');
 await page.locator('#start').click();
 training=await page.evaluate(()=>({
  hidden:document.getElementById('landingCoach').hidden,
  title:document.getElementById('coachTitle').textContent
 }));
 if(training.hidden)throw Error('Instructions ON failed: '+JSON.stringify(training));
 console.log('TRAINING MODE',JSON.stringify(training));


 // Desktop joystick must be visible even when the primary pointer is a mouse.
 const joy=page.locator('#joyArea');
 if(!(await joy.isVisible()))throw Error('Circular joystick hidden on desktop');
 const bounds=await joy.boundingBox();
 if(!bounds||bounds.width<80||bounds.height<80)throw Error('Joystick too small on desktop');
 const centerX=bounds.x+bounds.width/2,centerY=bounds.y+bounds.height/2;
 await page.mouse.move(centerX,centerY);
 await page.mouse.down();
 await page.mouse.move(centerX+28,centerY-24,{steps:4});
 const moved=await page.locator('#joyKnob').evaluate(el=>el.style.transform);
 if(!moved||moved==='translate(0,0)')throw Error('Mouse joystick drag did not move knob: '+moved);
 const duringHold=await page.evaluate(()=>({
  locked:document.documentElement.classList.contains('joystick-held'),
  selection:getComputedStyle(document.body).userSelect
 }));
 if(!duringHold.locked||duringHold.selection!=='none')throw Error('Document text remains selectable during joystick hold: '+JSON.stringify(duringHold));
 const selectionBlocked=await page.evaluate(()=>{
  const ev=new Event('selectstart',{bubbles:true,cancelable:true});
  return !document.getElementById('coachTitle').dispatchEvent(ev);
 });
 if(!selectionBlocked)throw Error('Long-press text selection not prevented while steering');
 await page.mouse.up();
 const centered=await page.locator('#joyKnob').evaluate(el=>el.style.transform);
 if(await page.evaluate(()=>document.documentElement.classList.contains('joystick-held')))throw Error('Joystick selection lock remained after release');
 if(centered!=='translate(0,0)')throw Error('Joystick failed to center after mouse release: '+centered);

 // Touchscreen laptop emulation: desktop viewport and both mouse/touch available.
 const hybridContext=await browser.newContext({viewport:{width:1280,height:800},hasTouch:true,isMobile:false});
 const hybrid=await hybridContext.newPage();
 await hybrid.goto('file://'+path.resolve(__dirname,'../index.html'),{waitUntil:'load'});
 await hybrid.locator('#start').click();
 const hybridVisible=await hybrid.locator('#joyArea').isVisible();
 if(!hybridVisible)throw Error('Touchscreen laptop joystick is hidden');
 const hybridBox=await hybrid.locator('#joyArea').boundingBox();
 const touchX=hybridBox.x+hybridBox.width/2,touchY=hybridBox.y+hybridBox.height/2;
 const cdp=await hybridContext.newCDPSession(hybrid);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:touchX,y:touchY,id:1}]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:touchX+29,y:touchY-20,id:1}]});
 const touchMove=await hybrid.locator('#joyKnob').evaluate(el=>el.style.transform);
 if(!(await hybrid.evaluate(()=>document.documentElement.classList.contains('joystick-held'))))throw Error('Touchscreen joystick did not lock page selection');
 if(!touchMove||touchMove==='translate(0,0)')throw Error('Touchscreen laptop virtual joystick failed to respond');
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 const touchStop=await hybrid.locator('#joyKnob').evaluate(el=>el.style.transform);
 if(await hybrid.evaluate(()=>document.documentElement.classList.contains('joystick-held')))throw Error('Touchscreen joystick selection lock not released');
 if(touchStop!=='translate(0,0)')throw Error('Touchscreen laptop joystick did not reset after release');
 await hybridContext.close();
 console.log('DESKTOP AND TOUCHSCREEN JOYSTICK',JSON.stringify({desktop:moved,hybrid:touchMove}));


 // Switching graphic quality must not reset a running flight or prevent render.
 const originalCanvas=await page.locator('#flight').evaluate(el=>({w:el.width,h:el.height}));
 await page.locator('#pauseFlight').click();
 await page.locator('#graphicsQuality').selectOption('low');
 await page.locator('#start').click();
 await page.waitForTimeout(250);
 const lowQuality=await page.evaluate(()=>({
  quality:document.getElementById('graphicsQuality').value,
  canvasWidth:document.getElementById('flight').width,
  canvasHeight:document.getElementById('flight').height,
  playing:document.getElementById('menu').hidden,
  saved:JSON.parse(localStorage.getItem('flowbeacon-wings-career-v1')).settings.graphicsQuality
 }));
 if(lowQuality.quality!=='low'||lowQuality.saved!=='low'||!lowQuality.playing||
    lowQuality.canvasWidth>=originalCanvas.w)throw Error('Low quality switch failed: '+JSON.stringify(lowQuality));
 await page.locator('#pauseFlight').click();
 await page.locator('#graphicsQuality').selectOption('normal');
 await page.locator('#start').click();
 await page.waitForTimeout(250);
 const normalQuality=await page.evaluate(()=>({
  canvasWidth:document.getElementById('flight').width,
  playing:document.getElementById('menu').hidden,
  saved:JSON.parse(localStorage.getItem('flowbeacon-wings-career-v1')).settings.graphicsQuality
 }));
 if(normalQuality.saved!=='normal'||!normalQuality.playing||
    normalQuality.canvasWidth!==originalCanvas.w)throw Error('Normal quality restore failed: '+JSON.stringify(normalQuality));
 console.log('GRAPHICS MODES',JSON.stringify({originalCanvas,lowQuality,normalQuality}));

 await page.screenshot({path:'flight-startup.png'});
 for(const width of [590,900,1280]){
  await page.setViewportSize({width,height:800});
  const layout=await page.evaluate(()=>{
   const help=document.getElementById('help').getBoundingClientRect();
   const actions=document.querySelector('.flight-actions').getBoundingClientRect();
   return {helpBottom:help.bottom,actionsTop:actions.top,helpLeft:help.left,helpRight:help.right,viewport:innerWidth};
  });
  if(layout.helpBottom>layout.actionsTop||layout.helpLeft<0||layout.helpRight>layout.viewport)throw Error('Flight controls overlap at '+width+'px: '+JSON.stringify(layout));
 }
 await browser.close();
 if(!result.menuHidden||result.stageWidth<100||result.stageHeight<100||errors.length)throw Error('Flight launch failed: '+JSON.stringify(result));
})().catch(e=>{console.error(e.stack);process.exitCode=1});

