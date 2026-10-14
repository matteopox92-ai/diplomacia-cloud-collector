import {chromium} from 'playwright';
import {safeDiagnostic,publicAuthProtocol} from './diagnostic-core.mjs';
const origin='https://diplomacia.com.tr';
const browser=await chromium.launch({headless:true});
let output={browserReachedGame:false};
try {
  const context=await browser.newContext(); // No storage state or login supplied.
  const page=await context.newPage();
  const sourceReads=[];
  page.on('response',response=>{
    const url=new URL(response.url());
    if(url.origin===origin&&url.pathname.startsWith('/_expo/static/js/')&&url.pathname.endsWith('.js')&&response.ok()){
      sourceReads.push(response.text().catch(()=>''));
    }
  });
  const response=await page.goto(origin+'/',{waitUntil:'networkidle',timeout:60000});
  output.browserReachedGame=!!response?.ok()&&new URL(page.url()).origin===origin;
  const publicCode=(await Promise.all(sourceReads)).join('\n');
  output.publicCode=publicCode;
  output.protocol=publicAuthProtocol(publicCode);
  // This known read-only endpoint is used only to determine login requirements.
  // Its body is never written to disk, artifacts, screenshots or logs.
  const api=await page.evaluate(async ()=>{
    const r=await fetch('/api/provinces/buildings/world-ranking?buildingType=okul',{method:'GET',credentials:'omit',redirect:'error'});
    let requiresLogin=false;
    try {const body=await r.json();requiresLogin=body?.code==='TOKEN_REQUIRED';}catch{}
    return {status:r.status,requiresLogin};
  });
  output.apiStatus=api.status;
  output.requiresLogin=api.requiresLogin;
} catch {
  // Do not print exception text: network and browser errors may include URLs.
  output.failed=true;
} finally { await browser.close(); }
console.log(JSON.stringify({...safeDiagnostic(output),protocol:output.protocol}));
if(!output.browserReachedGame)process.exitCode=1;
