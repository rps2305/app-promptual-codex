import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getAllArticles, getArticleById, getRandomArticles, searchArticles } from '@/api/articles';
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

function nsfwArticle(id: string, title: string, prompt = title) {
  return {
    ...article(id, title, prompt),
    field_nsfw: true,
  };
}

function jsonResponse(data: unknown, hasNext: boolean, total?: number) {
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    json: async () => ({
      data,
      links: hasNext ? { next: { href: 'next-page' } } : { self: { href: 'self' } },
      meta: total === undefined ? undefined : { count: total },
    }),
  } as Response;
}

describe('articles API pagination', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('joins API base urls without dropping the jsonapi slash', () => {
    expect(joinUrl(undefined, 'node/article')).toBe('https://promptual.puntuale.nl/jsonapi/node/article');
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

  it('samples random articles from later API pages', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('page[offset]=0')) {
        return jsonResponse([article('a-1', 'First page')], true, 500);
      }
      if (url.includes('page[offset]=50')) {
        return jsonResponse([article('a-2', 'Second page')], true, 500);
      }
      if (url.includes('page[offset]=100')) {
        return jsonResponse([article('a-3', 'Third page')], true, 500);
      }
      return jsonResponse([], false, 500);
    });
    vi.stubGlobal('fetch', fetchMock);

    const results = await getRandomArticles(2);

    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('page[offset]=50'), expect.anything());
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('page[offset]=100'), expect.anything());
    expect(results.map(item => item.id)).toEqual(['a-3', 'a-2']);
  });

  it('filters search results by NSFW state', async () => {
    const fetchMock = vi.fn(async () => {
      return jsonResponse([article('a-1', 'Landscape'), nsfwArticle('a-2', 'Figure study')], false);
    });
    vi.stubGlobal('fetch', fetchMock);

    const safeResults = await searchArticles({ nsfwFilter: 'safe' });
    expect(safeResults.map(item => item.id)).toEqual(['a-1']);

    localStorage.clear();

    const nsfwResults = await searchArticles({ nsfwFilter: 'nsfw' });
    expect(nsfwResults.map(item => item.id)).toEqual(['a-2']);
  });

  it('loads a single article from JSON API object data responses', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => ({
        data: article('a-4', 'Saved favorite'),
      }),
    } as Response)));

    const result = await getArticleById('a-4');

    expect(result?.id).toBe('a-4');
    expect(result?.title).toBe('Saved favorite');
  });
});
