import {
  test as base,
  expect,
  type Locator,
  type Page,
} from '@playwright/test';

export { expect };
export type { Locator, Page };

/** Page network response (not fetch `APIResponse`). */
type NetworkResponse = Awaited<ReturnType<Page['waitForResponse']>>;

type CleanupFixtures = {
  trackProgram: (uuid: string) => void;
};

const programsApiBase = (): string => {
  const baseUrl = process.env.DIDAXIS_URL ?? 'https://test.didaxis.studio';
  return baseUrl.replace(/\/$/, '');
};

function bearerFromAuthorizationHeader(
  authorization: string | undefined,
): string | undefined {
  if (!authorization?.startsWith('Bearer ')) {
    return undefined;
  }
  const token = authorization.slice('Bearer '.length).trim();
  return token.length > 0 ? token : undefined;
}

async function deleteProgram(uuid: string, token: string | undefined): Promise<void> {
  if (!token) {
    console.warn(
      `[api-cleanup] no API token available; skipped DELETE for program ${uuid}`,
    );
    return;
  }

  const url = `${programsApiBase()}/api/programs/${uuid}`;
  const response = await fetch(url, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (response.status === 404 || response.status === 401) {
    if (response.status === 401) {
      console.warn(
        `[api-cleanup] skipped DELETE for program ${uuid} (401 Unauthorized)`,
      );
    }
    return;
  }

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `[api-cleanup] DELETE ${url} failed: ${response.status} ${body}`,
    );
  }

  console.info(`[api-cleanup] deleted program ${uuid} (${response.status})`);
}

export const test = base.extend<CleanupFixtures>({
  trackProgram: async ({ page }, use) => {
    const uuids: string[] = [];
    let apiToken = bearerFromAuthorizationHeader(
      process.env.DIDAXIS_API_TOKEN
        ? `Bearer ${process.env.DIDAXIS_API_TOKEN}`
        : undefined,
    );

    const captureToken = (authorization: string | undefined) => {
      const fromRequest = bearerFromAuthorizationHeader(authorization);
      if (fromRequest) {
        apiToken = fromRequest;
      }
    };

    page.on('request', (request) => {
      if (!request.url().includes('/api/')) {
        return;
      }
      captureToken(request.headers()['authorization']);
    });

    const trackProgram = (uuid: string) => {
      if (!uuid) {
        throw new Error('[api-cleanup] trackProgram called with empty uuid');
      }
      uuids.push(uuid);
    };

    await use(trackProgram);

    for (const uuid of uuids) {
      await deleteProgram(uuid, apiToken);
    }
  },
});

export function isProgramCreateResponse(response: NetworkResponse): boolean {
  if (response.request().method() !== 'POST') {
    return false;
  }
  try {
    const { pathname } = new URL(response.url());
    return pathname === '/api/programs' || pathname.endsWith('/api/programs');
  } catch {
    return response.url().includes('/api/programs');
  }
}

export function extractProgramId(body: unknown): string {
  if (!body || typeof body !== 'object') {
    throw new Error('[api-cleanup] invalid create response body');
  }

  const record = body as Record<string, unknown>;
  const direct = record.id ?? record.uuid ?? record.programId;
  if (typeof direct === 'string' && direct.length > 0) {
    return direct;
  }

  if (record.data && typeof record.data === 'object') {
    const nested = record.data as Record<string, unknown>;
    const nestedId = nested.id ?? nested.uuid ?? nested.programId;
    if (typeof nestedId === 'string' && nestedId.length > 0) {
      return nestedId;
    }
  }

  throw new Error(
    `[api-cleanup] no program id in create response: ${JSON.stringify(body)}`,
  );
}

export async function trackCreateFromResponse(
  response: NetworkResponse,
  trackProgram: (uuid: string) => void,
): Promise<void> {
  if (!isProgramCreateResponse(response) || !response.ok()) {
    return;
  }
  const body = await response.json();
  trackProgram(extractProgramId(body));
}
