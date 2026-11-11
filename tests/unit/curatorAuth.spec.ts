import { beforeEach, describe, expect, it, vi } from 'vitest';

function tokenResponse(overrides: Record<string, unknown> = {}, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: 'x',
    json: async () => ({ access_token: 'access-1', refresh_token: 'refresh-1', expires_in: 300, ...overrides }),
  } as Response;
}

describe('curator login and NSFW update', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
    vi.stubEnv('VITE_OAUTH_CLIENT_ID', 'client-123');
    localStorage.clear();
  });

  it('logs in with the password grant and stores tokens', async () => {
    const fetchMock = vi.fn().mockResolvedValue(tokenResponse());
    vi.stubGlobal('fetch', fetchMock);
    const auth = await import('@/api/auth');

    await auth.login('curator', 'secret');

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toMatch(/\/oauth\/token$/);
    const body = (init.body as URLSearchParams).toString();
    expect(body).toContain('grant_type=password');
    expect(body).toContain('client_id=client-123');
    expect(body).toContain('scope=nsfw_curator');
    expect(auth.isLoggedIn()).toBe(true);
  });

  it('rejects bad credentials with a readable message and stays logged out', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(tokenResponse({}, 400)));
    const auth = await import('@/api/auth');

    await expect(auth.login('curator', 'nope')).rejects.toThrow(/username and password/i);
    expect(auth.isLoggedIn()).toBe(false);
  });

  it('sends a JSON:API PATCH with the bearer token', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(tokenResponse())
      .mockResolvedValueOnce({ ok: true, status: 200, statusText: 'OK', json: async () => ({}) } as Response);
    vi.stubGlobal('fetch', fetchMock);
    const auth = await import('@/api/auth');
    const articles = await import('@/api/articles');

    await auth.login('curator', 'secret');
    await articles.updateArticleNsfw('abc-uuid', true);

    const [url, init] = fetchMock.mock.calls[1];
    expect(String(url)).toContain('node/article/abc-uuid');
    expect(init.method).toBe('PATCH');
    expect(init.headers.Authorization).toBe('Bearer access-1');
    expect(JSON.parse(init.body)).toEqual({
      data: { type: 'node--article', id: 'abc-uuid', attributes: { field_nsfw: true } },
    });
  });

  it('refreshes the token once on 401 and then succeeds', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(tokenResponse())
      .mockResolvedValueOnce({ ok: false, status: 401, statusText: 'Unauthorized', json: async () => ({}) } as Response)
      .mockResolvedValueOnce(tokenResponse({ access_token: 'access-2' }))
      .mockResolvedValueOnce({ ok: true, status: 200, statusText: 'OK', json: async () => ({}) } as Response);
    vi.stubGlobal('fetch', fetchMock);
    const auth = await import('@/api/auth');
    const articles = await import('@/api/articles');

    await auth.login('curator', 'secret');
    await articles.updateArticleNsfw('abc-uuid', false);

    expect(fetchMock.mock.calls[3][1].headers.Authorization).toBe('Bearer access-2');
  });

  it('throws SessionExpiredError when not logged in', async () => {
    vi.stubGlobal('fetch', vi.fn());
    const articles = await import('@/api/articles');
    await expect(articles.updateArticleNsfw('abc', true)).rejects.toBeInstanceOf(articles.SessionExpiredError);
  });
});

describe('NSFW update error details', () => {
  it('includes the server message when the site refuses the change', async () => {
    vi.resetModules();
    vi.stubEnv('VITE_OAUTH_CLIENT_ID', 'client-123');
    localStorage.clear();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, status: 200, statusText: 'OK', json: async () => ({ access_token: 'a', refresh_token: 'r', expires_in: 300 }) } as Response)
      .mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        json: async () => ({ errors: [{ detail: "The current user is not allowed to PATCH the selected field (field_nsfw)." }] }),
      } as Response);
    vi.stubGlobal('fetch', fetchMock);
    const auth = await import('@/api/auth');
    const articles = await import('@/api/articles');

    await auth.login('curator', 'secret');
    await expect(articles.updateArticleNsfw('abc', true)).rejects.toThrow(/field_nsfw/);
  });
});
