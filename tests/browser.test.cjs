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
 console.log('AFTER START',JSON.stringify(result));console.log(errors.join('\n'));
 await page.screenshot({path:'flight-startup.png'});
 await browser.close();
 if(!result.menuHidden||result.stageWidth<100||result.stageHeight<100||errors.length)throw Error('Flight launch failed: '+JSON.stringify(result));
})().catch(e=>{console.error(e.stack);process.exitCode=1});
