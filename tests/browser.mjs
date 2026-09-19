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
await check('DayOS monitor: declared source, explicit states and no health claim when nothing is collected',async()=>{
 await nav('DayOS monitor');
 assert.equal(await page.locator('h1').innerText(),'DayOS monitor');
 const banner=page.locator('[data-collection]');
 assert.equal(await banner.getAttribute('data-collection'),'not-collected');
 assert.match(await banner.innerText(),/No observation collected/);
 assert.match(await banner.innerText(),/Observed at\s+never/);
 const row=id=>page.locator(`[data-monitor-row="${id}"]`);
 const expect=async(id,state,pattern)=>{assert.equal(await row(id).getAttribute('data-state'),state,`${id} state`);if(pattern)assert.match(await row(id).innerText(),pattern,`${id} text`);};
 await expect('repository','derived',/github\.com\/yazilimlar\/artemis-omni/);
 await expect('checkout','declared',/~\/Projects\/artemis-omni/);
 await expect('branch','declared',/feature\/dayos-next-integration-preview/);
 await expect('head','declared',/1f9d2346e8ca/);
 await expect('working_tree','not-collected',/not collected/);
 await expect('production_status','declared',/404/);
 await expect('source_vs_serving','derived',/Different SHAs/);
 await expect('live_deployment','blocked',/level 0/);
 await expect('migrations','declared',/5 migration files/);
 await expect('live_backend','blocked',/OG-CONN-015/);
 assert.equal(await page.locator('[data-monitor-row][data-state="observed"]').count(),0,'nothing is observed when nothing was collected');
 assert.ok(await page.locator('[data-monitor-row]').count()>=12);
 for(const tr of await page.locator('[data-monitor-row]').all()){
  assert.match(await tr.locator('.badge-row').getAttribute('aria-label'),/: (declared|derived|blocked|unknown|not-collected|stale|error|observed) — .+; truth /,'each row states its state in words');
  assert.ok((await tr.locator('.source').innerText()).length>3,'each row cites its source');
 }
 assert.equal(await page.locator('#monitor-legend li').count(),8,'all eight states are explained');
 assert.doesNotMatch(await page.locator('main').innerText(),/\bhealthy\b/i,'no health claim');
 assert.equal(await page.locator('[data-drift="match"]').count(),0,'no agreement without evidence');});
await check('DayOS monitor: open actions are a plain repository link and a copy-only folder path',async()=>{
 await nav('DayOS monitor');
 const list=page.locator('#monitor-actions');
 assert.equal(await list.locator('a').count(),1);
 const a=list.locator('a');
 assert.equal(await a.getAttribute('href'),'https://github.com/yazilimlar/artemis-omni');
 assert.equal(await a.getAttribute('rel'),'noopener noreferrer');
 assert.equal(await list.locator('[data-open="folder"] a').count(),0,'a folder is never a link');
 assert.match(await list.locator('[data-open="folder"]').innerText(),/npm run open -- dayos/);
 assert.equal(await page.locator('[data-open="website"]').count(),0,'no website is declared, so none is offered');
 assert.equal(await page.locator('main button:not([disabled]):not([data-copy])').count(),0,'the only controls on this view are Copy buttons');});
await check('DayOS monitor: resources and simulated signals are shown and labelled',async()=>{
 await nav('DayOS monitor');
 assert.equal(await page.locator('#monitor-resources li').count(),2,'the source repository and the checkout');
 assert.match(await page.locator('#monitor-resources').innerText(),/repository:github\.com:yazilimlar\/artemis-omni/);
 assert.equal(await page.locator('#monitor-events li').count(),1);
 assert.match(await page.locator('#monitor-events').innerText(),/SIMULATED/);
 assert.match(await page.locator('#monitor-events').innerText(),/not counted/);});
await check('DayOS opens from its evidence drawer, and the map draws its derived source edge',async()=>{
 await nav('Portfolio');await page.locator('.project-card[data-project="dayos"]').click();
 await page.getByRole('dialog').locator('[data-open-monitor]').click();
 assert.equal(await page.locator('h1').innerText(),'DayOS monitor');
 await nav('Ecosystem');await page.locator('#map-preset').selectOption('repository');
 assert.ok(await page.locator('.edge[data-edge="source_repository"][data-truth="derived"]').count()>=1,'the derived DayOS → repository edge is drawn and marked derived');
 await page.locator('#map-reset').click();});
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
await check('the brand is present, accessible, local-only and never semantic',async()=>{await nav('Portfolio');
 // the compact symbol sits beside real, selectable "OctopusG" text — never inside an image
 const mark=page.locator('.brand img');
 assert.equal(await mark.getAttribute('src'),'/brand/octopusg-symbol.png');
 assert.equal(await mark.getAttribute('alt'),'','the symbol is decorative beside real text');
 assert.equal((await page.locator('.brand span').first().innerText()).split('\n')[0].trim(),'OctopusG');
 // the full lockup carries the tagline in its alternative text, on a light plate
 const lockup=page.locator('.brand-plate img');
 assert.equal(await lockup.count(),1);
 assert.equal(await lockup.getAttribute('src'),'/brand/octopusg-logo.png');
 assert.equal(await lockup.getAttribute('alt'),'OctopusG — Architect-Engineer of Complex Systems');
 const plate=await page.locator('.brand-plate').evaluate(el=>getComputedStyle(el).backgroundColor);
 assert.match(plate,/rgb\(2\d\d, 2\d\d, 2\d\d\)/,'the dark-navy wordmark sits on a light plate');
 // every brand image actually loaded from this origin at its natural size
 for(const img of await page.locator('img').all()){
  const {src,w,h}=await img.evaluate(el=>({src:el.getAttribute('src'),w:el.naturalWidth,h:el.naturalHeight}));
  assert.match(src,/^\/(brand\/|favicon\.svg)/,`${src} must be a local path`);
  assert.ok(w>0&&h>0,`${src} failed to load`);
 }
 // the tagline is real text in the footer, and absent from the compact header
 assert.equal((await page.locator('footer .tagline').innerText()).trim(),'Architect-Engineer of Complex Systems');
 assert.doesNotMatch(await page.locator('.sidebar').innerText(),/Architect-Engineer/);
 // the lockup is not shown where it would be illegible, and nothing overflows at phone width
 await page.setViewportSize({width:390,height:844});
 assert.equal(await page.locator('.brand-plate').isVisible(),false,'the lockup is hidden in compact contexts');
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true);
 assert.equal(await page.locator('.brand img').isVisible(),true,'the compact symbol still carries the brand');
 await page.setViewportSize({width:1512,height:982});
 // the lockup appears only on Portfolio; no other screen was redesigned
 await nav('Project matrix');
 assert.equal(await page.locator('.brand-plate').count(),0);
 await nav('Portfolio');
 // and the brand changed nothing stored
 assert.equal(await page.evaluate(()=>document.title),'OctopusG — AgoraXAI Portfolio Operating System');
 await page.evaluate(()=>Promise.all([...document.images].map(i=>i.decode().catch(()=>null))));
 await page.screenshot({path:'work/brand-portfolio.png',fullPage:false});});
await check('safe open actions are links or text, never a request from the app',async()=>{await nav('Portfolio');
 await page.locator('.project-card[data-project="agoraxai-web"]').click();
 const d=page.getByRole('dialog');
 const list=d.locator('#open-actions li');
 assert.ok(await list.count()>0,'the drawer offers open actions');
 // every link is https, opens in a new tab, and carries both rel tokens
 const links=await d.locator('#open-actions a').all();
 assert.ok(links.length>0);
 for(const a of links){
  assert.match(await a.getAttribute('href'),/^https:\/\//,'only https is linkable');
  assert.equal(await a.getAttribute('target'),'_blank');
  const rel=await a.getAttribute('rel');
  assert.ok(rel.includes('noopener')&&rel.includes('noreferrer'),'rel must carry both tokens');
 }
 // every action says what kind of evidence it is, in words
 for(const label of await d.locator('#open-actions li').evaluateAll(ls=>ls.map(l=>l.getAttribute('aria-label'))))
  assert.match(label,/\((declared|observed|derived)(, not a link)?\)/);
 await page.keyboard.press('Escape');
 // a folder is text plus Copy, never a link, and it names the owner-run command
 await page.locator('.project-card[data-project="agoraxai-control-plane"]').click();
 const folder=page.getByRole('dialog').locator('#open-actions li[data-open="folder"]');
 assert.equal(await folder.count(),1);
 assert.equal(await folder.locator('a').count(),0,'a folder is never a link');
 assert.equal(await folder.locator('[data-copy]').count(),1,'a folder offers Copy');
 assert.match(await folder.innerText(),/npm run open -- agoraxai-control-plane/);
 assert.equal(await page.getByRole('dialog').locator('a[href^="file:"]').count(),0,'no file:// link anywhere');
 await page.keyboard.press('Escape');});
await check('action requests are evaluated against tier and level, and never executed',async()=>{await nav('Approval queue');
 const rows=page.locator('#action-requests tbody tr');
 assert.ok(await rows.count()>=6);
 // every row is labelled SIMULATED and states its verdict in words
 assert.equal(await page.locator('#action-requests .badge.inferred').count(),await rows.count());
 for(const label of await page.locator('#action-requests .badge-row').evaluateAll(gs=>gs.map(g=>g.getAttribute('aria-label'))))
  assert.match(label,/would be (permitted|refused) — .+ \(simulated\)/);
 // the two rules that must be visible as outcomes
 const critical=page.locator('[data-request="rotate-dns-record"]');
 assert.equal(await critical.getAttribute('data-allowed'),'false');
 assert.match(await critical.innerText(),/level 4 is never available for T4/);
 const incomplete=page.locator('[data-request="promote-deployment"]');
 assert.equal(await incomplete.getAttribute('data-allowed'),'false');
 assert.match(await incomplete.innerText(),/all seven fields in docs\/06/);
 assert.match(await incomplete.innerText(),/missing: /);
 const employer=page.locator('[data-request="observe-from-company-laptop"]');
 assert.equal(await employer.getAttribute('data-allowed'),'false');
 assert.match(await employer.innerText(),/permits no OctopusG action/);
 // the seven fields are listed in the documented order
 assert.deepEqual(await page.locator('.dossier li').evaluateAll(ls=>ls.map(l=>l.getAttribute('data-field'))),
  ['proposedChange','affectedObjects','backup','dryRun','rollback','ownerApproval','executionEvidence']);
 // nothing on the screen offers to run anything
 const text=await page.locator('main').innerText();
 for(const pattern of [/\bExecute\b/,/\bRun now\b/,/\bApprove and run\b/])
  assert.ok(!pattern.test(text),`the approval queue must not offer ${pattern}`);});
await check('inbox renders the simulated fixtures, filters them, and counts none of them',async()=>{await nav('Inbox');
 const rows=page.locator('#inbox tbody tr');
 const all=await rows.count();
 assert.ok(all>=6,'the fixtures are rendered');
 assert.equal(await page.locator('#inbox tbody tr .badge.inferred').count(),all,'every row is visibly SIMULATED');
 assert.match(await page.locator('main').innerText(),/0 countable/,'no simulated event is countable');
 assert.match(await page.locator('main').innerText(),/duplicate provider delivery/i);
 // severity first, then most recent
 assert.equal(await rows.first().getAttribute('data-severity'),'critical');
 // each of the five documented filters narrows the table, and they intersect
 const count=async()=>Number(await page.locator('#event-count').innerText());
 await page.locator('#event-severity').selectOption('critical');
 assert.equal(await count(),1);
 await page.locator('#event-connector').selectOption('mac-status');
 assert.equal(await count(),0,'filters intersect rather than union');
 await page.getByRole('button',{name:'Reset',exact:true}).click();
 assert.equal(await count(),all);
 await page.locator('#event-decision').selectOption('true');
 assert.equal(await count(),2);
 for(const row of await rows.all())assert.match(await row.innerText(),/requires a decision/);
 await page.getByRole('button',{name:'Reset',exact:true}).click();
 await page.locator('#event-status').selectOption('dismissed');
 assert.equal(await count(),1);
 await page.getByRole('button',{name:'Reset',exact:true}).click();
 await page.locator('#event-product').selectOption('dayos');
 assert.equal(await count(),1);
 await page.getByRole('button',{name:'Reset',exact:true}).click();
 // no personal data, no machine identifier, no credential anywhere on the screen
 const text=await page.locator('main').innerText();
 for(const pattern of [/@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/,/\/Users\//,/\/home\//,/\b(?:\d{1,3}\.){3}\d{1,3}\b/,/ghp_[A-Za-z0-9]{20,}/])
  assert.ok(!pattern.test(text),`inbox must not show ${pattern}`);
 // every row states its meaning in words for a screen reader
 for(const label of await page.locator('#inbox .badge-row').evaluateAll(gs=>gs.map(g=>g.getAttribute('aria-label'))))
  assert.match(label,/simulated/,'the row is described as simulated in text, not by colour');});
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
await check('responsive views have no page-level horizontal overflow',async()=>{await page.setViewportSize({width:390,height:844});for(const name of ['Portfolio','Project matrix','Ecosystem','Deployment drift','DayOS monitor','Devices','Requirements','Inbox','Approval queue','Timeline','KPI framework','Connectors']){await nav(name);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true,`${name} overflow`);}await nav('Portfolio');await page.screenshot({path:'work/portfolio-mobile.png',fullPage:true});});
await check('mobile main nav scrolls horizontally and does not clip item focus outlines',async()=>{const n=page.getByRole('navigation',{name:'Main navigation'});const m=await n.evaluate(el=>{const s=getComputedStyle(el);return{scrollWidth:el.scrollWidth,clientWidth:el.clientWidth,overflowX:s.overflowX,padTop:parseFloat(s.paddingTop),padBottom:parseFloat(s.paddingBottom)};});assert.equal(m.overflowX,'auto','mobile nav must be a horizontal scroller');assert.ok(m.scrollWidth>m.clientWidth,`nav must overflow and scroll at 390px, got scrollWidth ${m.scrollWidth} <= clientWidth ${m.clientWidth}`);assert.ok(m.padTop>=4&&m.padBottom>=4,`the scroller needs block padding or it clips the 4px focus outline; got ${m.padTop}/${m.padBottom}`);const widths=await n.getByRole('button').evaluateAll(els=>els.map(e=>e.getBoundingClientRect().width));assert.ok(Math.min(...widths)>=56,`nav items must keep intrinsic width, narrowest was ${Math.min(...widths)}`);});
await check('all views contain meaningful content, no browser errors or external requests',async()=>{assert.deepEqual(errors,[]);assert.deepEqual(external,[]);});
await writeFile('work/browser-results.json',JSON.stringify({passed:checks.length,checks,errors,externalRequests:external},null,2));
}finally{await browser.close();}
