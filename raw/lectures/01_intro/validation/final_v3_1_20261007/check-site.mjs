// Built-site integration QA. Run after full quarto render at repository root:
// node raw/lectures/01_intro/validation/final_v3_1_20261007/check-site.mjs
// Optional QA_SCOPE=smoke: final route + representative recheck after metadata-only edits.
// Checks source-derived slide order, optional detail navigation, all fragment
// states at 1600x900, and representative slides at 1280x720. No source edits.
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'../..'), repo=path.resolve(root,'../../..');
const site=path.join(repo,'_site'), prefix='/course-Modern-AI/';
const deckPath='raw/lectures/01_intro/lecture01_final_v3.1.html';
const loadedRequests=[];let stage='catalog';
const out=path.join(here,'screens');
await fs.mkdir(out,{recursive:true});
const require=createRequire(path.join(process.env.NODE_MODULES_DIR || path.join(os.homedir(),'.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules'),'package.json'));
const {chromium}=require('playwright');
const parts=['arch','data','training','inference','tools'];
const scope=process.env.QA_SCOPE==='smoke'?'smoke':'full';
async function expand(file,stack=[]) {
  if(stack.includes(file))throw Error('Recursive include: '+file);
  let source=(await fs.readFile(file,'utf8')).replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/,'');
  let result='',offset=0;
  for(const m of source.matchAll(/\{\{<\s*include\s+([^>]+?)\s*>\}\}/g)) {
    result+=source.slice(offset,m.index);
    const ref=m[1].trim().replace(/^['"]|['"]$/g,'');
    let target=path.resolve(root,ref);
    try {await fs.access(target);}catch{target=path.resolve(path.dirname(file),ref);}
    result+=await expand(target,[...stack,file]);offset=m.index+m[0].length;
  }
  return result+source.slice(offset);
}
const sourceSlides=[];
for(const part of parts){
  const body=await expand(path.join(root,`lecture01_part2_final_v3_${part}.qmd`));
  for(const m of body.matchAll(/^##\s+(.+?)\s*\{([^\n]+)\}/gm)) {
    const id=m[2].match(/#([^\s}]+)/)?.[1];if(!id)throw Error('Slide without explicit ID');
    sourceSlides.push({id,part,title:m[1],detail:m[2].includes('.arch-detail-source'),group:m[2].match(/data-detail-group="([^"]+)"/)?.[1]});
  }
}
const expectedMain=sourceSlides.filter(s=>!s.detail).map(s=>s.id), expectedDetails=sourceSlides.filter(s=>s.detail);
const css=['lecture01_part2_final_v3.css',...parts.map(p=>`lecture01_part2_final_v3_${p}.css`)];
const representatives=['arch-01','arch-14','arch-46','frontier-f14','frontier-f15-case-quality','frontier-f17-case-html','training-38','training-43','training-53','inference-01','inference-beam','inference-08','inference-16','inference-a01','inference-a09','frontier-f35','frontier-skills','frontier-rules-hooks','frontier-f40'];
const report={scope,sitePrefix:prefix,catalogs:[],inDeckLinks:[],resourceChecks:[],checkedAt:new Date().toISOString(),deck:'lecture01_final_v3.1.html',sourceSlides,expectedMain,assertions:[],views:[],states:[],pageErrors:[],localFailures:[],externalFailures:[],screenshots:[],navigation:[]};
const assert=(label,passed,actual)=>report.assertions.push({label,passed:!!passed,...(!passed?{actual}:{})});
const mime={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.woff2':'font/woff2','.woff':'font/woff','.ttf':'font/ttf'};
const server=http.createServer(async(req,res)=>{
  try{
    const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    if(pathname.endsWith('/favicon.ico'))return res.writeHead(204).end();
    if(!pathname.startsWith(prefix))return res.writeHead(404).end();
    const relative=pathname.slice(prefix.length)||'index.html';
    const file=path.resolve(site,relative);
    if(!file.startsWith(site+path.sep))return res.writeHead(403).end();
    const bytes=await fs.readFile(file);res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'}).end(bytes);
  }catch{res.writeHead(404).end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});

function inspect(){
  const isDetail=!!window.ArchDetails?.isOpen, deck=isDetail?ArchDetails.deck:Reveal, slide=deck.getCurrentSlide();
  const frame=slide.parentElement.getBoundingClientRect();
  const rect=r=>({left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height});
  const visible=e=>{
    if(!e||e.closest('aside.notes,script,style,defs,.katex-mathml,[hidden]'))return false;
    for(let p=e;p;p=p.parentElement){const c=getComputedStyle(p);if(c.display==='none'||c.visibility==='hidden'||Number(c.opacity)<.05)return false;}
    const r=e.getBoundingClientRect();return r.width>0&&r.height>0;
  };
  const texts=[], walker=document.createTreeWalker(slide,NodeFilter.SHOW_TEXT);
  while(walker.nextNode()){
    const n=walker.currentNode,e=n.parentElement;
    if(!n.textContent.trim()||!visible(e)||e.closest('svg,.katex'))continue;
    const range=document.createRange();range.selectNodeContents(n);
    for(const r of range.getClientRects())if(r.width&&r.height)texts.push({e,rect:rect(r),text:n.textContent.trim().slice(0,130)});
  }
  for(const e of slide.querySelectorAll('svg text,.katex'))if(visible(e)&&!e.parentElement.closest('.katex'))texts.push({e,rect:rect(e.getBoundingClientRect()),text:e.textContent.trim().slice(0,130)});
  const outside=texts.filter(({rect:r})=>r.left<Math.max(-3,frame.left-3)||r.right>Math.min(innerWidth+3,frame.right+3)||r.top<Math.max(-3,frame.top-3)||r.bottom>Math.min(innerHeight+3,frame.bottom+3)).map(({e,...t})=>t);
  const clipping=[];
  for(const t of texts)for(let p=t.e.parentElement;p&&p!==slide.parentElement;p=p.parentElement){
    if(p instanceof SVGElement)continue;
    const c=getComputedStyle(p),a=p.getBoundingClientRect(),r=t.rect;
    if((['hidden','clip','auto','scroll'].includes(c.overflowX)&&(r.left<a.left-3||r.right>a.right+3))||(['hidden','clip','auto','scroll'].includes(c.overflowY)&&(r.top<a.top-3||r.bottom>a.bottom+3))){clipping.push({text:t.text,rect:t.rect,ancestor:p.tagName+'.'+p.className,ancestorRect:rect(a)});break;}
  }
  const body=slide.querySelector('.fv-body'),take=slide.querySelector('.fv-takeaway'),source=slide.querySelector('.fv-source'),title=slide.querySelector('h2');
  const br=body?.getBoundingClientRect(),tr=take?.getBoundingClientRect(),sr=source?.getBoundingClientRect();
  const bodyFooterOverlap=body?texts.filter(t=>body.contains(t.e)&&(tr&&t.rect.bottom>tr.top+2||sr&&t.rect.bottom>sr.top+2)).map(({e,...t})=>t):[];
  const footerOverlap=take&&sr?texts.filter(t=>take.contains(t.e)&&t.rect.bottom>sr.top+2).map(({e,...t})=>t):[];
  return {id:slide.id,detail:isDetail,group:isDetail?ArchDetails.currentGroup:null,indices:deck.getIndices(),mainId:Reveal.getCurrentSlide().id,mainHash:location.hash,frame:rect(frame),title:title?.textContent.trim(),hasNotes:!!slide.querySelector('aside.notes'),outside,clipping,bodyFooterOverlap,footerOverlap,titleBodyOverlap:!!(title&&br&&title.getBoundingClientRect().bottom>br.top+2),badImages:[...slide.querySelectorAll('img')].filter(visible).filter(e=>!e.complete||!e.naturalWidth).map(e=>e.getAttribute('src')),mathErrors:[...slide.querySelectorAll('.katex-error,mjx-merror,merror,.MathJax_Error')].map(e=>e.textContent),unrenderedMath:[...slide.querySelectorAll('.math')].filter(visible).filter(e=>!e.querySelector('.katex,mjx-container')).map(e=>e.textContent),brokenAnchors:[...slide.querySelectorAll('a[href^="#"]')].filter(e=>e.hash&&!document.getElementById(decodeURIComponent(e.hash.replace(/^#\/?/,'')))).map(e=>e.getAttribute('href')),totalFragments:slide.querySelectorAll('.fragment').length,visibleFragments:slide.querySelectorAll('.fragment.visible').length};
}
const issueKeys=['outside','clipping','bodyFooterOverlap','footerOverlap','badImages','mathErrors','unrenderedMath','brokenAnchors'];
const hasIssues=s=>s.titleBodyOverlap||!s.hasNotes||issueKeys.some(k=>s[k].length);
async function record(page,viewport,label,screenshot=false){
  await page.waitForTimeout(260);
  const state={viewport,label,...await page.evaluate(inspect)};report.states.push(state);
  if(screenshot||hasIssues(state)){
    const file=`${viewport.width}-${label.replace(/[^a-zA-Z0-9_-]/g,'-')}.png`;
    await page.screenshot({path:path.join(out,file)});report.screenshots.push(file);
  }
  return state;
}
try{
  for(const viewport of [{width:1600,height:900},{width:1280,height:720}]){
    const context=await browser.newContext({viewport,deviceScaleFactor:1,reducedMotion:'reduce'}),page=await context.newPage();
    page.setDefaultTimeout(20000);
    page.on('request',r=>loadedRequests.push({viewport,stage,url:r.url(),type:r.resourceType()}));
    page.on('pageerror',e=>report.pageErrors.push({viewport,message:e.message}));
    page.on('response',r=>{if(r.status()>=400)(r.url().startsWith(origin)?report.localFailures:report.externalFailures).push({viewport,url:r.url(),status:r.status()});});
    page.on('requestfailed',r=>(r.url().startsWith(origin)?report.localFailures:report.externalFailures).push({viewport,url:r.url(),error:r.failure()?.errorText}));
    for(const entry of [{file:'index.html',name:'home'},{file:'raw/lectures.html',name:'lectures'}]){
      stage='catalog-'+entry.name;
      await page.goto(origin+prefix+entry.file,{waitUntil:'networkidle'});
      await page.evaluate(()=>document.fonts.ready);
      const link=page.locator('.course-lecture-table a[href*="lecture01_final_v3.1.html"]');
      assert(`${viewport.width}: ${entry.name} has exactly one lecture link`,await link.count()===1,await link.count());
      const record=await link.evaluate(e=>({text:e.textContent.trim(),href:e.href,row:e.closest('tr').textContent.replace(/\s+/g,' ').trim(),target:e.target}));
      report.catalogs.push({viewport,page:entry.file,...record});
      assert(`${viewport.width}: ${entry.name} target preserves Pages prefix`,record.href===origin+prefix+deckPath,record);
      await page.locator('.course-lecture-table-wrap').scrollIntoViewIfNeeded();
      await page.screenshot({path:path.join(out,`${viewport.width}-catalog-${entry.name}.png`)});
      report.screenshots.push(`${viewport.width}-catalog-${entry.name}.png`);
      stage='deck';
      await link.click();
      await page.waitForFunction(()=>window.Reveal?.isReady()&&!!window.ArchDetails);
      assert(`${viewport.width}: ${entry.name} link opens merged deck`,page.url().split('#')[0]===origin+prefix+deckPath,page.url());
    }
    stage='deck';
    await page.goto(origin+prefix+deckPath,{waitUntil:'networkidle'});
    await page.waitForFunction(()=>window.Reveal?.isReady()&&!!window.ArchDetails);
    await page.evaluate(()=>document.fonts.ready);
    const structure=await page.evaluate(()=>{
      const ids=[...document.querySelectorAll('[id]')].map(e=>e.id);
      return {mainIds:Reveal.getSlides().map(s=>s.id),notes:Reveal.getSlides().filter(s=>s.querySelector('aside.notes')).length,sourceDetailsInMain:Reveal.getSlides().filter(s=>s.classList.contains('arch-detail-source')).length,detailIds:[...document.querySelectorAll('section.arch-detail-source')].map(s=>s.id),duplicates:ids.filter((id,i)=>ids.indexOf(id)!==i),css:[...document.querySelectorAll('link[rel="stylesheet"]')].map(e=>e.getAttribute('href')),mathErrors:[...document.querySelectorAll('.katex-error,mjx-merror,merror,.MathJax_Error')].map(e=>e.textContent),groups:ArchDetails.groups,config:{width:Reveal.getConfig().width,height:Reveal.getConfig().height}};
    });
    report.views.push({viewport,...structure});
    assert(`${viewport.width}: source order`,JSON.stringify(structure.mainIds)===JSON.stringify(expectedMain),structure.mainIds);
    assert(`${viewport.width}: all main slides have notes`,structure.notes===expectedMain.length,structure.notes);
    assert(`${viewport.width}: seven detail slides outside main route`,structure.sourceDetailsInMain===0&&JSON.stringify(structure.detailIds)===JSON.stringify(expectedDetails.map(s=>s.id)),structure.detailIds);
    assert(`${viewport.width}: unique IDs`,structure.duplicates.length===0,structure.duplicates);
    assert(`${viewport.width}: all six deck stylesheets`,css.every(s=>structure.css.includes(s)),structure.css);
    assert(`${viewport.width}: no global math errors`,!structure.mathErrors.length,structure.mathErrors);
    const visit=viewport.width===1600&&scope==='full'?expectedMain:representatives.filter(id=>expectedMain.includes(id));
    for(const id of visit){
      const target=await page.evaluate(id=>{const s=document.getElementById(id);return {indices:Reveal.getIndices(s),steps:[...new Set([...s.querySelectorAll('.fragment')].map(e=>Number(e.dataset.fragmentIndex)))].sort((a,b)=>a-b)};},id);
      const steps=viewport.width===1600&&scope==='full'?[-1,...target.steps]:[target.steps.at(-1)??-1];
      for(const f of steps){
        await page.evaluate(({h,v,f})=>Reveal.slide(h,v||0,f),{...target.indices,f});
        await record(page,viewport,`${id}-${f<0?'initial':'f'+f}`,representatives.includes(id)&&(f===steps.at(-1)||id==='arch-01'));
      }
    }
    if(viewport.width===1600){
      for(let i=0;i<expectedMain.length-1;i++){
        await page.evaluate(id=>{const s=document.getElementById(id),p=Reveal.getIndices(s);Reveal.slide(p.h,p.v||0,999);},expectedMain[i]);
        await page.keyboard.press('ArrowRight');
        const actual=await page.evaluate(()=>Reveal.getCurrentSlide().id);
        report.navigation.push({from:expectedMain[i],expected:expectedMain[i+1],actual,passed:actual===expectedMain[i+1]});
      }
    }
    const overview=await page.evaluate(()=>document.querySelector('button[data-arch-detail]').closest('section').id);
    await page.evaluate(id=>{const p=Reveal.getIndices(document.getElementById(id));Reveal.slide(p.h,p.v||0,-1);},overview);
    const baseline=await page.evaluate(()=>({id:Reveal.getCurrentSlide().id,hash:location.hash,keyboard:Reveal.getConfig().keyboard,touch:Reveal.getConfig().touch}));
    for(const [i,group] of structure.groups.entries()){
      await page.locator(`#${overview} button[data-arch-detail="${group}"]`).click();
      await page.waitForFunction(g=>ArchDetails.isOpen&&ArchDetails.currentGroup===g&&ArchDetails.deck?.isReady(),group);
      const targets=await page.evaluate(()=>ArchDetails.deck.getSlides().map((s,h)=>({id:s.id,h,steps:[...new Set([...s.querySelectorAll('.fragment')].map(e=>Number(e.dataset.fragmentIndex)))].sort((a,b)=>a-b)})));
      assert(`${viewport.width}: ${group} detail IDs`,JSON.stringify(targets.map(s=>s.id))===JSON.stringify(expectedDetails.filter(s=>s.group===group).map(s=>s.id)),targets.map(s=>s.id));
      for(const target of targets){
        const steps=viewport.width===1600&&scope==='full'?[-1,...target.steps]:[target.steps.at(-1)??-1];
        for(const f of steps){
          await page.evaluate(({h,f})=>ArchDetails.deck.slide(h,0,f),{h:target.h,f});
          const state=await record(page,viewport,`${target.id}-${f<0?'initial':'f'+f}`,f===steps.at(-1));
          assert(`${viewport.width}: ${target.id}/${f} main route preserved`,state.mainId===baseline.id&&state.mainHash===baseline.hash,{baseline,mainId:state.mainId,mainHash:state.mainHash});
        }
      }
      if(i%2===0)await page.keyboard.press('Escape');else await page.locator('.arch-details-back').click();
      await page.waitForFunction(()=>!ArchDetails.isOpen);
      const closed=await page.evaluate(()=>({id:Reveal.getCurrentSlide().id,hash:location.hash,keyboard:Reveal.getConfig().keyboard,touch:Reveal.getConfig().touch,focus:document.activeElement?.dataset.archDetail}));
      assert(`${viewport.width}: ${group} close restores main and focus`,closed.id===baseline.id&&closed.hash===baseline.hash&&closed.keyboard===baseline.keyboard&&closed.touch===baseline.touch&&closed.focus===group,closed);
    }
    // Exercise changed cross-block links as actual user clicks.
    await page.evaluate(()=>{const p=Reveal.getIndices(document.getElementById('inference-16'));Reveal.slide(p.h,p.v||0,999);});
    await page.locator('#inference-16 a[href="#/frontier-f35"]').click();
    let destination=await page.evaluate(()=>({id:Reveal.getCurrentSlide().id,url:location.href}));
    report.inDeckLinks.push({viewport,link:'Inference → Tools',...destination});
    assert(`${viewport.width}: Next Tools stays in combined deck`,destination.id==='frontier-f35'&&destination.url.startsWith(origin+prefix+deckPath+'#'),destination);
    await page.evaluate(()=>{const p=Reveal.getIndices(document.getElementById('inference-16'));Reveal.slide(p.h,p.v||0,999);});
    await page.locator('#inference-16 a[href="#/inference-a01"]').click();
    destination=await page.evaluate(()=>({id:Reveal.getCurrentSlide().id,url:location.href}));
    report.inDeckLinks.push({viewport,link:'Inference → Appendix',...destination});
    assert(`${viewport.width}: appendix opens first slide`,destination.id==='inference-a01',destination);
    await page.locator('#inference-a01 .inference-appendix-return').click();
    destination=await page.evaluate(()=>({id:Reveal.getCurrentSlide().id,url:location.href}));
    report.inDeckLinks.push({viewport,link:'Appendix → Inference',...destination});
    assert(`${viewport.width}: appendix return opens Inference16`,destination.id==='inference-16',destination);
    const resourceState=await page.evaluate(()=>{
      const styles=[],failures=[];const seen=new Set();
      function walk(s){if(seen.has(s))return;seen.add(s);if(s.href)styles.push(s.href);try{for(const rule of s.cssRules)if(rule.styleSheet)walk(rule.styleSheet);}catch(e){failures.push({href:s.href,error:e.message});}}
      for(const s of document.styleSheets)walk(s);
      return {styles,failures,scripts:[...document.scripts].map(e=>e.src).filter(Boolean),externalDOMResources:[...document.querySelectorAll('script[src],link[rel="stylesheet"],img[src]')].map(e=>e.src||e.href).filter(u=>u&&!u.startsWith(location.origin)&&!u.startsWith('data:'))};
    });
    report.resourceChecks.push({viewport,...resourceState});
    assert(`${viewport.width}: custom details script loads from Pages prefix`,resourceState.scripts.includes(origin+prefix+'raw/lectures/01_intro/final_parts/arch_20261007/details.js'),resourceState.scripts);
    assert(`${viewport.width}: all CSS imports readable`,resourceState.failures.length===0,resourceState.failures);
    const expectedImports=['training_20261007/slides_38_42.css','training_20261007/slides_43_46.css','training_20261007/slides_47_50.css','training_20261007/slides_51_53.css','inference_narrative_20261007/main_01_03.css','inference_narrative_20261007/main_04_08.css','inference_narrative_20261007/main_09_13.css','inference_narrative_20261007/main_14_16.css','inference_narrative_20261007/main_search_methods.css','inference_evidence_20261007/search_serving.css','inference_evidence_20261007/paged_speculation.css','inference_evidence_20261007/replay_diffusion.css'];
    assert(`${viewport.width}: all 12 imported module styles present`,expectedImports.every(f=>resourceState.styles.includes(origin+prefix+'raw/lectures/01_intro/final_parts/'+f)),resourceState.styles);
    assert(`${viewport.width}: deck DOM resources all local`,resourceState.externalDOMResources.length===0,resourceState.externalDOMResources);
    await context.close();
  }
}catch(error){report.runtimeError=error.stack||error.message;}
finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
const badStates=report.states.filter(hasIssues);
const deckExternal=loadedRequests.filter(r=>r.stage==='deck'&&!r.url.startsWith(origin)&&!r.url.startsWith('data:'));
assert('All requested deck runtime resources are local',!deckExternal.length,deckExternal);
report.requests=loadedRequests;
const summary={scope,sitePrefix:prefix,catalogs:report.catalogs,inDeckLinks:report.inDeckLinks,resourceChecks:report.resourceChecks,requestedResources:loadedRequests.length,deckExternal,checkedAt:report.checkedAt,deck:report.deck,counts:{sources:sourceSlides.length,main:expectedMain.length,details:expectedDetails.length,parts:Object.fromEntries(parts.map(p=>[p,sourceSlides.filter(s=>s.part===p).length])),states:report.states.length,screenshots:report.screenshots.length,navigation:report.navigation.length},views:report.views,failedAssertions:report.assertions.filter(a=>!a.passed),badStates,failedNavigation:report.navigation.filter(n=>!n.passed),pageErrors:report.pageErrors,localFailures:report.localFailures,externalFailures:report.externalFailures,runtimeError:report.runtimeError};
summary.passed=!summary.failedAssertions.length&&!badStates.length&&!summary.failedNavigation.length&&!summary.pageErrors.length&&!summary.localFailures.length&&!summary.runtimeError;
await fs.writeFile(path.join(here,'site-report.json'),JSON.stringify(report,null,2)+'\n');
await fs.writeFile(path.join(here,'site-summary.json'),JSON.stringify(summary,null,2)+'\n');
console.log(JSON.stringify({...summary,views:summary.views.map(v=>({viewport:v.viewport,slides:v.mainIds.length,notes:v.notes,duplicates:v.duplicates})),badStates:badStates.map(s=>({id:s.id,viewport:s.viewport,label:s.label,...Object.fromEntries(issueKeys.map(k=>[k,s[k]])),titleBodyOverlap:s.titleBodyOverlap,hasNotes:s.hasNotes}))},null,2));
process.exitCode=summary.passed?0:1;
