import dotenv from 'dotenv';
import { expect, test, type Page } from '@playwright/test';

dotenv.config();

/**
 * Manual bulk cleanup — not picked up by `npx playwright test`.
 *
 * Run:
 *   npm run cleanup:programs
 *   npx playwright test --config=playwright.cleanup.config.js
 *
 * How many to delete — edit DELETE_COUNT below, or override:
 *   PowerShell: $env:DELETE_PROGRAM_COUNT='10'; npm run cleanup:programs
 *   Values: 10 | 100 | 500 | all | 0 (list IDs only, no deletes)
 */
const DELETE_COUNT: number | 'all' = 10;

const PROGRAMS_PATH = '/api/programs';

test.describe.configure({ mode: 'serial' });

test.beforeEach(({ browserName }) => {
  test.skip(
    browserName !== 'chromium',
    'Manual cleanup is Chromium-only; use --project=chromium',
  );
});

test('GET /api/programs and delete a chosen batch', async ({ page }) => {
  const deleteCount = resolveDeleteCount();
  test.setTimeout(timeoutFor(deleteCount));

  const token = await loginAndCaptureToken(page);
  const ids: string[] = await fetchProgramIds(token);

  console.info(`[manual-cleanup] GET ${programsUrl()} returned ${ids.length} program id(s)`);
  if (ids.length > 0) {
    console.info(`[manual-cleanup] first id: ${ids[0]}`);
    console.info(`[manual-cleanup] last id: ${ids[ids.length - 1]}`);
  }

  expect(ids.length).toBeGreaterThanOrEqual(0);

  const toDelete =
    deleteCount === 'all' ? ids : ids.slice(0, deleteCount);

  if (toDelete.length === 0) {
    console.info('[manual-cleanup] nothing to delete (count is 0 or list is empty)');
    return;
  }

  console.info(
    `[manual-cleanup] deleting ${toDelete.length} of ${ids.length} program(s)`,
  );

  const { deleted, failed } = await deletePrograms(toDelete, token);
  console.info(`[manual-cleanup] deleted=${deleted} failed=${failed}`);
  expect(failed, `${failed} DELETE call(s) failed`).toBe(0);
});

function resolveDeleteCount(): number | 'all' {
  const fromEnv = process.env.DELETE_PROGRAM_COUNT?.trim();
  return parseCount(fromEnv && fromEnv.length > 0 ? fromEnv : String(DELETE_COUNT));
}

function parseCount(value: string): number | 'all' {
  const normalized = value.trim().toLowerCase();
  if (normalized === 'all') {
    return 'all';
  }
  const parsed = Number(normalized);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(
      `DELETE_PROGRAM_COUNT must be a non-negative integer or "all", got: ${value}`,
    );
  }
  return parsed;
}

function timeoutFor(deleteCount: number | 'all'): number {
  if (deleteCount === 'all' || deleteCount >= 500) {
    return 30 * 60 * 1000;
  }
  if (deleteCount >= 100) {
    return 10 * 60 * 1000;
  }
  return 3 * 60 * 1000;
}

function programsApiBase(): string {
  const baseUrl = process.env.DIDAXIS_URL ?? 'https://test.didaxis.studio';
  return baseUrl.replace(/\/$/, '');
}

function programsUrl(query = ''): string {
  return `${programsApiBase()}${PROGRAMS_PATH}${query}`;
}

function requireEnv(name: 'DIDAXIS_EMAIL' | 'DIDAXIS_PASSWORD'): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} must be set`);
  }
  return value;
}

function bearerFromAuthorizationHeader(
  authorization: string | undefined,
): string | undefined {
  if (!authorization?.startsWith('Bearer ')) {
    return undefined;
  }
  const token = authorization.slice('Bearer '.length).trim();
  return token.length > 0 ? token : undefined;
}

async function loginAndCaptureToken(page: Page): Promise<string> {
  const requestPromise = page.waitForRequest(
    (req) =>
      req.url().includes('/api/') && Boolean(req.headers()['authorization']),
    { timeout: 30_000 },
  );

  await page.goto('/login');
  await page.getByLabel('Email').fill(requireEnv('DIDAXIS_EMAIL'));
  await page.getByLabel('Password').fill(requireEnv('DIDAXIS_PASSWORD'));
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page).not.toHaveURL(/\/login/);
  await page.goto('/programs');

  const authorization = (await requestPromise).headers()['authorization'];
  const token = bearerFromAuthorizationHeader(authorization);
  if (!token) {
    throw new Error('[manual-cleanup] no Bearer token on API request after login');
  }
  return token;
}

async function fetchProgramIds(token: string): Promise<string[]> {
  const ids: string[] = [];
  const seen = new Set<string>();
  let page = 1;
  const maxPages = 200;

  while (page <= maxPages) {
    const query = page === 1 ? '' : `?page=${page}`;
    const response = await fetch(programsUrl(query), {
      headers: { Authorization: `Bearer ${token}` },
    });
    const bodyText = await response.text();
    if (!response.ok) {
      throw new Error(
        `[manual-cleanup] GET ${programsUrl(query)} failed: ${response.status} ${bodyText}`,
      );
    }

    let body: unknown;
    try {
      body = JSON.parse(bodyText);
    } catch {
      throw new Error(
        `[manual-cleanup] GET ${PROGRAMS_PATH} did not return JSON: ${bodyText.slice(0, 300)}`,
      );
    }

    const pageIds = extractProgramIds(body);
    let added = 0;
    for (const id of pageIds) {
      if (!seen.has(id)) {
        seen.add(id);
        ids.push(id);
        added += 1;
      }
    }

    if (page === 1) {
      console.info(
        `[manual-cleanup] GET ${PROGRAMS_PATH} parsed ${pageIds.length} id(s) from response`,
      );
    }

    if (pageIds.length === 0 || added === 0 || !looksPaginated(body, page, pageIds.length)) {
      break;
    }
    page += 1;
  }

  return ids;
}

function looksPaginated(
  body: unknown,
  page: number,
  pageSize: number,
): boolean {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return false;
  }
  const record = body as Record<string, unknown>;
  const meta =
    record.meta && typeof record.meta === 'object'
      ? (record.meta as Record<string, unknown>)
      : record;

  const lastPage = numberField(meta, ['lastPage', 'last_page', 'totalPages', 'total_pages']);
  if (lastPage !== undefined) {
    return page < lastPage;
  }
  const total = numberField(meta, ['total', 'totalCount', 'total_count', 'count']);
  if (total !== undefined && pageSize > 0) {
    return page * pageSize < total;
  }
  if (meta.hasMore === true || meta.has_more === true) {
    return true;
  }
  return false;
}

function numberField(
  record: Record<string, unknown>,
  keys: string[],
): number | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
  }
  return undefined;
}

function extractProgramIds(body: unknown): string[] {
  const items = asProgramArray(body);
  return items.map((item, index) => extractId(item, index));
}

function asProgramArray(body: unknown): unknown[] {
  if (Array.isArray(body)) {
    return body;
  }
  if (!body || typeof body !== 'object') {
    throw new Error(
      `[manual-cleanup] unexpected GET ${PROGRAMS_PATH} body type: ${typeof body}`,
    );
  }

  const record = body as Record<string, unknown>;
  for (const key of ['data', 'programs', 'items', 'results', 'rows']) {
    const value = record[key];
    if (Array.isArray(value)) {
      return value;
    }
    if (value && typeof value === 'object') {
      const nested = value as Record<string, unknown>;
      for (const nestedKey of ['data', 'programs', 'items', 'results', 'rows']) {
        if (Array.isArray(nested[nestedKey])) {
          return nested[nestedKey] as unknown[];
        }
      }
    }
  }

  throw new Error(
    `[manual-cleanup] no program array in GET ${PROGRAMS_PATH} body keys: ${Object.keys(record).join(', ')}`,
  );
}

function extractId(item: unknown, index: number): string {
  if (!item || typeof item !== 'object') {
    throw new Error(`[manual-cleanup] program at index ${index} is not an object`);
  }
  const record = item as Record<string, unknown>;
  const direct = record.id ?? record.uuid ?? record.programId;
  if (typeof direct === 'string' && direct.length > 0) {
    return direct;
  }
  if (typeof direct === 'number' && Number.isFinite(direct)) {
    return String(direct);
  }
  throw new Error(
    `[manual-cleanup] no id on program at index ${index}; keys: ${Object.keys(record).join(', ')}`,
  );
}

async function deletePrograms(
  ids: string[],
  token: string,
  concurrency = 5,
): Promise<{ deleted: number; failed: number }> {
  let deleted = 0;
  let failed = 0;
  let next = 0;

  const workers = Array.from(
    { length: Math.min(concurrency, ids.length) },
    async () => {
      while (next < ids.length) {
        const index = next;
        next += 1;
        const id = ids[index];
        try {
          await deleteProgram(id, token);
          deleted += 1;
          if ((index + 1) % 25 === 0 || index + 1 === ids.length) {
            console.info(`[manual-cleanup] progress ${index + 1}/${ids.length}`);
          }
        } catch (error) {
          failed += 1;
          console.warn(
            `[manual-cleanup] DELETE failed for ${id}: ${
              error instanceof Error ? error.message : String(error)
            }`,
          );
        }
      }
    },
  );

  await Promise.all(workers);
  return { deleted, failed };
}

async function deleteProgram(uuid: string, token: string): Promise<void> {
  const url = `${programsApiBase()}${PROGRAMS_PATH}/${uuid}`;
  const response = await fetch(url, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (response.status === 404) {
    return;
  }

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`DELETE ${url} failed: ${response.status} ${body}`);
  }
}
