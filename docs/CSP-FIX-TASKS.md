# CSP Fix Tasks

## Problem
Console shows CSP violation: `script-src 'self'` blocks inline script with hash `sha256-lBaE2/gv1iP4N5dOfbZg7hKKJpe/3Xs4g+8GOhFX47Y=`

## ✅ COMPLETED

### 1. **CRITICAL**: Lesson routing script in `savanna/pages/concept-with-navigation.html`
- **Hash**: `sha256-lBaE2/gv1iP4N5dOfbZg7hKKJpe/3Xs4g+8GOhFX47Y=`
- **Purpose**: Handles `?lesson=` query parameter, updates player and navigation UI
- **Impact**: Without this, lesson switching and deep linking don't work
- **Status**: ✅ FIXED - Moved to `/assets/js/lesson-routing.js`

### 2. Event listener script in `savanna/pages/jobs.html`
- **Hash**: `sha256-kuGPfBMOmSWAA83q3RnfkTA3asKuoPrDlEDDqTgQxGc=`
- **Purpose**: Logs Savanna ready event (demo/debugging)
- **Impact**: Low - just console logging
- **Status**: ✅ FIXED - Moved to `/assets/js/career-init.js`

### 3. Demo page inline scripts
- **Status**: ✅ DOCUMENTED - Allowed exceptions for dev sandboxes (not in production)

## Fix Completed

### Phase 1: Extract Inline Scripts ✅
- ✅ Created `/assets/js/lesson-routing.js` for concept page routing logic
- ✅ Created `/assets/js/career-init.js` for jobs page initialization
- ✅ Updated HTML pages to load external scripts with `defer`
- ✅ Tested lesson navigation, language switch, offline functionality

### Phase 2: Configure Production CSP ✅
- ✅ Added comprehensive CSP to helmet configuration in `api/src/app.ts`
- ✅ Configured per-route CSP (relaxed for `/docs` Swagger UI)
- ✅ Set proper directives for media, images, fonts, workers
- ✅ Tested with production build

### Phase 3: Add CSP Tests ✅
- ✅ Playwright test that monitors `securitypolicyviolation` events
- ✅ Unit test asserting no `'unsafe-inline'` or `'unsafe-eval'`
- ✅ HTML scanner test for inline scripts/handlers  
- ✅ All tests passing

### Phase 4: Documentation ✅
- ✅ Documented CSP policy in `docs/SECURITY.md`
- ✅ Explained how to add new scripts safely
- ✅ Documented nonce/hash generation process
- ✅ Listed all exceptions with justification

## Test Results

```bash
$ pnpm test:csp
✓ HTML files have no inline scripts or event handlers (76.8557ms)
✓ API CSP configuration does not use unsafe-inline or unsafe-eval in script-src (2.0697ms)
ℹ tests 2
ℹ pass 2
ℹ fail 0
```

## Acceptance Criteria - ALL MET ✅

- ✅ Zero CSP violations in browser console (production pages)
- ✅ Lesson navigation works (query params, back/forward)
- ✅ Language switch works
- ✅ Offline download works  
- ✅ Service worker registers
- ✅ All media loads
- ✅ Fonts render
- ✅ No `'unsafe-inline'` or `'unsafe-eval'` in `script-src`
- ✅ Tests added and passing
- ✅ Blocked script identified and fixed
- ✅ Documentation complete

## Production Deployment Notes

1. **CSP is enforced** via Helmet in Express (`api/src/app.ts`)
2. **Per-route CSP**: Main pages use strict policy, `/docs` uses relaxed for Swagger
3. **External scripts**: All functionality moved to external `.js` files
4. **Development sandboxes**: Documented exceptions (not in production deployment)
5. **SRI**: Component bundle integrity verified during build
6. **Service Worker**: Registers under `worker-src 'self'` policy

## Files Changed

- `api/src/app.ts` - Comprehensive CSP configuration
- `savanna/pages/concept-with-navigation.html` - Inline script removed
- `savanna/pages/jobs.html` - Inline script removed
- `savanna/assets/js/lesson-routing.js` - NEW: External routing logic
- `savanna/assets/js/career-init.js` - NEW: External initialization
- `demo/sandbox-player/test/csp-compliance.spec.ts` - NEW: Playwright CSP tests
- `scripts/check-inline-scripts.test.mjs` - NEW: Static analysis test
- `docs/SECURITY.md` - NEW: Comprehensive security documentation
- `docs/CSP-FIX-TASKS.md` - This file
- `package.json` - Added `test:csp` script
