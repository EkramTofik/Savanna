/**
 * Automated axe-core accessibility audit (NFR-G3).
 * Verifies zero critical and zero serious accessibility issues on:
 * - demo/blank.html (blank page proof)
 * - savanna/pages/concept-with-navigation.html (Savanna demo)
 * - demo/caption-editor/index.html (caption editor)
 */
import http from "node:http";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");

// Locate playwright and axe-core
async function loadModules() {
  const require = createRequire(path.join(root, "demo/sandbox-career/package.json"));
  const { chromium } = require("playwright");
  const axeModule = require("@axe-core/playwright");
  const AxeBuilder = axeModule.default ?? axeModule;
  return { chromium, AxeBuilder };
}

// Minimal static server for audit
function createServer() {
  const mimeTypes = {
    ".html": "text/html; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".vtt": "text/vtt; charset=utf-8",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
  };

  const server = http.createServer((req, res) => {
    let reqPath = decodeURI((req.url || "/").split("?")[0]);
    if (reqPath === "/") reqPath = "/index.html";
    const filePath = path.join(root, reqPath.replace(/^\//, ""));

    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      res.statusCode = 404;
      res.end("Not found");
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    res.setHeader("Content-Type", mimeTypes[ext] || "application/octet-stream");
    res.setHeader("Access-Control-Allow-Origin", "*");
    fs.createReadStream(filePath).pipe(res);
  });

  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const port = server.address().port;
      resolve({ server, port });
    });
  });
}

async function main() {
  console.log("🚀 Starting axe-core accessibility audit (NFR-G3)...");
  const { chromium, AxeBuilder } = await loadModules();
  const { server, port } = await createServer();
  const baseUrl = `http://127.0.0.1:${port}`;

  let browser;
  try {
    browser = await chromium.launch({ channel: "chrome", headless: true });
  } catch {
    browser = await chromium.launch({ headless: true });
  }

  const pagesToTest = [
    { name: "Blank Demo Proof", path: "/demo/blank.html" },
    { name: "Caption Editor", path: "/demo/caption-editor/index.html" },
    { name: "Savanna Integration Demo", path: "/savanna/pages/concept-with-navigation.html" },
  ];

  let hasFailures = false;

  for (const pageInfo of pagesToTest) {
    const context = await browser.newContext();
    const page = await context.newPage();
    const targetUrl = `${baseUrl}${pageInfo.path}`;

    try {
      await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 15000 });
      // Allow custom elements to render
      await page.waitForTimeout(1000);

      const results = await new AxeBuilder({ page }).analyze();
      const blocking = results.violations.filter(
        (v) => v.impact === "critical" || v.impact === "serious",
      );

      console.log(`\n📄 Auditing: ${pageInfo.name} (${pageInfo.path})`);
      console.log(`   Total rules checked: ${results.passes.length + results.violations.length}`);
      console.log(`   Violations total: ${results.violations.length}`);
      console.log(`   Critical / Serious issues: ${blocking.length}`);

      for (const violation of results.violations) {
        console.log(`   - [${violation.impact ?? "unknown"}] ${violation.id}: ${violation.help}`);
        for (const node of violation.nodes) console.log(`     Target: ${node.target.join(", ")}`);
      }

      if (blocking.length > 0) {
        hasFailures = true;
        console.error(
          `❌ Gate Failure: Found ${blocking.length} critical/serious issues on ${pageInfo.name}:`,
        );
        for (const v of blocking) {
          console.error(`   - [${v.impact.toUpperCase()}] ${v.id}: ${v.help}`);
          console.error(`     Help URL: ${v.helpUrl}`);
          for (const node of v.nodes) {
            console.error(`     Target: ${node.target.join(", ")}`);
            console.error(`     Summary: ${node.failureSummary}`);
          }
        }
      } else {
        console.log(`✅ Gate Pass: 0 critical and 0 serious issues on ${pageInfo.name}`);
      }

      if (pageInfo.path === "/savanna/pages/concept-with-navigation.html") {
        const languageButton = page.locator("[data-savanna-language-toggle]");
        await languageButton.waitFor({ state: "visible" });
        await page.waitForFunction(() => {
          const button = document.querySelector("[data-savanna-language-toggle]");
          return button instanceof HTMLButtonElement && !button.disabled;
        });
        const startingLanguage = await page.locator("#lesson-player").evaluate((player) => player.lang);
        await languageButton.click();
        await page.waitForFunction(
          (language) => document.querySelector("#lesson-player")?.lang !== language,
          startingLanguage,
        );
        const switchedLanguage = await page.locator("#lesson-player").evaluate((player) => player.lang);
        if (switchedLanguage === startingLanguage || (await page.locator("html").getAttribute("lang")) !== "en") {
          hasFailures = true;
          console.error("❌ Integrated player language toggle did not switch the player while preserving page language.");
        } else {
          console.log(`   Integrated language toggle: ${startingLanguage} → ${switchedLanguage}; host page remains English`);
        }

        for (const width of [320, 375, 768, 1280]) {
          await page.setViewportSize({ width, height: 800 });
          const layout = await page.evaluate(() => ({
            viewport: window.innerWidth,
            document: document.documentElement.scrollWidth,
            body: document.body.scrollWidth,
            offenders: [...document.querySelectorAll("body *")]
              .map((element) => ({
                tag: element.tagName,
                id: element.id,
                className: typeof element.className === "string" ? element.className : "",
                right: Math.round(element.getBoundingClientRect().right),
                width: Math.round(element.getBoundingClientRect().width),
                style: element.getAttribute("style"),
                parents: (() => {
                  const chain = [];
                  let current = element.parentElement;
                  while (current && chain.length < 4) {
                    const rect = current.getBoundingClientRect();
                    chain.push({
                      tag: current.tagName,
                      id: current.id,
                      className: typeof current.className === "string" ? current.className : "",
                      left: Math.round(rect.left),
                      right: Math.round(rect.right),
                      width: Math.round(rect.width),
                      scroll: current.scrollWidth,
                      client: current.clientWidth,
                    });
                    current = current.parentElement;
                  }
                  return chain;
                })(),
              }))
              .filter((element) => element.right > window.innerWidth + 1)
              .slice(0, 5),
          }));
          console.log(
            `   Responsive layout at ${layout.viewport}px: document ${layout.document}px, body ${layout.body}px`,
          );
          if (layout.document > layout.viewport || layout.body > layout.viewport) {
            hasFailures = true;
            console.error(`❌ Layout overflow on ${pageInfo.name}: ${JSON.stringify(layout)}`);
          }
        }
      }
    } catch (err) {
      console.error(`❌ Error auditing ${pageInfo.name}:`, err.message);
      hasFailures = true;
    } finally {
      await context.close();
    }
  }

  await browser.close();
  server.close();

  if (hasFailures) {
    console.error("\n❌ axe audit failed: critical or serious accessibility issues detected.");
    process.exit(1);
  } else {
    console.log(
      "\n🎉 axe audit passed: All tested pages have ZERO critical and ZERO serious issues!",
    );
    process.exit(0);
  }
}

main().catch((err) => {
  console.error("Fatal audit error:", err);
  process.exit(1);
});
