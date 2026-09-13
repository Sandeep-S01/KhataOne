import {readFileSync,writeFileSync,readdirSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {parseEnv} from 'node:util';
import path from 'node:path';
const dir='docs/audits/ui-ux/2026-09-13-diagnosis';
const baseline=JSON.parse(readFileSync(dir+'/evidence/baseline.json','utf8'));
const sha=p=>createHash('sha256').update(readFileSync(p)).digest('hex');
const changed=Object.entries(baseline.hashes).filter(([p,h])=>!existsSync(p)||sha(p)!==h).map(([p])=>p);
const git=args=>execFileSync('git',args,{encoding:'utf8'}).trim();
const outsideAdded=git(['ls-files','--others','--exclude-standard']).split('\n').filter(p=>p&&!p.startsWith(dir+'/')&&!(p in baseline.hashes));
const files=p=>readdirSync(p,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(path.join(p,e.name)):[path.join(p,e.name)]);
const env=parseEnv(readFileSync('.env.local','utf8'));
const secrets=Object.entries(env).filter(([k,v])=>/PASSWORD|SECRET|TOKEN|KEY/.test(k)&&v.length>=8).map(([,v])=>v);
const secretHits=files(dir).filter(p=>/\.(md|json|csv|mjs)$/.test(p)).filter(p=>{const t=readFileSync(p,'utf8');return secrets.some(s=>t.includes(s));});
const findings=JSON.parse(readFileSync(dir+'/evidence/findings.json','utf8'));
const markdown=readFileSync(dir+'/FINDINGS.md','utf8');
const mdIds=[...markdown.matchAll(/^## (KO-UX-\d+) /gm)].map(m=>m[1]);
const csv=readFileSync(dir+'/FINDINGS.csv','utf8');
function csvRows(s){const rows=[];let row=[],field='',quoted=false;for(let i=0;i<s.length;i++){const c=s[i];if(c==='"'){if(quoted&&s[i+1]==='"'){field+='"';i++;}else quoted=!quoted;}else if(c===','&&!quoted){row.push(field);field='';}else if(c==='\n'&&!quoted){row.push(field.replace(/\r$/,''));rows.push(row);row=[];field='';}else field+=c;}if(field||row.length){row.push(field);rows.push(row);}return rows;}
const rows=csvRows(csv),csvIds=rows.slice(1).map(r=>r[0]);
const invalidSources=[];
for(const f of findings)for(const loc of f.source.split('; ')){const m=loc.match(/^(.*):(\d+)$/);if(!m||!existsSync(m[1])||Number(m[2])>readFileSync(m[1],'utf8').split('\n').length)invalidSources.push(loc);}
const expected=['README.md','SYSTEM_UI_MAP.md','COMPONENT_DESIGN_SYSTEM_AUDIT.md','UI_UX_FLOW_AUDIT.md','RESPONSIVE_ACCESSIBILITY_AUDIT.md','PERFORMANCE_UX_BASELINE.md','FINDINGS.md','IMPLEMENTATION_INPUTS.md'];
const report={checkedAt:new Date().toISOString(),branch:git(['branch','--show-current']),commit:git(['rev-parse','HEAD']),initialStatus:baseline.status,finalStatus:git(['status','--short']),baselineFiles:Object.keys(baseline.hashes).length,changedExistingFiles:changed,unexpectedOutsideAuditAdditions:outsideAdded,applicationSourceChangeCount:changed.filter(p=>p.startsWith('src/')||p==='middleware.ts'||/^(package|next|tailwind|tsconfig)/.test(p)).length,secretValueMatchFiles:secretHits.map(p=>p.replaceAll('\\','/')),findingsCount:findings.length,markdownAndCsvIdsMatch:JSON.stringify(mdIds)===JSON.stringify(csvIds)&&JSON.stringify(mdIds)===JSON.stringify(findings.map(f=>f.id)),csvConsistentColumns:rows.every(r=>r.length===rows[0].length),invalidSourceLocations:invalidSources,reports:expected.map(p=>({file:p,bytes:readFileSync(dir+'/'+p).length})),evidencePolicy:'No raw HAR, cookie/session state, live source documents or financial payloads captured; hosted screenshots masked before capture. Authentication only; all business writes blocked.'};
report.pass=changed.length===0&&outsideAdded.length===0&&secretHits.length===0&&report.markdownAndCsvIdsMatch&&report.csvConsistentColumns&&invalidSources.length===0;
writeFileSync(dir+'/evidence/final-verification.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({pass:report.pass,baselineFiles:report.baselineFiles,changedExistingFiles:changed,applicationSourceChangeCount:report.applicationSourceChangeCount,findingsCount:findings.length,idsMatch:report.markdownAndCsvIdsMatch,secretValueMatchCount:secretHits.length}));
if(!report.pass)process.exitCode=1;
