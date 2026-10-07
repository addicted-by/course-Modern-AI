// Read-only speaker notes integration QA against the built site and Pages prefix.
import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const out = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(out, '../../../../../..');
const site = path.join(repo, '_site');
const prefix = '/course-Modern-AI/';
const require = createRequire('/Users/alexey/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/package.json');
const { chromium } = require('playwright');
const mime = { '.html':'text/html; charset=utf-8', '.css':'text/css', '.js':'text/javascript', '.json':'application/json', '.svg':'image/svg+xml', '.png':'image/png', '.jpg':'image/jpeg', '.woff2':'font/woff2', '.woff':'font/woff', '.ttf':'font/ttf' };
const report = { checkedAt:new Date().toISOString(), builtSite:site, prefix, runtime:process.version, assertions:[], pageErrors:[], consoleErrors:[], failedRequests:[], badResponses:[], fontResponses:[], notes:[] };
const assert = (label, passed, detail) => report.assertions.push({label, passed:!!passed, ...(detail === undefined ? {} : {detail})});
const server = http.createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (!pathname.startsWith(prefix)) return res.writeHead(404).end();
    const file = path.resolve(site, pathname.slice(prefix.length));
    if (!file.startsWith(site + path.sep)) return res.writeHead(403).end();
    res.writeHead(200, {'Content-Type':mime[path.extname(file)] || 'application/octet-stream'}).end(await fs.readFile(file));
  } catch { res.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
const url = origin + prefix + 'raw/lectures/01_intro/lecture01_final_v3.1.html';
const browser = await chromium.launch({headless:true, executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
try {
  report.browser = browser.version();
  report.url = url;
  assert('unprefixed site path is rejected', (await fetch(origin + '/raw/lectures/01_intro/lecture01_final_v3.1.html')).status === 404);
  const context = await browser.newContext({viewport:{width:1600, height:900}});
  context.on('page', page => {
    page.on('pageerror', error => report.pageErrors.push({url:page.url(), error:error.message}));
    page.on('console', message => { if(message.type() === 'error') report.consoleErrors.push({url:page.url(), message:message.text()}); });
  });
  context.on('requestfailed', request => report.failedRequests.push({url:request.url(), error:request.failure()?.errorText}));
  context.on('response', response => {
    if(response.status() >= 400) report.badResponses.push({url:response.url(), status:response.status()});
    if(response.request().resourceType() === 'font') report.fontResponses.push({url:response.url(), status:response.status()});
  });
  const page = await context.newPage();
  await page.goto(url, {waitUntil:'networkidle'});
  await page.waitForFunction(() => window.Reveal?.isReady());
  await page.evaluate(() => document.fonts.ready);
  const allSlides = await page.evaluate(() => Reveal.getSlides().map(slide => ({id:slide.id, indices:Reveal.getIndices(slide), title:slide.querySelector('h2')?.textContent, noteText:slide.querySelector('aside.notes')?.textContent.trim(), math:[...slide.querySelectorAll('aside.notes .math')].map(el => ({tex:el.querySelector('annotation')?.textContent, rendered:!!el.querySelector('.katex')}))})));
  let slides = allSlides.filter(slide => slide.math.length);
  report.nativeNotes = {mainNotesSlides:allSlides.filter(slide => slide.noteText).length, mathNotesSlides:slides.length, mathCount:slides.reduce((n, slide) => n + slide.math.length, 0), allDOMNotes:await page.locator('aside.notes').count()};
  report.notesSourceSlides = slides;
  const selected = slides.find(slide => slide.math.length >= 3) || slides[0] || allSlides.find(slide => slide.noteText);
  report.selected = selected;
  await page.evaluate(indices => Reveal.slide(indices.h, indices.v), selected.indices);
  const popupPromise = page.waitForEvent('popup');
  await page.keyboard.press('s');
  const speaker = await popupPromise;
  await speaker.setViewportSize({width:1400, height:900});
  await speaker.waitForFunction(() => document.querySelector('.speaker-controls-notes .value p'));
  await speaker.waitForFunction(() => document.querySelectorAll('style[data-frontier-source]').length === 2);
  await speaker.evaluate(() => document.fonts.ready);
  const nativeText = await speaker.locator('.speaker-controls-notes .value').innerText();
  assert('speaker popup displays the selected original notes', nativeText.replace(/\s+/g, ' ').trim() === selected.noteText.replace(/\s+/g, ' ').trim());
  const nativeCdp = await context.newCDPSession(speaker);
  const nativeCapture = await nativeCdp.send('Page.captureScreenshot', {format:'png'});
  await fs.writeFile(path.join(out, 'speaker-notes-native.png'), Buffer.from(nativeCapture.data, 'base64'));
  if (!slides.length) {
    report.limitation = 'The combined deck has no native math expressions in speaker notes. Math integration is tested by temporarily copying one existing rendered deck formula into a note in browser memory. No source or built file is modified.';
    report.fixture = await page.evaluate(id => {
      const formula = document.querySelector('section .math.display:has(.katex)') || document.querySelector('section .math:has(.katex)');
      const clone = formula.cloneNode(true);
      const sourceSlide = formula.closest('section')?.id;
      const note = document.getElementById(id).querySelector('aside.notes');
      const label = document.createElement('p');
      label.textContent = 'Speaker KaTeX QA fixture — existing deck formula copied at runtime';
      note.prepend(clone);
      note.prepend(label);
      return {sourceSlide, noteSlide:id, tex:clone.querySelector('annotation')?.textContent, rendered:!!clone.querySelector('.katex')};
    }, selected.id);
    slides = [{...selected, math:[{tex:report.fixture.tex, rendered:report.fixture.rendered}]}];
    await page.evaluate(indices => Reveal.slide(indices.h + 1, 0), selected.indices);
    await page.evaluate(indices => Reveal.slide(indices.h, indices.v), selected.indices);
  }
  await speaker.waitForFunction(() => document.querySelector('.speaker-controls-notes .value .katex'));
  report.popup = await speaker.evaluate(async () => {
    await document.fonts.ready;
    const math = document.querySelector('.speaker-controls-notes .value .katex');
    return {title:document.title, readyState:document.readyState, fontStatus:document.fonts.status, bodyFont:getComputedStyle(document.body).fontFamily, katexFont:getComputedStyle(math).fontFamily, mathMLPosition:getComputedStyle(math.querySelector('.katex-mathml')).position, styles:[...document.querySelectorAll('style[data-frontier-source]')].map(style => ({id:style.id, source:style.dataset.frontierSource})), fonts:[...document.fonts].map(font => ({family:font.family, status:font.status})), fontURLs:[...document.styleSheets].flatMap(sheet => [...sheet.cssRules]).filter(rule => rule.type === CSSRule.FONT_FACE_RULE).map(rule => rule.style.getPropertyValue('src'))};
  });
  assert('speaker closes document stream and completes font loading', report.popup.readyState === 'complete' && report.popup.fontStatus === 'loaded');
  assert('speaker uses local Frontier Inter and KaTeX style', report.popup.bodyFont.includes('Frontier Inter') && report.popup.katexFont.includes('KaTeX_Main') && report.popup.mathMLPosition === 'absolute');
  assert('speaker style sources include deployment prefix', report.popup.styles.length === 2 && report.popup.styles.every(style => style.source.startsWith(origin + prefix)));
  assert('speaker font URLs include deployment prefix', report.popup.fontURLs.length > 0 && report.popup.fontURLs.every(urls => urls.includes(origin + prefix)));
  await speaker.evaluate(() => document.querySelector('.speaker-controls-notes .value .math').scrollIntoView({block:'center'}));
  const cdp = await context.newCDPSession(speaker);
  const capture = await cdp.send('Page.captureScreenshot', {format:'png'});
  await fs.writeFile(path.join(out, 'speaker-notes.png'), Buffer.from(capture.data, 'base64'));
  report.screenshot = 'speaker-notes.png';
  await cdp.send('DOM.enable');
  await cdp.send('CSS.enable');
  const dom = await cdp.send('DOM.getDocument');
  report.fontProof = [];
  for (const selector of ['.speaker-controls-notes .value p', '.speaker-controls-notes .katex .mord.mathnormal', '.speaker-controls-notes .katex .mrel']) {
    const {nodeId} = await cdp.send('DOM.querySelector', {nodeId:dom.root.nodeId, selector});
    if(nodeId) report.fontProof.push({selector, ...await cdp.send('CSS.getPlatformFontsForNode', {nodeId})});
  }
  assert('rendered speaker text uses downloaded local Inter font', report.fontProof.some(proof => proof.fonts.some(font => /Inter/.test(font.familyName) && font.isCustomFont && font.glyphCount > 0)));
  assert('rendered speaker formula uses downloaded local KaTeX font', report.fontProof.some(proof => proof.fonts.some(font => /KaTeX/.test(font.familyName) && font.isCustomFont && font.glyphCount > 0)));
  for (const slide of slides) {
    await page.evaluate(indices => Reveal.slide(indices.h, indices.v), slide.indices);
    const expected = slide.math.map(math => math.tex);
    await speaker.waitForFunction(expected => JSON.stringify([...document.querySelectorAll('.speaker-controls-notes .value .math annotation')].map(el => el.textContent)) === JSON.stringify(expected), expected);
    await speaker.evaluate(() => document.fonts.ready);
    report.notes.push({slide:slide.id, ...await speaker.evaluate(() => ({mathCount:document.querySelectorAll('.speaker-controls-notes .value .katex').length, mathErrors:[...document.querySelectorAll('.speaker-controls-notes .value .katex-error, .speaker-controls-notes .value merror')].map(el => el.textContent), unrenderedMath:[...document.querySelectorAll('.speaker-controls-notes .value .math')].filter(el => !el.querySelector('.katex')).map(el => el.textContent), fontStatus:document.fonts.status}))});
  }
  assert(report.fixture ? 'runtime fixture formula propagates to speaker popup' : 'all main-deck notes formulas propagate to speaker popup', report.notes.length === slides.length && report.notes.every(notes => notes.mathCount > 0 && notes.mathErrors.length === 0 && notes.unrenderedMath.length === 0));
  await speaker.close();
  const reopenPromise = page.waitForEvent('popup');
  await page.keyboard.press('s');
  const reopened = await reopenPromise;
  await reopened.waitForFunction(() => document.querySelectorAll('style[data-frontier-source]').length === 2 && document.querySelector('.speaker-controls-notes .value .katex'));
  report.reopened = await reopened.evaluate(() => ({styles:[...document.querySelectorAll('style[data-frontier-source]')].map(style => style.dataset.frontierSource), mathCount:document.querySelectorAll('.speaker-controls-notes .value .katex').length}));
  assert('speaker styles and formulas survive closing and reopening', report.reopened.styles.length === 2 && report.reopened.mathCount > 0);
  await reopened.close();
  await page.waitForTimeout(300);
  assert('no browser JavaScript errors', report.pageErrors.length === 0, report.pageErrors);
  assert('no failed local resource requests', !report.failedRequests.some(request => request.url.startsWith(origin)) && !report.badResponses.some(response => response.url.startsWith(origin)), {failed:report.failedRequests.filter(request => request.url.startsWith(origin)), badResponses:report.badResponses.filter(response => response.url.startsWith(origin))});
  assert('all fetched fonts use deployment prefix and return HTTP 200', report.fontResponses.length > 0 && report.fontResponses.every(response => response.url.startsWith(origin + prefix) && response.status === 200));
  report.summary = {passed:report.assertions.every(assertion => assertion.passed), assertions:report.assertions.length, nativeNotes:report.nativeNotes, mathFixtureUsed:!!report.fixture, testedMath:report.notes.reduce((count, notes) => count + notes.mathCount, 0), localResourceErrors:report.failedRequests.filter(request => request.url.startsWith(origin)).length + report.badResponses.filter(response => response.url.startsWith(origin)).length, pageErrors:report.pageErrors.length, consoleErrors:report.consoleErrors.length, fontResponses:report.fontResponses.length};
} catch (error) {
  report.error = error.stack;
  report.summary = {passed:false};
  process.exitCode = 1;
} finally {
  await fs.writeFile(path.join(out, 'report.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({summary:report.summary, failedAssertions:report.assertions.filter(assertion => !assertion.passed), error:report.error}, null, 2));
  await browser.close();
  server.close();
}
