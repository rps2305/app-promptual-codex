import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getAllArticles, searchArticles } from '@/api/articles';
import { joinUrl } from '@/api/adapter';

function article(id: string, title: string, prompt = title) {
  return {
    id,
    title,
    body: { value: prompt },
    created: '2026-01-01T00:00:00+00:00',
    field_nsfw: false,
    field_image: [
      {
        uri: {
          url: `/sites/default/files/${id}.jpg`,
        },
      },
    ],
    field_tags: [],
  };
}

function jsonResponse(data: unknown, hasNext: boolean) {
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    json: async () => ({
      data,
      links: hasNext ? { next: { href: 'next-page' } } : { self: { href: 'self' } },
    }),
  } as Response;
}

describe('articles API pagination', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('joins API base urls without dropping the jsonapi slash', () => {
    expect(joinUrl('/jsonapi', 'node/article')).toBe('/jsonapi/node/article');
    expect(joinUrl('/jsonapi/', '/node/article')).toBe('/jsonapi/node/article');
    expect(joinUrl('https://promptual.puntuale.nl/jsonapi/', 'node/article')).toBe(
      'https://promptual.puntuale.nl/jsonapi/node/article'
    );
  });

  it('loads every paginated article instead of only the first API page', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('page[offset]=0')) {
        return jsonResponse([article('a-1', 'Forest'), article('a-2', 'Portrait')], true);
      }
      if (url.includes('page[offset]=50')) {
        return jsonResponse([article('a-3', 'Abstract')], false);
      }
      return jsonResponse([], false);
    });
    vi.stubGlobal('fetch', fetchMock);

    const results = await getAllArticles();

    expect(results.map(item => item.id)).toEqual(['a-1', 'a-2', 'a-3']);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('searches across articles from later API pages', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('page[offset]=0')) {
        return jsonResponse([article('a-1', 'Forest')], true);
      }
      if (url.includes('page[offset]=50')) {
        return jsonResponse([article('a-2', 'A hidden nebula', 'blue nebula prompt')], false);
      }
      return jsonResponse([], false);
    });
    vi.stubGlobal('fetch', fetchMock);

    const results = await searchArticles({ query: 'nebula' });

    expect(results.map(item => item.id)).toEqual(['a-2']);
  });
});
