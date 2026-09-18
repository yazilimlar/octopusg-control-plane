import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
const {project_row_count:rows}=JSON.parse(await readFile('data/registry.lock.json','utf8'));
await mkdir('work',{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true,args:['--disable-background-networking','--disable-component-update','--no-default-browser-check']});
const context=await browser.newContext({viewport:{width:1512,height:982}});
const page=await context.newPage();const errors=[],external=[];const checks=[];
page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
await context.route('**/*',route=>{const u=new URL(route.request().url());if(u.hostname!=='127.0.0.1'){external.push(u.origin);return route.abort();}return route.continue();});
const check=async(name,fn)=>{await fn();checks.push(name);console.log('PASS '+name);};
const nav=async(name)=>page.getByRole('navigation',{name:'Main navigation'}).getByRole('button',{name,exact:!name.includes('Approval')}).click();
try{
await page.goto('http://127.0.0.1:4317');
await check(`all ${rows} portfolio cards render`,async()=>assert.equal(await page.locator('.project-card').count(),rows));
await check('search and reset',async()=>{await page.getByRole('searchbox').fill('2731c29f53dcde7d565a84acc1e4f1886da29c6a');assert.equal(await page.locator('.project-card').count(),1);await page.getByRole('button',{name:'Reset',exact:true}).click();assert.equal(await page.locator('.project-card').count(),rows);});
await check('taxonomy, risk, status and evidence filters combine',async()=>{await page.getByRole('combobox',{name:'Taxonomy',exact:true}).selectOption('Ventures');await page.getByLabel('Risk',{exact:true}).selectOption('High');await page.getByLabel('Status',{exact:true}).selectOption('blocked');await page.getByLabel('Evidence',{exact:true}).selectOption('observed');assert.equal(await page.locator('.project-card').count(),1);assert.match(await page.locator('.project-card').innerText(),/Pinar/);await page.getByRole('button',{name:'Reset',exact:true}).click();});
await check('empty search state',async()=>{await page.getByRole('searchbox').fill('none-xyz-unique');assert.match(await page.locator('#results').innerText(),/No matching/);await page.getByRole('button',{name:'Reset',exact:true}).click();});
await check('evidence drawer and Escape close',async()=>{await page.locator('.project-card[data-project="pinarevleri"]').click();assert.match(await page.getByRole('dialog').innerText(),/INFERENCE|inferred/i);assert.match(await page.getByRole('dialog').innerText(),/risk 85/);await page.keyboard.press('Escape');assert.equal(await page.getByRole('dialog').count(),0);});
await page.screenshot({path:'work/portfolio-desktop.png',fullPage:true});
await check('evidence drawer lists derived resources and the declared owning entity',async()=>{await page.locator('.project-card[data-project="agoraxai-control-plane"]').click();const d=page.getByRole('dialog');assert.ok(await d.locator('#resource-list li[data-resource^="checkout:"]').count()>0,'checkout resources are listed');assert.ok(await d.locator('#resource-list li[data-resource^="document:"]').count()>0,'document resources are listed');assert.equal((await d.locator('#legal-entity').innerText()).trim(),'undeclared');await page.keyboard.press('Escape');});
await check(`matrix retains all ${rows} rows and required columns`,async()=>{await nav('Project matrix');assert.equal(await page.locator('tbody tr').count(),rows);assert.equal(await page.locator('thead th').count(),8);await page.getByRole('searchbox').fill('unmatchable-xyz');assert.match(await page.locator('tbody').innerText(),/No matching/);await page.getByRole('button',{name:'Reset',exact:true}).click();});
await check('ecosystem nodes, focus, relation filtering and zoom',async()=>{await nav('Ecosystem');assert.equal(await page.locator('[data-node]').count(),rows);await page.locator('#map-focus').selectOption('agoraxai-atlas');assert.equal(await page.locator('.map-node.selected').count(),1);await page.locator('#map-kind').selectOption('ownership');assert.equal(await page.locator('.edge').count(),1);await page.getByRole('button',{name:'Zoom in',exact:true}).click();assert.notEqual(await page.locator('svg.ecosystem-map').getAttribute('viewBox'),'0 0 1000 760');await page.getByRole('button',{name:'Reset map'}).click();});
await page.screenshot({path:'work/ecosystem-desktop.png',fullPage:true});
await check('generated map: lanes, colour-by toggle, presets and non-colour edge styles',async()=>{await nav('Ecosystem');
 assert.ok(await page.locator('[data-lane]').count()>=4,'lanes are drawn from the registry');
 const lifecycleLabels=await page.locator('[data-node] .map-meta').allTextContents();
 await page.locator('#map-colour').selectOption('risk');
 assert.ok(await page.locator('[data-node].c-risk-high, [data-node].c-risk-elevated, [data-node].c-risk-lower').count()>0,'risk colouring applies');
 assert.notDeepEqual(await page.locator('[data-node] .map-meta').allTextContents(),lifecycleLabels,'the colour value is also shown as text');
 assert.equal(await page.locator('[data-node].c-lifecycle-active-development').count(),0,'exactly one colour dimension at a time');
 await page.locator('#map-colour').selectOption('truth');
 assert.ok(await page.locator('[data-node].c-truth-observed, [data-node].c-truth-declared, [data-node].c-truth-unknown').count()>0);
 const declaredDash=await page.locator('.edge[data-truth="declared"]').first().getAttribute('stroke-dasharray');
 assert.ok(declaredDash,'declared edges are dashed, not distinguished by colour alone');
 assert.match(await page.locator('#map-legend').innerText(),/declared: dashed/);
 await page.locator('#map-preset').selectOption('repository');
 assert.ok(await page.locator('[data-node][data-kind="repository"]').count()>0,'repository preset adds repositories');
 assert.ok(await page.locator('[data-node][data-kind="checkout"]').count()>0,'repository preset adds checkouts');
 assert.ok(await page.locator('.edge[data-edge="checked_out_at"]').count()>0);
 await page.getByRole('button',{name:'Reset map'}).click();
 assert.equal(await page.locator('[data-node]').count(),rows,'reset returns to the portfolio preset');});
await check('drift compares recorded source and production SHAs',async()=>{await nav('Deployment drift');assert.equal(await page.locator('#results tr').count(),rows);const dayos=page.locator('#results tr').filter({has:page.getByRole('button',{name:'DayOS',exact:true})});assert.match(await dayos.innerText(),/1f9d2346e8ca/);assert.match(await dayos.innerText(),/dd623e07da24/);assert.match(await dayos.innerText(),/Different SHAs/i);});
await check('declared-versus-observed drift never reports agreement without fresh evidence',async()=>{await nav('Deployment drift');
 const table=page.locator('#local-drift');
 assert.equal(await table.locator('tbody tr').count(),rows,'every row is compared');
 const row=table.locator('[data-drift-row="agoraxai-control-plane"]');
 for(const field of ['path','branch','remote']){
  const cell=row.locator(`[data-drift-field="${field}"]`);
  assert.match(await cell.innerText(),/declared:/);
  assert.match(await cell.innerText(),/observed: not collected|observed: /);
  const label=await cell.locator('.badge-row').getAttribute('aria-label');
  assert.match(label,/(match|differs|stale|unknown) —/,'each cell states its comparison in words');
  assert.match(label,/confidence (high|medium|low|none)/,'evidence quality is available as text');
 }
 const summary=await row.locator('[data-drift-summary]').getAttribute('data-drift-summary');
 assert.equal(summary,'unknown','with no observation collected the summary is unknown, never a match');
 assert.match(await table.innerText(),/No observation has been collected/);
 assert.equal(await page.locator('#local-drift [data-drift-summary="match"]').count(),0,'nothing claims agreement without evidence');});
await check('visible naming is OctopusG while storage and schema keys are untouched',async()=>{
 assert.match(await page.title(),/^OctopusG — AgoraXAI Portfolio Operating System$/);
 assert.match(await page.locator('.brand').innerText(),/OctopusG/);
 assert.match(await page.locator('.edition').innerText(),/OCTOPUSG/);
 assert.match(await page.locator('footer').innerText(),/OctopusG — AgoraXAI Portfolio Operating System/);
 const storage=await page.evaluate(()=>Object.keys(localStorage));
 assert.ok(storage.every(k=>!k.startsWith('agoraxai.octopusg.')),'no renamed storage key is created');
 await nav('Approval queue');
 await page.locator('[data-workflow="A1"]').click();
 await page.getByRole('dialog').getByRole('textbox').fill('Naming compatibility check');
 await page.getByRole('button',{name:'Save simulated transition'}).click();
 assert.ok((await page.evaluate(()=>Object.keys(localStorage))).includes('agoraxai.octopus.workflow.v1'),'the v0.1 storage key still carries saved state');
 await page.getByRole('button',{name:'Reset simulation',exact:true}).click();
 await page.getByRole('button',{name:'Reset local simulation',exact:true}).click();});
await check('simulated approval persists and logs without execution',async()=>{await nav('Approval queue');await page.locator('[data-workflow="A1"]').click();await page.getByRole('dialog').getByRole('textbox').fill('Browser test simulated evidence only');await page.getByRole('button',{name:'Save simulated transition'}).click();assert.match(await page.locator('tbody tr').first().innerText(),/EVIDENCE/);await page.reload();await nav('Approval queue');assert.match(await page.locator('tbody tr').first().innerText(),/EVIDENCE/);await nav('Timeline');assert.match(await page.locator('main').innerText(),/Browser test simulated evidence only/);});
await check('reset simulation restores source proposals',async()=>{await nav('Approval queue');await page.getByRole('button',{name:'Reset simulation',exact:true}).click();await page.getByRole('button',{name:'Reset local simulation',exact:true}).click();assert.match(await page.locator('tbody tr').first().innerText(),/PROPOSED/);});
await check('devices view shows declared records only, with no machine identifier',async()=>{await nav('Devices');
 assert.equal(await page.locator('#devices tbody tr').count(),3);
 const company=page.locator('[data-device="company-laptop"]');
 assert.match(await company.innerText(),/BROWSER_ONLY \/ UNMANAGED \/ NO_LOCAL_ACCESS/);
 assert.equal(await company.locator('[data-observe]').getAttribute('data-observe'),'no');
 assert.match(await company.innerText(),/employer-owned; OctopusG never observes it/);
 assert.equal(await page.locator('[data-device="personal-mac"] [data-observe]').getAttribute('data-observe'),'yes');
 assert.equal(await page.locator('[data-device="personal-windows"] [data-observe]').getAttribute('data-observe'),'no');
 const text=await page.locator('main').innerText();
 for(const pattern of [/\/Users\//,/\/home\//,/C:\\Users/,/\b(?:[0-9a-f]{2}:){5}[0-9a-f]{2}\b/i,/\b(?:\d{1,3}\.){3}\d{1,3}\b/])
  assert.ok(!pattern.test(text),`devices view must not show ${pattern}`);
 // the policy grid is present and refuses level 4 for T3/T4
 assert.equal(await page.locator('#tiers [data-tier="T4"][data-level="4"]').getAttribute('data-allowed'),'no');
 assert.equal(await page.locator('#tiers [data-tier="T3"][data-level="4"]').getAttribute('data-allowed'),'no');
 assert.equal(await page.locator('#tiers [data-tier="T0"][data-level="1"]').getAttribute('data-allowed'),'yes');
 assert.equal(await page.locator('#devices').evaluate(t=>t.querySelectorAll('th[scope="col"]').length),6);
 assert.ok(await page.locator('.table-scroll[aria-label="Declared devices, scrollable"]').count()>0,'the table is labelled and keyboard scrollable');});
await check('requirements view exposes the ledger and its traceability',async()=>{await nav('Requirements');
 assert.ok(await page.locator('#capabilities tbody tr').count()>=30);
 assert.ok(await page.locator('[data-requirement]').count()>=80);
 const row=page.locator('[data-requirement="OG-OBS-001"]');
 assert.equal(await row.getAttribute('data-status'),'VERIFIED');
 const text=await row.innerText();
 for(const fragment of ['OG-OBS-001','INTEGRATION','WP-03','v0.2','OG-DATA-002','npm run observe','tests/observe.test.ts','WP-03.md'])
  assert.ok(text.includes(fragment),`requirement row must expose ${fragment}`);
 assert.match(await page.locator('[data-capability="truth-and-provenance"]').innerText(),/AVAILABLE/);
 assert.ok((await page.locator('[data-capability="truth-and-provenance"]').innerText()).includes('OG-DATA-001'),'capability links to its requirements');
 const all=await page.locator('main').innerText();
 for(const pattern of [/\/Users\//,/\/home\//,/C:\\Users/,/ghp_[A-Za-z0-9]{20,}/])
  assert.ok(!pattern.test(all),`requirements view must not show ${pattern}`);});
await check('KPI placeholders remain unavailable',async()=>{await nav('KPI framework');assert.equal(await page.locator('tbody tr').count(),7);assert.equal(await page.locator('tbody .badge.unknown').count(),7);assert.match(await page.locator('main').innerText(),/Simulation events are excluded/);});
await check('Connection Center shows every connector at level 0 with disabled owner actions',async()=>{await nav('Connectors');
 const cards=page.locator('[data-connector-card]');
 assert.equal(await cards.count(),5,'one card per connector definition');
 const first=cards.first();
 const text=await first.innerText();
 for(const label of ['Account','Products','Level','State','Granted scopes','Last successful sync','Webhook health','Credential','Data freshness','Approved actions'])
  assert.ok(text.includes(label),`card anatomy must show ${label}`);
 assert.match(text,/0 — Registered/);
 assert.match(text,/REGISTERED/);
 assert.match(text,/no credential/);
 assert.match(text,/never/);
 // every lifecycle state is shown, and only the first is marked current
 assert.equal(await page.locator('.lifecycle li').count(),7);
 assert.equal(await page.locator('.lifecycle li.current').count(),1);
 assert.match(await page.locator('.lifecycle li.current').innerText(),/REGISTERED/);
 // owner actions exist, are all disabled, and each carries its reason
 const actions=page.locator('[data-owner-action]');
 assert.equal(await actions.count(),20,'four owner actions on each of five cards');
 for(const b of await actions.all())assert.equal(await b.isDisabled(),true,'no owner action is ever enabled in v0.2');
 assert.equal(await page.locator('.disabled-reasons li').count(),20);
 // no authorization flow and no credential input exists anywhere on the screen
 assert.equal(await page.locator('input,form,[type="password"]').count(),0,'no credential or authorization form');
 const all=await page.locator('main').innerText();
 for(const pattern of [/ghp_[A-Za-z0-9]{20,}/,/\/Users\//,/Connect now/i,/Sign in/i])
  assert.ok(!pattern.test(all),`Connection Center must not show ${pattern}`);
 // "authorization" appears as explanation, never as an affordance: the only enabled controls on
 // the screen are the five v0.1 inspect buttons, and no link leaves the loopback origin.
 const enabled=await page.locator('main button:not([disabled])').all();
 for(const b of enabled)assert.match((await b.innerText()).trim(),/^Inspect disabled response$/,'the only enabled control is the v0.1 inspect button');
 assert.equal(enabled.length,5);
 for(const href of await page.locator('main a').evaluateAll(as=>as.map(a=>a.href)))
  assert.match(href,/^http:\/\/127\.0\.0\.1|^$/,'no provider sign-in link');
 assert.match(all,/requires an owner authorization recorded at the gate/);});
await check('disabled connector probes return blocked',async()=>{await nav('Connectors');assert.equal(await page.locator('[data-connector]').count(),5);for(const button of await page.locator('[data-connector]').all())await button.click();assert.equal(await page.locator('.connector-result:not([hidden])').count(),5);assert.match(await page.locator('#result-github').innerText(),/"status": "blocked"/);});
await check('responsive views have no page-level horizontal overflow',async()=>{await page.setViewportSize({width:390,height:844});for(const name of ['Portfolio','Project matrix','Ecosystem','Deployment drift','Devices','Requirements','Approval queue','Timeline','KPI framework','Connectors']){await nav(name);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true,`${name} overflow`);}await nav('Portfolio');await page.screenshot({path:'work/portfolio-mobile.png',fullPage:true});});
await check('mobile main nav scrolls horizontally and does not clip item focus outlines',async()=>{const n=page.getByRole('navigation',{name:'Main navigation'});const m=await n.evaluate(el=>{const s=getComputedStyle(el);return{scrollWidth:el.scrollWidth,clientWidth:el.clientWidth,overflowX:s.overflowX,padTop:parseFloat(s.paddingTop),padBottom:parseFloat(s.paddingBottom)};});assert.equal(m.overflowX,'auto','mobile nav must be a horizontal scroller');assert.ok(m.scrollWidth>m.clientWidth,`nav must overflow and scroll at 390px, got scrollWidth ${m.scrollWidth} <= clientWidth ${m.clientWidth}`);assert.ok(m.padTop>=4&&m.padBottom>=4,`the scroller needs block padding or it clips the 4px focus outline; got ${m.padTop}/${m.padBottom}`);const widths=await n.getByRole('button').evaluateAll(els=>els.map(e=>e.getBoundingClientRect().width));assert.ok(Math.min(...widths)>=56,`nav items must keep intrinsic width, narrowest was ${Math.min(...widths)}`);});
await check('all views contain meaningful content, no browser errors or external requests',async()=>{assert.deepEqual(errors,[]);assert.deepEqual(external,[]);});
await writeFile('work/browser-results.json',JSON.stringify({passed:checks.length,checks,errors,externalRequests:external},null,2));
}finally{await browser.close();}
