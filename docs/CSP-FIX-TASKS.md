# CSP Fix Tasks

## Problem
Console shows CSP violation: `script-src 'self'` blocks inline script with hash `sha256-lBaE2/gv1iP4N5dOfbZg7hKKJpe/3Xs4g+8GOhFX47Y=`

## Identified Issues

### 1. **CRITICAL**: Lesson routing script in `savanna/pages/concept-with-navigation.html`
- **Hash**: `sha256-lBaE2/gv1iP4N5dOfbZg7hKKJpe/3Xs4g+8GOhFX47Y=`
- **Purpose**: Handles `?lesson=` query parameter, updates player and navigation UI
- **Impact**: Without this, lesson switching and deep linking don't work
- **Status**: ⏳ TO FIX

### 2. Event listener script in `savanna/pages/jobs.html`
- **Hash**: `sha256-kuGPfBMOmSWAA83q3RnfkTA3asKuoPrDlEDDqTgQxGc=`
- **Purpose**: Logs Savanna ready event (demo/debugging)
- **Impact**: Low - just console logging
- **Status**: ⏳ TO FIX

### 3. Demo page inline scripts
Multiple demo pages have inline configuration scripts that need to be externalized.

## Fix Plan

### Phase 1: Extract Inline Scripts (Priority)
- [ ] Create `/assets/js/lesson-routing.js` for concept page routing logic
- [ ] Create `/assets/js/career-init.js` for jobs page initialization
- [ ] Update HTML pages to load external scripts
- [ ] Test lesson navigation, language switch, offline functionality

### Phase 2: Configure Production CSP
- [ ] Add comprehensive CSP to helmet configuration in `api/src/app.ts`
- [ ] Support per-route CSP (different for `/docs` vs main pages)
- [ ] Configure nonce for Swagger UI if needed
- [ ] Test with production build

### Phase 3: Add CSP Tests
- [ ] Playwright test that monitors `securitypolicyviolation` events
- [ ] Unit test asserting no `'unsafe-inline'` or `'unsafe-eval'`
- [ ] HTML scanner test for inline scripts/handlers
- [ ] SRI hash verification test

### Phase 4: Documentation
- [ ] Document CSP policy in `docs/SECURITY.md`
- [ ] Explain how to add new scripts safely
- [ ] Document nonce/hash generation process

## Acceptance Criteria
- [ ] Zero CSP violations in browser console
- [ ] Lesson navigation works (query params, back/forward)
- [ ] Language switch works
- [ ] Offline download works  
- [ ] Service worker registers
- [ ] All media loads
- [ ] Fonts render
- [ ] Tests pass
