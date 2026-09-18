#!/usr/bin/env node

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SITE_ROOT = path.join(ROOT, "_site");
const PORT = 8856;

// Discover chrome / chromium
function findChrome() {
  const candidates = [
    process.env.CHROME_BIN,
    "/Users/alexey/Library/Caches/ms-playwright/chromium_headless_shell-1200/chrome-headless-shell-mac-arm64/chrome-headless-shell",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "/usr/bin/chromium",
    "/usr/bin/google-chrome"
  ].filter(Boolean);

  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  throw new Error("No Chromium or Google Chrome executable found.");
}

const mimeTypes = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".mjs": "application/javascript",
  ".svg": "image/svg+xml",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf"
};

const server = http.createServer((req, res) => {
  let urlPath = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  if (urlPath === "" || urlPath === "/") urlPath = "/index.html";
  const filePath = path.join(SITE_ROOT, urlPath);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { "Content-Type": mimeTypes[ext] || "application/octet-stream" });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404);
    res.end("Not Found");
  }
});

server.listen(PORT, async () => {
  const chromePath = findChrome();
  const chromeProc = spawn(chromePath, chromePath.includes("chrome-headless-shell") ? ["--remote-debugging-port=9236"] : ["--remote-debugging-port=9236", "--headless"]);
  await new Promise(r => setTimeout(r, 1500));

  try {
    const newTab = await (await fetch("http://127.0.0.1:9236/json/new", { method: "PUT" })).json();
    const ws = new WebSocket(newTab.webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);

    let id = 1;
    function send(method, params = {}) {
      return new Promise(resolve => {
        const curId = id++;
        const handler = (e) => {
          const msg = JSON.parse(e.data);
          if (msg.id === curId) {
            ws.removeEventListener("message", handler);
            resolve(msg.result);
          }
        };
        ws.addEventListener("message", handler);
        ws.send(JSON.stringify({ id: curId, method, params }));
      });
    }

    await send("Page.enable");
    await send("Runtime.enable");

    // 16:9 Viewport (1680x944 matches reveal canvas + padding)
    await send("Emulation.setDeviceMetricsOverride", {
      width: 1680,
      height: 944,
      deviceScaleFactor: 1,
      mobile: false
    });

    console.log("Loading presentation in print-pdf mode...");
    await send("Page.navigate", { url: `http://localhost:${PORT}/raw/lectures/01_intro/course_structure.html?print-pdf` });
    await new Promise(r => setTimeout(r, 3000));

    // Scale each slide cleanly inside nominal 1600x900 canvas using a content wrapper
    console.log("Applying scale-to-fit to overflowing slides...");
    const scaleReport = await send("Runtime.evaluate", {
      expression: `(() => {
        const style = document.createElement("style");
        style.textContent = \`
          body {
            background: #ffffff !important;
          }
          .pdf-page {
            height: 944px !important;
            max-height: 944px !important;
            min-height: 944px !important;
            overflow: hidden !important;
          }
          .pdf-page:last-child {
            page-break-after: avoid !important;
            break-after: avoid !important;
          }
          .pdf-page section {
            width: 1600px !important;
            height: 900px !important;
            max-height: 900px !important;
            min-height: 900px !important;
            position: absolute !important;
            left: 40px !important;
            top: 22px !important;
            overflow: hidden !important;
          }
        \`;
        document.head.appendChild(style);

        const pages = document.querySelectorAll(".pdf-page");
        pages.forEach((page) => {
          const sec = page.querySelector("section");
          if (!sec) return;

          const wrapper = document.createElement("div");
          wrapper.className = "pdf-slide-scale-container";
          wrapper.style.width = "1600px";
          wrapper.style.boxSizing = "border-box";
          wrapper.style.transformOrigin = "top left";

          while (sec.firstChild) {
            wrapper.appendChild(sec.firstChild);
          }
          sec.appendChild(wrapper);

          const contentH = wrapper.scrollHeight;
          const contentW = wrapper.scrollWidth;
          const availH = 880;
          const availW = 1600;

          const scaleH = contentH > availH ? (availH / contentH) : 1.0;
          const scaleW = contentW > availW ? (availW / contentW) : 1.0;
          const scale = Math.min(1.0, scaleH, scaleW);

          if (scale < 0.999) {
            wrapper.style.transform = "scale(" + scale.toFixed(4) + ")";
          }
        });
        return pages.length;
      })()`,
      returnByValue: true
    });
    const totalPages = scaleReport.result.value;
    console.log(`Processed ${totalPages} slides.`);

    console.log("Printing to PDF (16:9 aspect ratio, exact 17.5x9.8333 in, 0 margins)...");
    const pdfData = await send("Page.printToPDF", {
      landscape: true,
      displayHeaderFooter: false,
      printBackground: true,
      paperWidth: 17.5,
      paperHeight: 9.8333,
      marginTop: 0,
      marginBottom: 0,
      marginLeft: 0,
      marginRight: 0,
      preferCSSPageSize: false,
      pageRanges: `1-${totalPages}`
    });

    const buf = Buffer.from(pdfData.data, "base64");
    const outIntro = path.join(ROOT, "raw", "lectures", "01_intro", "course_structure.pdf");
    const outSite = path.join(SITE_ROOT, "raw", "lectures", "01_intro", "course_structure.pdf");

    fs.writeFileSync(outIntro, buf);
    fs.writeFileSync(outSite, buf);

    console.log(`[PASS] Exported ${outIntro} (${(buf.length / 1024 / 1024).toFixed(2)} MB)`);
    ws.close();
  } catch (err) {
    console.error("PDF export failed:", err);
    process.exitCode = 1;
  } finally {
    chromeProc.kill();
    server.close();
  }
});
