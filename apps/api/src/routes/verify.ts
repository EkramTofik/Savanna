import { Router } from "express";
import QRCode from "qrcode";
import type { CareerCtx, CredentialRecord } from "./career-types.js";
import { effectiveStatus, escapeHtml, problem, wantsJsonLd } from "./career-lib.js";
import { didDocument, toOpenBadge } from "./open-badges.js";

export { toOpenBadge };

function statusLabel(status: string): string {
  if (status === "valid") return "Valid";
  if (status === "revoked") return "Revoked";
  return "Expired";
}

export async function verifyPageHtml(
  record: CredentialRecord,
  ctx: CareerCtx,
): Promise<string> {
  const status = effectiveStatus(record);
  const url = `${ctx.publicBaseUrl}/verify/${record.id}`;
  const qr = await QRCode.toString(url, { type: "svg", margin: 1, width: 160 });
  const issued = new Date(record.issuedAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const recipient = escapeHtml(record.recipientName || "Learner (pseudonymous)");
  const achievement = escapeHtml(record.achievement);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Verify credential — ${achievement}</title>
  <style>
    :root {
      --savanna-accent: #0b5cab;
      --savanna-font: "Segoe UI", system-ui, sans-serif;
      --savanna-focus: #0b5cab;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font: 1.125rem/1.5 var(--savanna-font);
      color: #111;
      background: #fff;
      padding: 1.25rem;
      max-width: 40rem;
    }
    h1 { font-size: 1.5rem; margin: 0 0 0.5rem; }
    .status {
      display: inline-block;
      padding: 0.35rem 0.7rem;
      border-radius: 0.35rem;
      font-weight: 700;
      min-height: 44px;
      line-height: 1.8;
    }
    .valid { background: #d7f5d7; color: #064b06; }
    .revoked, .expired { background: #fde8e8; color: #7a1010; }
    dl { display: grid; grid-template-columns: 1fr; gap: 0.35rem 1rem; }
    dt { font-weight: 700; margin-top: 0.75rem; }
    dd { margin: 0; overflow-wrap: anywhere; }
    button, a.button {
      display: inline-flex; align-items: center; justify-content: center;
      min-height: 44px; min-width: 44px; padding: 0.5rem 1rem;
      margin: 0.5rem 0.5rem 0 0; font: inherit; color: #fff;
      background: var(--savanna-accent); border: 0; border-radius: 0.4rem;
      text-decoration: none; cursor: pointer;
    }
    button:focus, a:focus { outline: 3px solid var(--savanna-focus); outline-offset: 2px; }
    .qr svg { width: 160px; height: 160px; }
    @media (min-width: 40rem) {
      dl { grid-template-columns: 8rem 1fr; }
      dt { margin-top: 0; }
    }
  </style>
</head>
<body>
  <main>
    <h1>Credential verification</h1>
    <p>
      <span class="status ${escapeHtml(status)}">${statusLabel(status)}</span>
    </p>
    <dl>
      <dt>Achievement</dt><dd>${achievement}</dd>
      <dt>Recipient</dt><dd>${recipient}</dd>
      <dt>Issued</dt><dd>${escapeHtml(issued)}</dd>
      <dt>Issuer</dt><dd>${escapeHtml(ctx.issuerName)}</dd>
      <dt>Status</dt><dd>${statusLabel(status)}</dd>
      <dt>Id</dt><dd><code>${escapeHtml(record.id)}</code></dd>
    </dl>
    <p>Hosted verification looks this credential up on the issuer server. A cryptographic Data Integrity proof is attached as a draft (canonical JSON + Ed25519), not full RDFC-1.0.</p>
    <div class="qr">
      ${qr.replace("<svg", `<svg role="img" aria-label="QR code linking to ${escapeHtml(url)}"`)}
    </div>
    <p>
      <button type="button" id="copy">Copy verification link</button>
      <a class="button" href="/v1/credentials/${encodeURIComponent(record.id)}/pdf">Download tagged PDF</a>
    </p>
    <p id="copied" role="status" aria-live="polite"></p>
  </main>
  <script>
    const url = ${JSON.stringify(url)};
    document.getElementById("copy").addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(url);
        document.getElementById("copied").textContent = "Link copied.";
      } catch {
        document.getElementById("copied").textContent = url;
      }
    });
  </script>
</body>
</html>`;
}

export function register(router: Router, ctx: CareerCtx): void {
  router.get("/.well-known/did.json", (_req, res) => {
    res.type("application/did+json").json(didDocument(ctx));
  });

  router.get("/verify/:id", async (req, res, next) => {
    try {
      const record = await ctx.store.getCredential(req.params.id);
      if (!record) {
        if (wantsJsonLd(req) && (req.header("accept") ?? "").includes("json")) {
          problem(res, 404, "Not Found", `Credential ${req.params.id} was not found.`);
          return;
        }
        res.status(404).type("html").send(`<!DOCTYPE html><html lang="en"><head>
          <meta charset="utf-8"><title>Credential not found</title>
          <meta name="viewport" content="width=device-width, initial-scale=1"></head>
          <body><main><h1>Credential not found</h1>
          <p>We could not find that certificate. Check the link and try again.</p>
          </main></body></html>`);
        return;
      }
      if (wantsJsonLd(req) && (req.header("accept") ?? "").includes("ld+json")) {
        res.type("application/ld+json").json(toOpenBadge(record, ctx));
        return;
      }
      res.type("html").send(await verifyPageHtml(record, ctx));
    } catch (err) {
      next(err);
    }
  });
}

export const openapi = {
  paths: {
    "/verify/{id}": {
      get: {
        summary: "Human verify page or OpenBadgeCredential JSON-LD",
        tags: ["Credentials"],
        responses: { "200": { description: "HTML or JSON-LD" } },
      },
    },
  },
};
