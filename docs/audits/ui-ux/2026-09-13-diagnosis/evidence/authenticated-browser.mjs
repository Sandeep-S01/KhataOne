import { readFileSync, writeFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
import { chromium } from 'playwright';
const env = parseEnv(readFileSync('.env.local', 'utf8'));
const origin = 'https://khataone.vercel.app'; // Current production domain documented in Tracker; configured legacy URL returned 404.
const followup = process.argv.includes('--followup');
const captureOnly = process.argv.includes('--screenshots');
const out = new URL(captureOnly?'./authenticated-screenshots.json':followup ? './authenticated-followup.json' : './authenticated-browser.json', import.meta.url);
const report = { environment: { origin, mode: 'hosted deployment; deployed commit unverified', authorization: 'User authorized read-only dashboard login on 2026-09-13; business mutations excluded', dataset: 'Existing account; identifiers and financial payloads excluded', browser: '', timezone: 'Asia/Kolkata', network: 'No emulation; one sequential sample per route/viewport' }, results: [], interactions: {}, blockedRequests: 0, pageErrorCount: 0 };
const browser = await chromium.launch({ headless: true });
report.environment.browser = browser.version();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, timezoneId: 'Asia/Kolkata', locale: 'en-IN', serviceWorkers: 'block' });
let authenticating = true;
await context.route('**/*', async route => {
  const req = route.request(), url = new URL(req.url());
  const read = ['GET', 'HEAD'].includes(req.method());
  const allowed = url.origin === origin && ((read && !url.pathname.startsWith('/api/')) || (authenticating && req.method() === 'POST' && url.pathname === '/login'));
  if (allowed) await route.continue(); else { report.blockedRequests++; await route.abort(); }
});
const page = await context.newPage();
let stage='login page';
page.on('pageerror', () => report.pageErrorCount++);
async function inspect(route, viewport) {
  const start = performance.now();
  const response = await page.goto(origin + route, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForFunction(() => [...document.querySelectorAll('#dashboard-content h1')].some(el => el.getBoundingClientRect().width > 0 && !el.closest('[aria-busy="true"]')), { timeout: 45000 });
  await page.evaluate(() => document.fonts.ready);
  const result = await page.evaluate(() => {
    const controls = [...document.querySelectorAll('button,input,select,textarea')].filter(el => {const r=el.getBoundingClientRect();return r.width && r.height && getComputedStyle(el).visibility !== 'hidden';});
    const unnamed = controls.filter(el => !(el.getAttribute('aria-label') || el.getAttribute('aria-labelledby') || el.getAttribute('title') || el.textContent.trim() || el.labels?.length)).map(el=>({tag:el.tagName,type:el.getAttribute('type')}));
    const small = controls.map(el=>{const r=el.getBoundingClientRect();return {tag:el.tagName,type:el.getAttribute('type'),width:Math.round(r.width),height:Math.round(r.height)};}).filter(r=>r.width<44 || r.height<44);
    return {width:document.documentElement.clientWidth,scrollWidth:document.documentElement.scrollWidth,unnamed,small,tableCount:document.querySelectorAll('table').length,tableOverflowCount:[...document.querySelectorAll('table')].filter(t=>t.parentElement.scrollWidth>t.parentElement.clientWidth+1).length,navHeight:document.querySelector('header')?.getBoundingClientRect().height,sidebarWidth:document.querySelector('aside')?.getBoundingClientRect().width,filterInputWidths:[...document.querySelectorAll('input[name="q"],input[type="date"]')].map(el=>({name:el.getAttribute('name'),width:Math.round(el.getBoundingClientRect().width)}))};
  });
  report.results.push({route:route.replace(/[0-9a-f]{8}-[0-9a-f-]{27,}/gi,'[recordId]'),viewport,status:response.status(),usableObservationMs:Math.round(performance.now()-start),...result});
  if(captureOnly) {
    const slug=route.replace(/[0-9a-f]{8}-[0-9a-f-]{27,}/gi,'record').replaceAll('/','-');
    const filename='hosted-redacted'+slug+'-'+viewport.width+'.png';
    await page.screenshot({path:new URL(filename,import.meta.url).pathname.replace(/^\/([A-Z]:)/,'$1'),fullPage:true,mask:[page.locator('tbody,dd,pre,code,input,textarea,select'),page.locator('#dashboard-content .k-card-hover'),page.locator('#dashboard-content p,#dashboard-content h1,#dashboard-content h3,#dashboard-content h4'),page.locator('header p'),page.locator('aside > div:nth-child(2)')],maskColor:'#d8d2c4'});
    report.results.at(-1).screenshot=filename;
  }
  if(route==='/dashboard' && [320,1440].includes(viewport.width)) await page.screenshot({path:new URL('hosted-overview-redacted-'+viewport.width+'.png',import.meta.url).pathname.replace(/^\/([A-Z]:)/,'$1'),fullPage:true,mask:[page.locator('tbody'),page.locator('#dashboard-content p'),page.locator('#dashboard-content .font-mono'),page.locator('header p'),page.locator('aside > div:nth-child(2)')],maskColor:'#d8d2c4'});
  writeFileSync(out,JSON.stringify(report,null,2));
}
try {
  await page.goto(origin+'/login',{waitUntil:'domcontentloaded'});
  await page.waitForLoadState('networkidle');
  stage='fill login';
  await page.locator('input[name="email"]').fill(env.LIVE_DASHBOARD_EMAIL);
  await page.locator('input[name="password"]').fill(env.LIVE_DASHBOARD_PASSWORD);
  stage='submit login';
  await page.locator('button[type="submit"]').click();
  stage='await dashboard redirect';
  await page.waitForURL(url=>url.pathname.startsWith('/dashboard'),{timeout:60000});
  authenticating=false;
  stage='dashboard inspection';
  report.interactions.login='passed using configured account credentials; no credentials persisted';
  await page.waitForFunction(()=>document.querySelector('aside > div:nth-child(2) p:last-child')?.textContent.trim());
  report.environment.role=await page.locator('aside > div:nth-child(2) p:last-child').textContent().then(s=>['owner','admin','staff','viewer'].includes(s.trim().toLowerCase())?s.trim().toLowerCase():'unverified');
  const routes=followup?['/dashboard/clients/new']:['/dashboard','/dashboard/clients','/dashboard/inbox','/dashboard/review-queue','/dashboard/ledger','/dashboard/gst-summary','/dashboard/reports','/dashboard/exports','/dashboard/audit-logs','/dashboard/operations','/dashboard/settings','/dashboard/platform'];
  if(captureOnly)routes.push('/dashboard/clients/new');
  for(const width of (captureOnly?[320,1440]:followup?[320,768,1440]:[320,390,768,1024,1280,1440,1920])) {
    const viewport={width,height:width<400?844:900}; await page.setViewportSize(viewport);
    for(const route of routes) {try{await inspect(route,viewport);}catch{report.results.push({route,viewport,result:'BLOCKED: route load or dashboard landmark timed out'});} }
    console.log('Completed viewport '+width);
  }
  await page.setViewportSize({width:1440,height:900});
  await inspect('/dashboard',{width:1440,height:900});
  await page.keyboard.press('Tab');
  report.interactions.firstTabIsSkip=await page.getByRole('link',{name:'Skip to dashboard content'}).evaluate(el=>el===document.activeElement);
  await page.getByRole('link',{name:'Skip to dashboard content'}).focus();await page.keyboard.press('Enter');
  report.interactions.skipFocus=await page.locator('#dashboard-content').evaluate(el=>el===document.activeElement);
  await page.getByRole('button',{name:/Collapse sidebar/}).click();
  await page.getByRole('navigation',{name:'Workspace',exact:true}).getByRole('link',{name:'Clients',exact:true}).focus();
  report.interactions.collapsedTooltip=await page.getByRole('tooltip',{name:'Clients',exact:true}).isVisible();
  await page.keyboard.press('Escape');
  report.interactions.tooltipAfterEscape=await page.getByRole('tooltip',{name:'Clients',exact:true}).isVisible();
  await page.getByRole('button',{name:/Expand sidebar/}).click();
  await page.setViewportSize({width:390,height:844});
  const trigger=page.getByRole('button',{name:'Open workspace navigation'});
  await trigger.click();await page.keyboard.press('Escape');
  report.interactions.mobileEscape=!(await page.getByRole('dialog').isVisible());
  report.interactions.mobileFocusReturn=await trigger.evaluate(el=>el===document.activeElement);
  // Discover record destinations in memory only; never persist live IDs or content.
  for(const [list,prefix] of [['clients','clients'],['review-queue','review-queue'],['ledger','ledger'],['gst-summary','gst-summary']]) {
    if(followup && !['clients','ledger'].includes(prefix))continue;
    await page.goto(origin+'/dashboard/'+list,{waitUntil:'domcontentloaded'});
    const href=await page.locator('a').evaluateAll((els,prefix)=>els.map(e=>e.getAttribute('href')).find(h=>new RegExp('^/dashboard/'+prefix+'/[0-9a-f-]{36}$').test(h)),prefix);
    if(href) for(const width of (captureOnly?[320,1440]:followup?[320,768,1440]:[320,1280,1440])) {const vp={width,height:900};await page.setViewportSize(vp);await inspect(href+(followup?'/edit':''),vp);if(captureOnly&&['clients','ledger'].includes(prefix))await inspect(href+'/edit',vp);}
    else report.interactions[list+'Detail']='BLOCKED: no discoverable record link';
  }
} catch (error) {report.failure='Check failed at '+stage;report.errorType=error.name;report.loginDiagnostic=await page.evaluate(()=>({path:location.pathname.startsWith('/dashboard')?'/dashboard':location.pathname,invalidCredentials:document.body.innerText.toLowerCase().includes('invalid login credentials'),rateLimited:/too many|rate limit/i.test(document.body.innerText),setupRequired:/not configured|setup required/i.test(document.body.innerText),alertPresent:!!document.querySelector('[aria-live]')})).catch(()=>null);}
finally {authenticating=false;writeFileSync(out,JSON.stringify(report,null,2));await context.close();await browser.close();}
console.log(JSON.stringify({samples:report.results.length,failure:report.failure||null,interactions:report.interactions,pageErrorCount:report.pageErrorCount}));
