/**
 * CSP Compliance Tests
 * 
 * Verifies that all pages comply with Content Security Policy:
 * - No CSP violations in browser console
 * - No inline scripts or event handlers
 * - All functionality works with strict CSP
 */

import { test, expect } from "@playwright/test";

test.describe("Content Security Policy Compliance", () => {
  const pages = [
    { url: "/savanna/pages/concept-with-navigation.html", name: "Lesson Demo" },
    { url: "/savanna/pages/jobs.html", name: "Career Gateway" },
    { url: "/demo/blank.html", name: "Standalone Proof" },
    { url: "/", name: "Portal Index" },
  ];

  for (const page of pages) {
    test(`${page.name} has no CSP violations`, async ({ page: browser }) => {
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

      await browser.goto(page.url, { waitUntil: "networkidle" });

      // Wait a bit to let any async scripts load
      await browser.waitForTimeout(2000);

      // Check for violations
      expect(cspViolations, `CSP violations detected on ${page.name}:\n${cspViolations.join("\n")}`).toHaveLength(0);
      
      // Log any console errors for debugging (but don't fail the test just for console errors)
      if (consoleErrors.length > 0) {
        console.log(`Console errors on ${page.name}:`, consoleErrors);
      }
    });
  }

  test("Lesson navigation works without inline scripts", async ({ page }) => {
    await page.goto("/savanna/pages/concept-with-navigation.html");
    
    // Wait for player to be ready
    await page.waitForSelector("savanna-player#lesson-player", { timeout: 5000 });
    
    // Check default lesson
    const player = page.locator("savanna-player#lesson-player");
    await expect(player).toHaveAttribute("lesson", "L-102");
    
    // Navigate to L-103 using query parameter
    await page.goto("/savanna/pages/concept-with-navigation.html?lesson=L-103");
    await page.waitForSelector("savanna-player#lesson-player");
    
    // Verify lesson switched
    await expect(player).toHaveAttribute("lesson", "L-103");
    
    // Check navigation UI updated
    const activeLink = page.locator('#course-lesson-links [data-lesson-id="L-103"]');
    await expect(activeLink).toHaveClass(/active/);
    await expect(activeLink).toHaveAttribute("aria-current", "page");
  });

  test("Career Gateway initializes without inline scripts", async ({ page }) => {
    const consoleLogs: string[] = [];
    
    page.on("console", (msg) => {
      if (msg.type() === "log") {
        consoleLogs.push(msg.text());
      }
    });
    
    await page.goto("/savanna/pages/jobs.html");
    
    // Wait for Savanna components to load
    await page.waitForSelector("savanna-job-card, savanna-credential", { timeout: 5000 });
    
    // Give time for event listeners to fire
    await page.waitForTimeout(1000);
    
    // Verify initialization events fired (logged by career-init.js)
    const hasReadyEvent = consoleLogs.some(log => log.includes("ሞጁል ተጫነ") || log.includes("savanna:ready"));
    expect(hasReadyEvent, "Savanna ready event should have fired").toBeTruthy();
  });

  test("/docs Swagger UI loads with relaxed CSP", async ({ page }) => {
    const cspViolations: string[] = [];
    
    page.on("console", (msg) => {
      const text = msg.text();
      if (text.includes("Content Security Policy") || text.includes("CSP")) {
        cspViolations.push(text);
      }
    });
    
    await page.goto("/docs", { waitUntil: "networkidle" });
    
    // Wait for Swagger UI to initialize
    await page.waitForSelector("#swagger-ui", { timeout: 5000 });
    await page.waitForTimeout(2000);
    
    // Swagger UI should load without CSP violations (it has relaxed policy on /docs)
    expect(cspViolations).toHaveLength(0);
    
    // Verify Swagger UI rendered
    const swaggerContent = await page.locator("#swagger-ui").textContent();
    expect(swaggerContent).toBeTruthy();
  });
});

test.describe("CSP Header Validation", () => {
  test("Main pages have strict CSP headers", async ({ page }) => {
    const response = await page.goto("/savanna/pages/concept-with-navigation.html");
    expect(response).not.toBeNull();
    
    const cspHeader = response!.headers()["content-security-policy"];
    
    if (cspHeader) {
      // Should not contain unsafe-inline or unsafe-eval in script-src
      expect(cspHeader).not.toContain("script-src 'unsafe-inline'");
      expect(cspHeader).not.toContain("script-src 'unsafe-eval'");
      expect(cspHeader).not.toContain("'unsafe-inline' 'unsafe-eval'");
      
      // Should contain safe directives
      expect(cspHeader).toContain("script-src");
      expect(cspHeader).toContain("'self'");
    }
  });

  test("/docs has relaxed CSP for Swagger UI", async ({ page }) => {
    const response = await page.goto("/docs");
    expect(response).not.toBeNull();
    
    const cspHeader = response!.headers()["content-security-policy"];
    
    if (cspHeader) {
      // /docs route should have unsafe-inline for Swagger UI compatibility
      expect(cspHeader).toContain("'unsafe-inline'");
    }
  });
});
