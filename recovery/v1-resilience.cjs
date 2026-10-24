const { chromium, expect } = require('playwright/test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const base = process.env.TEST_URL || 'http://127.0.0.1:5173';
const results=[];
const state={events:[{id:'e',name:'壓力測試',budget:5000,date:'',location:''}],categories:[],items:Array.from({length:100},(_,n)=>({id:`i${n}`,name:`商品 ${n}`,price:10,boothNumber:`A${Math.floor(n/20)}`,eventId:'e',categoryId:null,status:'pending'})),currentEventId:'e',themeId:'default',defaultBudget:5000,boothOrder:{e:['A0','A1','A2','A3','A4']}};
async function read(p){return p.evaluate(async()=> (await import('/src/lib/storage.js')).loadData());}
async function test(name,fn){await fn();results.push(name);console.log('PASS:',name);}
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try {
  await test('corrupt legacy JSON is retained and startup never writes empty data',async()=>{
   const c=await browser.newContext();const p=await c.newPage();await p.addInitScript(()=>localStorage.setItem('events','{corrupt'));await p.goto(base);await expect(p.getByRole('alert')).toContainText('原資料未清除');assert.equal(await p.evaluate(()=>localStorage.getItem('events')),'{corrupt');const stored=await p.evaluate(()=>new Promise(r=>{const q=indexedDB.open('doujin-shopping-list');q.onsuccess=()=>{const db=q.result,tx=db.transaction('state'),g=tx.objectStore('state').get('current');tx.oncomplete=()=>{r(g.result);db.close()}}}));assert.equal(stored,undefined);await c.close();
  });
  await test('migration write failure retains original records; retry migrates successfully',async()=>{
   const c=await browser.newContext();const p=await c.newPage();await p.addInitScript(data=>{for(const[k,v]of Object.entries(data))localStorage.setItem(k,['currentEventId','themeId'].includes(k)?v:JSON.stringify(v));window.originalPut=IDBObjectStore.prototype.put;IDBObjectStore.prototype.put=function(){throw new DOMException('full','QuotaExceededError')}},state);await p.goto(base);await expect(p.getByRole('alert')).toContainText('原資料未清除');assert.equal(await p.evaluate(()=>JSON.parse(localStorage.getItem('items')).length),100);await p.evaluate(()=>IDBObjectStore.prototype.put=window.originalPut);await p.getByRole('button',{name:'重新載入'}).click();await expect(p.getByText('場次空間',{exact:true})).toBeVisible();assert.equal((await read(p)).items.length,100);await c.close();
  });
  await test('transaction abort rejects replace and preserves old snapshot',async()=>{
   const c=await browser.newContext();const p=await c.newPage();await p.goto(base);await expect(p.getByText('場次空間',{exact:true})).toBeVisible();await p.evaluate(async data=>(await import('/src/lib/storage.js')).saveData(data),state);const changed=structuredClone(state);changed.events[0].name='不應儲存';const rejected=await p.evaluate(async data=>{const original=IDBObjectStore.prototype.put;IDBObjectStore.prototype.put=function(...args){const request=original.apply(this,args);this.transaction.abort();return request};try{await(await import('/src/lib/storage.js')).saveData(data);return false}catch{return true}finally{IDBObjectStore.prototype.put=original}},changed);assert.equal(rejected,true);assert.deepEqual(await read(p),state);await c.close();
  });
  await test('JPEG/WebP resize and transparent PNG alpha are preserved; unsupported files reject',async()=>{
   const c=await browser.newContext();const p=await c.newPage();await p.goto(base);const checks=await p.evaluate(async()=>{
    const {prepareImage}=await import('/src/lib/images.js');const canvas=document.createElement('canvas');canvas.width=2000;canvas.height=1000;const ctx=canvas.getContext('2d');ctx.fillStyle='red';ctx.fillRect(100,100,100,100);const output=[];
    for(const type of ['image/jpeg','image/webp','image/png']){const blob=await new Promise(r=>canvas.toBlob(r,type));const url=await prepareImage(new File([blob],'test',{type}));const img=new Image();img.src=url;await img.decode();const check=document.createElement('canvas');check.width=img.naturalWidth;check.height=img.naturalHeight;const cx=check.getContext('2d');cx.drawImage(img,0,0);output.push({type,width:img.naturalWidth,height:img.naturalHeight,alpha:cx.getImageData(0,0,1,1).data[3]})}
    let invalid=false;try{await prepareImage(new File(['bad'],'x.heic',{type:'image/heic'}))}catch{invalid=true}return{output,invalid};
   });assert.ok(checks.invalid);for(const x of checks.output)assert.deepEqual([x.width,x.height],[1600,800]);assert.equal(checks.output[2].alpha,0);await c.close();
  });
  await test('sorting mode scrolls outside handle, auto-scrolls at edge, cancels and recovers',async()=>{
   const c=await browser.newContext({viewport:{width:430,height:932},hasTouch:true,isMobile:true});const p=await c.newPage();await p.goto(base);await expect(p.getByText('場次空間',{exact:true})).toBeVisible();await p.evaluate(async data=>(await import('/src/lib/storage.js')).saveData(data),state);await p.reload();await p.getByText('進入清單',{exact:true}).click();await p.getByRole('button',{name:'排序',exact:true}).click();const cdp=await c.newCDPSession(p);
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:200,y:760}]});for(let y=720;y>=250;y-=40)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:200,y}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await p.waitForTimeout(250);assert.ok(await p.evaluate(()=>scrollY)>100);assert.deepEqual(await read(p),state);
   const handle=p.getByRole('button',{name:'拖曳商品 商品 0',exact:true});await handle.scrollIntoViewIfNeeded();const box=await handle.boundingBox();const top=await p.evaluate(()=>scrollY);await p.mouse.move(box.x+20,box.y+20);await p.mouse.down();await p.mouse.move(box.x+20,910,{steps:25});for(let n=0;n<15;n++){await p.mouse.move(box.x+20,905+n%2);await p.waitForTimeout(30)}const after=await p.evaluate(()=>scrollY);assert.ok(after>top,'edge auto-scroll should advance viewport');await p.evaluate(()=>window.dispatchEvent(new PointerEvent('pointercancel',{pointerId:1,bubbles:true})));await p.mouse.up();await p.waitForTimeout(250);assert.deepEqual(await read(p),state);await p.getByRole('button',{name:'結束排序',exact:true}).click();assert.equal((await read(p)).items.length,100);await c.close();
  });
 } finally {fs.mkdirSync('verification',{recursive:true});fs.writeFileSync('verification/resilience-results.json',JSON.stringify({passed:results.length===5,results},null,2));await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
