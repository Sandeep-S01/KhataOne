import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { parseEnv } from 'node:util';
import { spawnSync } from 'node:child_process';
const env={...process.env,NEXT_TELEMETRY_DISABLED:'1'};
for(const file of readdirSync('.').filter(x=>x.startsWith('.env'))) {for(const key of Object.keys(parseEnv(readFileSync(file,'utf8'))))env[key]='';}
for(const key of Object.keys(env))if(/SUPABASE|OPENAI|WHATSAPP|JOB_RUNNER|CRON_SECRET|LIVE_DASHBOARD|SMOKE_CA|SENTRY|RATE_LIMIT|READINESS_CHECK/.test(key))env[key]='';
env.NEXT_PUBLIC_APP_URL='http://127.0.0.1:3105';
const start=Date.now();
const r=spawnSync(process.execPath,['node_modules/next/dist/bin/next','build'],{env,encoding:'utf8',windowsHide:true,timeout:240000,maxBuffer:4*1024*1024});
writeFileSync(new URL('build.json',import.meta.url),JSON.stringify({command:'next build; all local integration values blank in child process',exitCode:r.status,durationMs:Date.now()-start,output:r.stdout+'\n'+r.stderr},null,2));
console.log(JSON.stringify({exitCode:r.status,durationMs:Date.now()-start}));
