---
name: api-cleanup
description: Ensures Playwright tests clean up the data they create.
  Use whenever generating or reviewing tests that create programs (or
  any persistent records) in Didaxis, so test data does not accumulate.
  Apply this to every test that creates data — even if cleanup isn't
  explicitly requested.
---
# API Cleanup for Test Data
Tests that create data must remove it. Leftover data slows the app and
makes test runs unreliable. Every test that creates a program must track
its UUID and delete it via the API afterwards.

## Steps
1. Use the shared cleanup fixture in `fixtures/cleanup.fixture.ts`.
   Import `test` from there, not from `@playwright/test`.
2. When a test creates a program, capture the program's UUID and call
   `trackProgram(uuid)` immediately.
3. Do not write manual `afterAll` blocks for cleanup — the fixture
   handles teardown for every test that uses it.
4. Cleanup uses the DELETE API, not the UI:
   `DELETE /api/programs/<uuid>` with a Bearer token from
   `process.env.DIDAXIS_API_TOKEN`.
5. Never hardcode the token. Never delete data the test did not create.

## Reference
- Endpoint: DELETE https://test.didaxis.studio/api/programs/<uuid>
- Auth: Authorization: Bearer ${DIDAXIS_API_TOKEN}

## Expired or missing token
Cleanup fails with 401/403 when `DIDAXIS_API_TOKEN` is missing or stale.
Refresh the value in `.env` (JWT only — no `Bearer ` prefix). Never commit
`.env`.

**Capture from the UI after login**

1. Log in to the test app with `DIDAXIS_EMAIL` / `DIDAXIS_PASSWORD` (same
   flow as existing specs: `/login` → Sign In).
2. Load a page that calls the API (e.g. `/programs`).
3. Read the `Authorization` header from any outgoing request whose URL
   contains `/api/` — the SPA sends the same Bearer token the DELETE cleanup
   needs.

**Manual (browser DevTools)**  
Network tab → filter `api` → open a request → Request Headers → copy
`Authorization`, strip the `Bearer ` prefix, paste into `DIDAXIS_API_TOKEN`.

**Automated (one-off script or local helper)**  
After `login(page)`, wait for the first `/api/` request and extract the header:

```typescript
import type { Page } from '@playwright/test';

export async function captureDidaxisApiToken(page: Page): Promise<string> {
  const requestPromise = page.waitForRequest(
    (req) =>
      req.url().includes('/api/') &&
      Boolean(req.headers()['authorization']),
  );
  await page.goto('/programs');
  const authorization = (await requestPromise).headers()['authorization'];
  if (!authorization?.startsWith('Bearer ')) {
    throw new Error('No Bearer token on API request after login');
  }
  return authorization.slice('Bearer '.length);
}
```

Log or write the returned string to `.env` as `DIDAXIS_API_TOKEN`, then re-run
tests. Prefer env-based tokens for CI; use UI capture for local refresh only.
