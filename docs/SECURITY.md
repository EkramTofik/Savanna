# Security Policy

## Content Security Policy (CSP)

The Savanna Access Kit enforces a strict Content Security Policy to prevent XSS attacks and code injection.

### Production CSP Directives

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self';
  style-src 'self' 'unsafe-inline';
  connect-src 'self' <API_ORIGIN>;
  media-src 'self' blob:;
  img-src 'self' data:;
  font-src 'self';
  worker-src 'self';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'self';
  upgrade-insecure-requests;
```

### Directive Explanations

- **default-src 'self'**: Only load resources from same origin by default
- **script-src 'self'**: Scripts must be in external files from same origin
  - ❌ No `'unsafe-inline'` - prevents inline `<script>` tags
  - ❌ No `'unsafe-eval'` - prevents `eval()`, `new Function()`, `setTimeout("code")`
- **style-src 'self' 'unsafe-inline'**: 
  - Lit uses constructable stylesheets (allowed)
  - Swagger UI requires inline styles (only on `/docs` route)
- **connect-src 'self' <API_ORIGIN>**: XHR/fetch to own origin + configured API
- **media-src 'self' blob:**: Media files + blob URLs for offline playback
- **img-src 'self' data:**: Images + data URIs for QR codes
- **font-src 'self'**: Self-hosted Noto Sans Ethiopic subset
- **worker-src 'self'**: Service worker for offline functionality
- **object-src 'none'**: No Flash/Java/etc plugins
- **base-uri 'self'**: Prevent `<base>` tag injection
- **form-action 'self'**: Forms only submit to same origin
- **frame-ancestors 'self'**: Prevent clickjacking
- **upgrade-insecure-requests**: Auto-upgrade HTTP to HTTPS in production

### Per-Route CSP

Different routes may need different policies:

#### `/docs` (Swagger UI)
```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data:;
  font-src 'self';
```

**Rationale**: Swagger UI uses inline scripts for initialization. This relaxed policy applies only to the `/docs` route. The main application routes use strict CSP.

### Inline Script Migration

All inline scripts have been moved to external files to comply with strict CSP:

| Page | Inline Script | External File | Purpose |
|------|--------------|---------------|---------|
| `savanna/pages/concept-with-navigation.html` | Lesson routing | `/assets/js/lesson-routing.js` | Handle `?lesson=` query param, update player + nav UI |
| `savanna/pages/jobs.html` | Career init | `/assets/js/career-init.js` | Log component ready events |

### Adding New Scripts

When adding new scripts, follow these rules:

1. **Always use external files** with `<script src="...">`, never inline
2. **Use `type="module"`** for ES6 modules when possible
3. **Use `defer`** attribute for non-module scripts
4. **Pass configuration via**:
   - `data-*` attributes on HTML elements
   - JSON data blocks: `<script type="application/json" id="config">{...}</script>`
   - Never through executable inline code

#### ✅ Good Examples

```html
<!-- External script -->
<script src="/assets/js/app.js" defer></script>

<!-- ES6 module -->
<script type="module" src="/assets/js/main.js"></script>

<!-- Configuration as JSON data (not executed, CSP allows) -->
<script type="application/json" id="config">
{
  "apiKey": "pk_demo_public",
  "lessons": ["L-102", "L-103"]
}
</script>
<script src="/assets/js/app.js"></script>
<script>
  // Read config from JSON block
  const config = JSON.parse(document.getElementById('config').textContent);
</script>
```

#### ❌ Bad Examples

```html
<!-- Inline script - BLOCKED by CSP -->
<script>
  window.config = { apiKey: 'pk_demo_public' };
</script>

<!-- Inline event handler - BLOCKED by CSP -->
<button onclick="doSomething()">Click</button>

<!-- javascript: URL - BLOCKED by CSP -->
<a href="javascript:alert('Hi')">Link</a>
```

### Using Nonces or Hashes

If an inline script is truly unavoidable, use a per-request nonce or a pinned hash:

#### Nonce (Preferred for Dynamic Content)

```typescript
// Generate unique nonce per request
const nonce = crypto.randomBytes(16).toString('base64');

// Add to CSP header
res.setHeader('Content-Security-Policy', `script-src 'self' 'nonce-${nonce}'`);

// Add to script tag
res.send(`<script nonce="${nonce}">...</script>`);
```

#### Hash (For Static Scripts)

```bash
# Compute SHA-256 hash of script content
echo -n "console.log('hello')" | openssl dgst -sha256 -binary | openssl base64
# Output: sha256-lBaE2/gv1iP4N5dOfbZg7hKKJpe/3Xs4g+8GOhFX47Y=

# Add to CSP
Content-Security-Policy: script-src 'self' 'sha256-lBaE2/gv1iP4N5dOfbZg7hKKJpe/3Xs4g+8GOhFX47Y='
```

**Note**: Hash must match the script content exactly, including all whitespace. Any change requires recomputing the hash.

### Development vs Production

**Development** may use `Content-Security-Policy-Report-Only` to log violations without blocking:

```typescript
if (config.production) {
  res.setHeader('Content-Security-Policy', directives);
} else {
  res.setHeader('Content-Security-Policy-Report-Only', directives);
}
```

**Production** must enforce the policy (no `-Report-Only`).

### Testing CSP Compliance

#### Automated Tests

```bash
# Static analysis: Check for inline scripts/handlers in HTML
pnpm test:csp

# Playwright: Monitor for CSP violations in browser
pnpm --filter @savanna/sandbox-player test csp-compliance

# Full test suite (includes CSP checks)
pnpm test
pnpm -r --if-present test
```

#### Manual Testing

1. Open browser DevTools Console
2. Navigate to each page:
   - `/savanna/pages/concept-with-navigation.html`
   - `/savanna/pages/jobs.html`
   - `/demo/blank.html`
   - `/docs`
   - `/`
3. Check for CSP violation errors:
   ```
   ❌ Refused to execute inline script because it violates CSP directive...
   ❌ Refused to load ... because it violates CSP directive...
   ```
4. Test all functionality:
   - Lesson navigation (`?lesson=L-102`, `?lesson=L-103`)
   - Language switch
   - Offline download
   - Media playback
   - Service worker registration
   - Fonts rendering
   - QR code display

### Exception Policy

Inline scripts/handlers are allowed only in:

1. **Development sandboxes** (`/demo/sandbox-*`, not in production)
2. **Frozen templates** (`homepage-v1-*.html`, reference only, not linked)
3. **Standalone tools** (`/pipeline/editor`, has own CSP scope)
4. **Swagger UI** (`/docs`, relaxed CSP on that route only)

All exceptions are documented in `scripts/check-inline-scripts.test.mjs`.

### Subresource Integrity (SRI)

The component bundle uses SRI to ensure integrity:

```html
<script 
  type="module" 
  src="../module/savanna-access.v1.js"
  integrity="sha384-..."
  crossorigin="anonymous"
></script>
```

After any change to `savanna-access.v1.js`, regenerate the SRI hash:

```bash
pnpm build
# SRI hash is auto-computed during build
```

### Service Worker Scope

The service worker (`media-sw.js`) must be served from the correct origin with proper headers:

```
Service-Worker-Allowed: /
Service-Worker: script
```

The `worker-src 'self'` CSP directive allows registration.

### Reporting Violations

In development, log violations to console:

```javascript
document.addEventListener('securitypolicyviolation', (e) => {
  console.error(`CSP Violation: ${e.violatedDirective}`, {
    blockedURI: e.blockedURI,
    sourceFile: e.sourceFile,
    lineNumber: e.lineNumber,
  });
});
```

In production, consider a CSP `report-uri` endpoint to collect violations.

### Host-Specific Configuration

Some hosts (Vercel, Render, Netlify) may set their own CSP headers that override Express headers. Check host-specific files:

- **Vercel**: `vercel.json` headers
- **Netlify**: `_headers` file
- **Render**: Not supported, uses Express headers

If the host CSP conflicts with application CSP, adjust the host configuration to match this policy or use the host's CSP override feature.

## Authentication

API keys are passed via `X-Savanna-Key` header (never in URLs or localStorage). See API documentation for key management.

## Rate Limiting

API routes are rate-limited to 120 requests/minute per IP by default. Adjust in `api/src/config.ts`.

## CORS

CORS allows requests from configured partner origins only. See `api/src/config.ts` for partner configuration.

## Security Headers

Additional security headers set by Helmet:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN` (redundant with CSP `frame-ancestors`)
- `X-XSS-Protection: 0` (CSP is more effective)
- `Strict-Transport-Security: max-age=15552000` (HTTPS only)
- `Cross-Origin-Resource-Policy: cross-origin` (allows CDN serving)

## Vulnerability Reporting

Report security vulnerabilities to the repository maintainers (not via public issues).
