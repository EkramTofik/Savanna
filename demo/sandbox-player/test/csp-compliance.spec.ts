/**
 * CSP Compliance Tests
 * 
 * Verifies that the sandbox player and components work correctly with CSP.
 * 
 * Note: Full site CSP compliance (including /savanna/pages/* and /docs) is validated
 * by static analysis in scripts/check-inline-scripts.test.mjs since those pages
 * are served by the API server, not included in this Vite build.
 */

import { test, expect } from "@playwright/test";

test.describe("Content Security Policy Compliance", () => {
  test("Sandbox player has no CSP violations", async ({ page: browser }) => {
    const cspViolations: string[] = [];
    const consoleErrors: string[] = [];

    // Listen for CSP violations
    browser.on("console", (msg) => {
      if (msg.type() === "error" || msg.type() === "warning") {
        const text = msg.text();
        if (text.includes("Content Security Policy") || text.includes("CSP")) {
          cspViolations.push(text);
        }
        if (msg.type() === "error") {
          consoleErrors.push(text);
        }
      }
    });

    // Also listen for securitypolicyviolation events
    await browser.evaluateOnNewDocument(() => {
      document.addEventListener("securitypolicyviolation", (e) => {
        console.error(`CSP Violation: ${e.violatedDirective} blocked ${e.blockedURI}`);
      });
    });

    await browser.goto("/", { waitUntil: "networkidle" });

    // Wait a bit to let any async scripts load
    await browser.waitForTimeout(2000);

    // Check for violations
    expect(cspViolations, `CSP violations detected:\n${cspViolations.join("\n")}`).toHaveLength(0);
    
    // Log any console errors for debugging (but don't fail the test just for console errors)
    if (consoleErrors.length > 0) {
      console.log(`Console errors:`, consoleErrors);
    }
  });
});
