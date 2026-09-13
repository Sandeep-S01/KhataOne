import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Public-only diagnostic: no authentication, submissions, external requests or records.
const out = fileURLToPath(new URL('./', import.meta.url));
const origin = 'http://127.0.0.1:3105';
const routes = ['/', '/login', '/signup', '/forgot-password', '/reset-password', '/contact', '/privacy', '/terms'];
const sizes = [[320,568],[390,844],[768,1024],[1024,768],[1280,800],[1440,900],[1920,1080]];
const browser = await chromium.launch({headless:true});
const context = await browser.newContext({deviceScaleFactor:1,locale:'en-IN',timezoneId:'Asia/Kolkata',serviceWorkers:'block'});
const blocked = [];
await context.route('**/*', route => {
  const request = route.request(); const url = new URL(request.url());
  if (url.origin !== origin || !['GET','HEAD'].includes(request.method()) || (!routes.includes(url.pathname) && !url.pathname.startsWith('/_next/') && !/\.(png|svg|webp|ico|woff2?)$/.test(url.pathname))) {
    blocked.push({method:request.method(),external:url.origin!==origin}); return route.abort();
  }
  return route.continue();
});
const page = await context.newPage();
const errors=[]; page.on('pageerror',e=>errors.push(e.message.slice(0,200)));
async function inspect() {
  return page.evaluate(() => {
    const visible = e => {const r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none';};
    const controls=[...document.querySelectorAll('input,select,textarea,button,a,summary')].filter(visible);
    return {width:innerWidth,scrollWidth:document.documentElement.scrollWidth,dpr:devicePixelRatio,
      h1:[...document.querySelectorAll('h1')].map(e=>e.textContent.trim()),
      unnamed:controls.filter(e=>!e.getAttribute('aria-label')&&!e.getAttribute('aria-labelledby')&&!e.textContent.trim()&&!e.labels?.length&&!e.getAttribute('title')).map(e=>({tag:e.tagName,name:e.getAttribute('name')})),
      controls:controls.map(e=>{const r=e.getBoundingClientRect();return {tag:e.tagName,name:e.getAttribute('name')||e.getAttribute('aria-label')||e.textContent.trim().slice(0,55),width:r.width,height:r.height};}),
      title:document.title,fontStatus:document.fonts.status,zoom:getComputedStyle(document.documentElement).zoom,
      tokens:Object.fromEntries(['--background','--foreground','--success','--warning','--border'].map(k=>[k,getComputedStyle(document.documentElement).getPropertyValue(k).trim()]))};
  });
}
const results=[];
for(const route of routes){
  for(const [width,height] of sizes){
    await page.setViewportSize({width,height});
    const start=performance.now(); const response=await page.goto(origin+route,{waitUntil:'networkidle',timeout:60000});
    await page.locator('h1').first().waitFor(); await page.evaluate(()=>document.fonts.ready);
    const data=await inspect();
    const result={route,viewport:{width,height},status:response.status(),usableObservationMs:Math.round(performance.now()-start),...data};
    if([320,1440].includes(width)){const file=`public-${route==='/'?'home':route.slice(1)}-${width}.png`;await page.screenshot({path:out+file,fullPage:true});result.screenshot=file;}
    results.push(result);
  }
  console.log('Inspected public route',route);
}
await page.setViewportSize({width:320,height:568});
await page.goto(origin+'/signup',{waitUntil:'networkidle'});
await page.getByRole('button',{name:'Create account',exact:true}).click();
const invalidSignup=await inspect();
await page.screenshot({path:out+'signup-invalid-320.png',fullPage:true});
await page.getByRole('button',{name:'Show password',exact:true}).click();
const passwordToggle=await page.locator('input[name=password]').getAttribute('type');
await page.goto(origin+'/',{waitUntil:'networkidle'});
await page.locator('summary').first().click();
const menuOpen=await page.locator('details').first().getAttribute('open')!==null;
await page.keyboard.press('Escape');
const menuOpenAfterEscape=await page.locator('details').first().getAttribute('open')!==null;
await page.getByRole('navigation',{name:'Mobile primary'}).getByRole('link',{name:'How it works'}).click();
const menuClosedAfterLink=await page.locator('details').first().getAttribute('open')===null;
const stress=[];
for(const route of ['/','/signup','/login']){
  await page.setViewportSize({width:1280,height:800}); await page.goto(origin+route,{waitUntil:'networkidle'});
  await page.evaluate(()=>document.documentElement.style.zoom='2');
  stress.push({route,method:'CSS zoom 2 (not browser zoom)',...await inspect()});
  await page.screenshot({path:out+`css-zoom-${route==='/'?'home':route.slice(1)}.png`,fullPage:true});
}
await page.goto(origin+'/login',{waitUntil:'networkidle'});
await page.keyboard.press('Tab');
const firstFocus=await page.evaluate(()=>({tag:document.activeElement.tagName,name:document.activeElement.getAttribute('aria-label'),outline:getComputedStyle(document.activeElement).outlineStyle}));
const report={environment:{origin,mode:'development; integration configuration absent',role:'anonymous',dataset:'public static content only',browser:browser.version(),os:process.platform,zoom:'100% except explicitly labelled CSS stress',network:'no emulation; localhost; browser external and write requests blocked'},results,invalidSignup,passwordToggle,menuOpen,menuOpenAfterEscape,menuClosedAfterLink,stress,firstFocus,blocked,errors};
writeFileSync(out+'public-browser.json',JSON.stringify(report,null,2));
console.log(JSON.stringify({samples:results.length,overflow:results.filter(r=>r.scrollWidth>r.width).map(r=>({route:r.route,width:r.width,scrollWidth:r.scrollWidth})),unnamed:results.filter(r=>r.unnamed.length).map(r=>({route:r.route,width:r.width,unnamed:r.unnamed})),menuOpenAfterEscape,errors}));
await browser.close();
