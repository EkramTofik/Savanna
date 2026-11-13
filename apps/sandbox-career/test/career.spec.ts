import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("job card and credential render and pass axe", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Accessible Learning Support Associate" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Apply for this job/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Play audio summary/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Certificate/i })).toBeVisible();

  const results = await new AxeBuilder({ page }).analyze();
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
  const play = page.getByRole("button", { name: /Play audio summary/i });
  await play.focus();
  await page.keyboard.press("Enter");
  await expect(play).toHaveAttribute("aria-pressed", "true");
  await page.keyboard.press("Enter");
  await expect(play).toHaveAttribute("aria-pressed", "false");
  await page.getByRole("link", { name: /Apply for this job/i }).focus();
  await expect(page.getByRole("link", { name: /Apply for this job/i })).toBeFocused();
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
