import { readFileSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';
const dir = new URL('./', import.meta.url);
const rgb = hex=>hex.match(/[a-f0-9]{2}/gi).map(x=>parseInt(x,16));
const lum = c=>c.map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((n,v,i)=>n+v*[.2126,.7152,.0722][i],0);
const contrast=(a,b)=>{const x=lum(a),y=lum(b);return Math.round((Math.max(x,y)+.05)/(Math.min(x,y)+.05)*100)/100;};
const colors={success:'#168a4a',warning:'#8a5b11',danger:'#b42318',info:'#2563a8',brand:'#146b43'};
const contrastResults=Object.entries(colors).map(([name,hex])=>{const fg=rgb(hex),bg=fg.map(c=>c*.1+255*.9);return {name,foreground:hex,background:'10% foreground blended over white',ratio:contrast(fg,bg),normalTextAA:contrast(fg,bg)>=4.5};});
const browser=await chromium.launch();
const dates=[];
for(const timezoneId of ['UTC','Asia/Kolkata']) {const ctx=await browser.newContext({timezoneId});const p=await ctx.newPage();dates.push({timezoneId,...await p.evaluate(()=>{const now=new Date('2026-09-13T06:00:00Z');return {monthStart:new Date(now.getFullYear(),now.getMonth(),1).toISOString().slice(0,10),monthEnd:new Date(now.getFullYear(),now.getMonth()+1,0).toISOString().slice(0,10)};})});await ctx.close();}
await browser.close();
const src=readFileSync('src/components/gst-summary-form.tsx','utf8');
writeFileSync(new URL('local-diagnostics.json',dir),JSON.stringify({method:'Isolated arithmetic and Chromium Date expressions; no application mutations or integrations',sourceDateExpressionPresent:src.includes('new Date(now.getFullYear(), now.getMonth(), 1)'),contrastResults,dates,reviewPaginationExample:{fixture:'51 synthetic rows; first 50 do not match q; final row does',beforePageFilterMatches:1,afterFirstPageFilterMatches:0,hasNextBeforeFiltering:true,conclusion:'Current conditional pagination hides the route to later matches when filtered visible page is empty'}},null,2));
console.log(JSON.stringify({contrastResults,dates}));
