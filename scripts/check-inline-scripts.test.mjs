/**
 * Static analysis test: Check for inline scripts and event handlers in HTML files.
 * 
 * Scans built HTML files and fails if any contain:
 * - Inline <script> tags (without src attribute)
 * - Inline event handlers (onclick=, onload=, etc.)
 * - javascript: URLs
 * 
 * Exceptions can be documented with specific nonce or hash justification.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = join(fileURLToPath(import.meta.url), "../..");

const ALLOWED_INLINE_SCRIPTS = new Map([
  // Frozen Holberton/Savanna starter templates with inline hover effects
  // These are not linked from the portal and are reference templates only
  ["/savanna/pages/homepage-v1-paced.html", "Frozen template - inline hover effects for link underlines"],
  ["/savanna/pages/homepage-v1-self-paced.html", "Frozen template - inline hover effects for link underlines"],
  
  // Development sandboxes (not deployed to production)
  ["/demo/blank.html", "Development sandbox - event logging demonstration"],
  ["/demo/caption-editor/index.html", "Caption editor tool - standalone application with VTT samples"],
  ["/demo/sandbox-career/index.html", "Development harness - Vite dev server"],
  ["/demo/sandbox-career/partner-demo.html", "Development harness - dynamic import for hot reload"],
  ["/demo/sandbox-media/index.html", "Development sandbox - import map and component tests"],
  ["/demo/sandbox-media/media/index.html", "Development sandbox - manual component testing"],
  ["/demo/sandbox-media/media/simple-test.html", "Development sandbox - drag/drop and manual controls"],
  ["/demo/sandbox-media/standalone.html", "Development sandbox - CDN-loaded Lit components"],
  ["/demo/sandbox-media/test-member2.html", "Development sandbox - accessibility manual tests"],
  ["/pipeline/editor/index.html", "Caption editor - standalone tool (not in main CSP scope)"],
]);

async function* findHtmlFiles(dir, baseDir = dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    const relativePath = fullPath.substring(baseDir.length).replace(/\\/g, "/");
    
    if (entry.isDirectory() && !entry.name.match(/node_modules|\.git|dist/)) {
      yield* findHtmlFiles(fullPath, baseDir);
    } else if (entry.isFile() && entry.name.endsWith(".html")) {
      yield { path: fullPath, relativePath };
    }
  }
}

function findInlineScripts(html) {
  const violations = [];
  
  // Find <script> tags without src attribute
  const scriptPattern = /<script(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = scriptPattern.exec(html)) !== null) {
    const content = match[1].trim();
    if (content) {
      // Check if it's a JSON data block (type="application/json" or similar)
      const tagStart = match[0].substring(0, match[0].indexOf(">"));
      if (!tagStart.includes('type="application/json"') && !tagStart.includes("type='application/json'")) {
        violations.push({
          type: "inline-script",
          content: content.substring(0, 100) + (content.length > 100 ? "..." : ""),
          location: html.substring(Math.max(0, match.index - 50), match.index + 100),
        });
      }
    }
  }
  
  // Find inline event handlers
  const eventPattern = /\s(on\w+)\s*=\s*["']([^"']+)["']/gi;
  while ((match = eventPattern.exec(html)) !== null) {
    violations.push({
      type: "inline-handler",
      handler: match[1],
      content: match[2].substring(0, 100),
      location: html.substring(Math.max(0, match.index - 50), match.index + 100),
    });
  }
  
  // Find javascript: URLs
  const jsUrlPattern = /href\s*=\s*["']javascript:([^"']+)["']/gi;
  while ((match = jsUrlPattern.exec(html)) !== null) {
    violations.push({
      type: "javascript-url",
      content: match[1].substring(0, 100),
      location: html.substring(Math.max(0, match.index - 50), match.index + 100),
    });
  }
  
  return violations;
}

test("HTML files have no inline scripts or event handlers", async () => {
  const violations = [];
  
  for await (const { path, relativePath } of findHtmlFiles(projectRoot)) {
    const html = await readFile(path, "utf8");
    const fileViolations = findInlineScripts(html);
    
    if (fileViolations.length > 0) {
      const allowed = ALLOWED_INLINE_SCRIPTS.get(relativePath);
      if (!allowed) {
        violations.push({
          file: relativePath,
          violations: fileViolations,
        });
      }
    }
  }
  
  if (violations.length > 0) {
    const report = violations.map(({ file, violations: v }) => {
      return `\n${file}:\n` + v.map((viol) => {
        return `  - ${viol.type}: ${viol.content}\n    ${viol.location}`;
      }).join("\n");
    }).join("\n");
    
    assert.fail(`Found ${violations.length} HTML file(s) with inline scripts or handlers:${report}\n\nAll scripts must be in external files to comply with CSP.`);
  }
  
  // Test passes if no violations
  assert.ok(true, "All HTML files are CSP-compliant");
});

test("API CSP configuration does not use unsafe-inline or unsafe-eval in script-src", async () => {
  const appFile = await readFile(join(projectRoot, "api/src/app.ts"), "utf8");
  
  // Check that scriptSrc doesn't contain unsafe-inline or unsafe-eval
  const scriptSrcMatch = appFile.match(/scriptSrc:\s*\[([^\]]+)\]/);
  
  if (scriptSrcMatch) {
    const scriptSrcValue = scriptSrcMatch[1];
    assert.ok(!scriptSrcValue.includes("'unsafe-inline'"), "scriptSrc should not contain 'unsafe-inline'");
    assert.ok(!scriptSrcValue.includes("'unsafe-eval'"), "scriptSrc should not contain 'unsafe-eval'");
  }
  
  // The /docs route may have a relaxed policy - that's intentional
  // We're checking the main CSP configuration
});
