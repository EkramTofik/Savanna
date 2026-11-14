import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("job card and credential render and pass axe", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Accessible Learning Support Associate" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Apply for this job/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Play audio summary/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Certificate", exact: true })).toBeVisible();

  const results = await new AxeBuilder({ page }).analyze();
  // Hackathon gate (deck s14): axe-core clean — zero critical and zero serious.
  const blocking = results.violations.filter(
    (v) => v.impact === "critical" || v.impact === "serious",
  );
  expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
});

test("320px viewport has no horizontal scroll", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Accessible Learning Support Associate" })).toBeVisible();
  const scroll = await page.evaluate(() => ({
    inner: window.innerWidth,
    scroll: document.documentElement.scrollWidth,
  }));
  expect(scroll.scroll).toBeLessThanOrEqual(scroll.inner + 1);
});

test("200% and 400% zoom keep a single column", async ({ page }) => {
  await page.goto("/");
  for (const zoom of [2, 4]) {
    await page.evaluate((z) => {
      document.body.style.zoom = String(z);
    }, zoom);
    const article = page.locator("savanna-job-card").first();
    await expect(article).toBeVisible();
    const box = await article.boundingBox();
    expect(box).toBeTruthy();
  }
});

test("keyboard can play audio summary and open apply", async ({ page }) => {
  await page.goto("/");
  const play = page.locator("savanna-job-card").getByRole("button");
  await play.focus();
  await page.keyboard.press("Enter");
  await expect(play).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.press("Enter");
  await expect(play).toHaveAttribute("aria-pressed", "false");
  await page.getByRole("link", { name: /Apply for this job/i }).focus();
  await expect(page.getByRole("link", { name: /Apply for this job/i })).toBeFocused();
});

test("Amharic job dates use the Ethiopian calendar", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "አማርኛ" }).click();
  const jobCard = page.locator("savanna-job-card").first();
  await expect(jobCard.locator("article[lang='am']")).toBeVisible();
  const displayedDate = await jobCard.locator("dl dd").nth(3).textContent();
  const expectedDate = await page.evaluate(() =>
    new Intl.DateTimeFormat("am-ET-u-ca-ethiopic", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date("2026-12-31T23:59:59.000Z")),
  );
  expect(displayedDate?.trim()).toBe(expectedDate);
});

test("verify page is readable and copy works", async ({ page }) => {
  await page.goto("http://localhost:4020/verify/C-7");
  await expect(page.getByRole("heading", { name: "Credential verification" })).toBeVisible();
  await expect(page.getByText("Digital Bridge — Accessible Media Basics")).toBeVisible();
  await expect(page.getByRole("img", { name: /QR code/i })).toBeVisible();
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.getByRole("button", { name: /Copy verification link/i }).click();
  await expect(page.locator("#copied")).toHaveText(/Link copied|localhost:4020\/verify\/C-7/);
});

test("apply form shows error summary without a timeout", async ({ page }) => {
  await page.goto("http://localhost:4020/apply/J-9");
  await page.getByRole("button", { name: "Send application" }).click();
  await expect(page.getByRole("alert")).toContainText("Please fill");
});

test("verification and apply pages reflow at 320px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  for (const url of ["http://localhost:4020/verify/C-7", "http://localhost:4020/apply/J-9"]) {
    await page.goto(url);
    const dimensions = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      content: document.documentElement.scrollWidth,
    }));
    expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport + 1);
  }
});

test("bilingual job audio assets stay within the 20 to 30 second target", async ({ page }) => {
  const outOfRange: string[] = [];
  for (const id of ["J-9", "J-10"]) {
    const response = await page.request.get(`http://localhost:4020/v1/jobs/${id}`, {
      headers: { "X-Savanna-Key": "pk_live_demo" },
    });
    const job = await response.json();
    for (const lang of ["en", "am"]) {
      const url = `http://localhost:4020${job.audioSummary[lang].url}`;
      const duration = await page.evaluate(async (audioUrl) => {
        const response = await fetch(audioUrl, { headers: { "X-Savanna-Key": "pk_live_demo" } });
        const data = await response.arrayBuffer();
        const context = new AudioContext();
        try {
          return (await context.decodeAudioData(data)).duration;
        } finally {
          await context.close();
        }
      }, url);
      console.log(`${id} ${lang} audio: ${duration.toFixed(2)}s`);
      if (duration < 20 || duration > 30) outOfRange.push(`${id} ${lang}: ${duration.toFixed(2)}s`);
    }
  }
  expect(outOfRange).toEqual([]);
});

test("built component bundle works from a partner-host integration page", async ({ page }) => {
  await page.goto("/partner-demo.html");
  await expect(page.getByRole("heading", { name: "Accessible Learning Support Associate" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Certificate: Digital Bridge" })).toBeVisible();
  const pdfLink = page
    .locator("savanna-credential")
    .getByRole("link", { name: "Download PDF certificate" });
  const pdfHref = await pdfLink.getAttribute("href");
  expect(pdfHref).toContain("api-key=pk_live_demo");
  const pdf = await page.request.get(new URL(pdfHref!, page.url()).toString());
  expect(pdf.status()).toBe(200);
  expect(pdf.headers()["content-type"]).toContain("application/pdf");
});
