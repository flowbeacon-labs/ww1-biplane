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

