import { chromium } from "playwright";
import type { CareerCtx, CredentialRecord } from "./career-types.js";
import { effectiveStatus, escapeHtml } from "./career-lib.js";
import { verifyPageHtml } from "./verify.js";

/**
 * Tagged PDF from accessible HTML (FR-D3 / FR-C5).
 * Playwright tagged:true support varies by version — we set PDF/UA-oriented
 * metadata either way and keep the HTML as the source of truth.
 */
export async function renderCertificatePdf(
  record: CredentialRecord,
  ctx: CareerCtx,
): Promise<Buffer> {
  const html = await certificateHtml(record, ctx);
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      displayHeaderFooter: false,
      tagged: true,
      outline: true,
    } as Parameters<typeof page.pdf>[0]);
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}

async function certificateHtml(record: CredentialRecord, ctx: CareerCtx): Promise<string> {
  const verify = await verifyPageHtml(record, ctx);
  const status = effectiveStatus(record);
  const statusAm = status === "valid" ? "ትክክለኛ" : status === "revoked" ? "ተሰርዟል" : "ጊዜው አልፏል";
  const extra = `
    <article lang="am">
      <h1>${escapeHtml(record.achievement)}</h1>
      <p>${escapeHtml(record.recipientName || "ተማሪ")} ከላይ የተጠቀሰውን ስኬት እንዳጠናቀቀ ይህ ሰነድ ያረጋግጣል።</p>
      <p>በማውረድ ጊዜ ያለው ሁኔታ፦ ${statusAm}። በቀጥታ ለማረጋገጥ፦ ${escapeHtml(`${ctx.publicBaseUrl}/verify/${record.id}`)}።</p>
    </article>`;
  return verify.replace("<main>", `<main>${extra}`);
}
