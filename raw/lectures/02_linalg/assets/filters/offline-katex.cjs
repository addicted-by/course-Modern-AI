#!/usr/bin/env node
'use strict';

// Called once per document by offline-katex.lua. The only protocol output is
// JSON on stdout; diagnostics belong on stderr so Pandoc can report failures.
const fs = require('node:fs');
const path = require('node:path');

function decodeEntities(text) {
    const named = {
        amp: '&', AMP: '&', lt: '<', LT: '<', gt: '>', GT: '>',
        quot: '"', QUOT: '"', apos: "'", nbsp: '\u00a0',
        ensp: '\u2002', emsp: '\u2003', thinsp: '\u2009',
        ndash: '\u2013', mdash: '\u2014', minus: '\u2212',
        times: '\u00d7', divide: '\u00f7', le: '\u2264', ge: '\u2265',
        Tab: '\t', NewLine: '\n',
    };
    return text.replace(/&(?:#(x[\da-f]+|\d+);?|([a-z][\da-z]+);)/gi,
        (match, numeric, name) => {
            if (!numeric) return Object.hasOwn(named, name) ? named[name] : match;
            const code = /^x/i.test(numeric) ? parseInt(numeric.slice(1), 16) : parseInt(numeric, 10);
            return code === 0 || code > 0x10ffff || (code >= 0xd800 && code <= 0xdfff)
                ? '\ufffd' : String.fromCodePoint(code);
        });
}

function mathClasses(openingTag) {
    // Consume complete attribute values: a quoted data attribute can itself
    // contain the word "class", so a substring search is not sufficient.
    const attributes = /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
    const source = openingTag.replace(/^<span\b/i, '').replace(/\/?\s*>$/, '');
    for (const match of source.matchAll(attributes)) {
        if (match[1].toLowerCase() === 'class') {
            return decodeEntities(match[2] ?? match[3] ?? match[4] ?? '').split(/\s+/);
        }
    }
    return [];
}

function renderRawMath(source, render, fragmentIndex) {
    // This scanner only replaces a plaintext span.math's contents. It never
    // serializes the surrounding HTML, so diagrams, attributes and whitespace
    // remain byte-for-byte intact. Ignore examples and inert/script contexts.
    const tokens = /<!--[\s\S]*?(?:-->|$)|<!\[CDATA\[[\s\S]*?(?:\]\]>|$)|<\/?([a-z][\da-z:-]*)(?=[\s/>])(?:[^"'<>]|"[^"]*"|'[^']*')*>|<![^>]*>/gi;
    const protectedTags = new Set(['script', 'style', 'code', 'pre', 'template',
        'textarea', 'title', 'xmp', 'iframe', 'noembed', 'noframes', 'noscript']);
    const rawTextTags = new Set(['script', 'style', 'textarea', 'title', 'xmp',
        'iframe', 'noembed', 'noframes', 'noscript']);
    const protectedStack = [];
    const pieces = [];
    let copiedUntil = 0;
    let count = 0;
    let token;
    while ((token = tokens.exec(source))) {
        if (!token[1]) continue; // Comments, declarations and CDATA.
        const tag = token[1].toLowerCase();
        const closing = /^<\//.test(token[0]);
        const active = protectedStack.at(-1);
        if (active && rawTextTags.has(active)) {
            if (closing && tag === active) protectedStack.pop();
            continue;
        }
        if (closing) {
            if (tag === active) protectedStack.pop();
            continue;
        }
        if (protectedTags.has(tag)) {
            protectedStack.push(tag);
            continue;
        }
        if (active || tag !== 'span') continue;
        const classes = mathClasses(token[0]);
        if (!classes.includes('math')) continue;
        const contentStart = tokens.lastIndex;
        const plaintext = /^([^<]*)<\/span\s*>/i.exec(source.slice(contentStart));
        if (!plaintext) continue; // Includes previously rendered KaTeX markup.
        count += 1;
        const tex = decodeEntities(plaintext[1]);
        pieces.push(source.slice(copiedUntil, contentStart), render({
            tex, displayMode: classes.includes('display'),
        }, `raw HTML fragment ${fragmentIndex}, formula ${count}`));
        copiedUntil = contentStart + plaintext[1].length;
        tokens.lastIndex = contentStart + plaintext[0].length;
    }
    pieces.push(source.slice(copiedUntil));
    return pieces.join('');
}

function embeddedCss(assetDir) {
    const css = fs.readFileSync(path.join(assetDir, 'katex.min.css'), 'utf8');
    const mimeTypes = {
        '.woff2': 'font/woff2',
        '.woff': 'font/woff',
        '.ttf': 'font/ttf',
        '.otf': 'font/otf',
    };

    return css.replace(/url\(\s*(?:"([^"]*)"|'([^']*)'|([^\s)]+))\s*\)/g,
        (match, doubleQuoted, singleQuoted, unquoted) => {
            const url = doubleQuoted ?? singleQuoted ?? unquoted;
            if (url.startsWith('data:')) return match;
            if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(url)) {
                throw new Error(`KaTeX CSS contains a non-local asset URL: ${url}`);
            }
            const fontPath = path.resolve(assetDir, decodeURIComponent(url.split(/[?#]/, 1)[0]));
            const mimeType = mimeTypes[path.extname(fontPath).toLowerCase()];
            if (!mimeType) throw new Error(`Unsupported KaTeX font asset: ${url}`);
            const encoded = fs.readFileSync(fontPath).toString('base64');
            return `url("data:${mimeType};base64,${encoded}")`;
        });
}

function renderDocument(request) {
    if (!request || typeof request.assetDir !== 'string' || !request.assetDir.trim()) {
        throw new Error('Expected a nonempty assetDir in the JSON request');
    }
    if (!Array.isArray(request.math)) throw new Error('Expected a math array in the JSON request');
    const rawHtml = request.rawHtml ?? [];
    if (!Array.isArray(rawHtml) || rawHtml.some(value => typeof value !== 'string')) {
        throw new Error('Expected rawHtml to be an array of HTML strings');
    }

    // Quarto runs each lecture from its own module directory. No npm install or
    // network request is needed: use the version vendored beside that lecture.
    const assetDir = path.resolve(request.assetDir);
    const runtimePath = path.join(assetDir, 'katex.min.js');
    const katex = require(runtimePath);
    const macros = {};
    const render = (formula, label) => {
        if (!formula || typeof formula.tex !== 'string' || typeof formula.displayMode !== 'boolean') {
            throw new Error(`Invalid formula record: ${label}`);
        }
        try {
            return katex.renderToString(formula.tex, {
                displayMode: formula.displayMode,
                output: 'htmlAndMathml',
                throwOnError: true,
                macros,
            });
        } catch (error) {
            const excerpt = formula.tex.replace(/\s+/g, ' ').slice(0, 180);
            throw new Error(`Formula ${label} failed (${excerpt}): ${error.message}`);
        }
    };
    const html = request.math.map((formula, index) => render(formula, index + 1));
    const renderedRaw = rawHtml.map((source, index) => renderRawMath(source, render, index + 1));

    // Static math no longer needs JavaScript. Keep the same local KaTeX runtime
    // inline for interactive overlays that render additional formulas on demand.
    const css = embeddedCss(assetDir).replace(/<\/style/gi, '<\\/style');
    const runtime = fs.readFileSync(runtimePath, 'utf8').replace(/<\/script/gi, '<\\/script');
    const license = fs.readFileSync(path.join(assetDir, '..', 'LICENSE'), 'utf8')
        .trim().replace(/--/g, '- -');
    const head = `<!-- KaTeX license (applies to the embedded runtime, CSS and fonts):\n${license}\n-->\n` +
        `<style id="offline-katex-css">\n${css}\n</style>\n` +
        `<script id="offline-katex-runtime">\n${runtime}\n</script>`;
    return { html, renderedRaw, head };
}

try {
    const request = JSON.parse(fs.readFileSync(0, 'utf8'));
    process.stdout.write(JSON.stringify(renderDocument(request)));
} catch (error) {
    process.stderr.write(`offline-katex: ${error.message}\n`);
    process.exitCode = 1;
}
