import { get } from './adapter';
import { get as cacheGet, set, invalidate as cacheInvalidate, clear as cacheClear, isFresh } from './cache';
import { fetchWithTimeout, joinUrl } from './adapter';
import { getAccessToken } from './auth';
import { normalizeArticle } from './normalizer';
import { Article, PaginatedResponse, SearchOptions, ApiError } from '../types';

const PAGE_LIMIT = parseInt(import.meta.env.VITE_ARTICLE_PAGE_LIMIT || '30');
const CACHE_TTL = parseInt(import.meta.env.VITE_CACHE_TTL_MS || '1800000');
const MAX_ARTICLES = parseInt(import.meta.env.VITE_MAX_ARTICLES || '3000');
const API_MAX_PAGE_LIMIT = 50;
const RANDOM_PAGE_FETCH_LIMIT = 8;

type RawArticle = {
  id: string;
  title?: string;
  body?: { value: string } | null;
  created?: string;
  field_nsfw?: boolean;
  field_width?: number | null;
  field_height?: number | null;
  field_steps?: number | null;
  field_guidance_scale?: number | null;
  field_seed?: string | null;
  field_negative_prompt?: string | null;
  field_image?: Array<{ uri?: { url?: string } }>;
  field_tags?: any[];
  field_model?: any;
  path?: { alias?: string };
};

type ApiResponse<T> = {
  data: T[] | T;
  links?: { next?: string };
  meta?: { count?: number };
};

function responseItems<T>(response: ApiResponse<T>): T[] {
  return Array.isArray(response.data) ? response.data : [response.data];
}

export async function getArticles(page: number, limit: number = PAGE_LIMIT): Promise<PaginatedResponse<Article>> {
  const offset = (page - 1) * limit;
  const url = `node/article?include=field_image,field_tags,field_model&sort=-created&page[limit]=${limit}&page[offset]=${offset}`;
  const cacheKey = `articles?page=${page}&limit=${limit}`;

  const cached = await cacheGet<Article[]>(cacheKey);
  if (cached && isFresh(cached, CACHE_TTL)) {
    const total = cached.totalPages ? cached.totalPages * limit : MAX_ARTICLES;
    return {
      data: cached.data,
      page,
      limit,
      total,
      hasMore: cached.totalPages ? page < cached.totalPages : cached.data.length === limit,
    };
  }

  try {
    const response = await get<ApiResponse<RawArticle>>(url);
    const responseData = responseItems(response);
    const data = responseData.map(normalizeArticle);
    const total = response.meta?.count ?? MAX_ARTICLES;
    const totalPages = Math.ceil(total / limit);
    const hasMore = Boolean(response.links?.next) || (responseData.length === limit && (page * limit) < total);

    await set(cacheKey, data, { page, totalPages });

    return {
      data,
      page,
      limit,
      total,
      hasMore,
    };
  } catch (error) {
    throw new ApiError(
      `Failed to fetch articles page ${page}`,
      undefined,
      url,
      error instanceof Error ? error : undefined
    );
  }
}

export async function getAllArticles(): Promise<Article[]> {
  const allArticles: Article[] = [];
  const seenIds = new Set<string>();
  let page = 1;
  let hasMorePages = true;

  while (hasMorePages && allArticles.length < MAX_ARTICLES) {
    const response = await getArticles(page, API_MAX_PAGE_LIMIT);

    response.data.forEach((article) => {
      if (!seenIds.has(article.id) && allArticles.length < MAX_ARTICLES) {
        seenIds.add(article.id);
        allArticles.push(article);
      }
    });

    hasMorePages = response.hasMore && response.data.length > 0;
    page += 1;
  }

  return allArticles;
}

export async function getArticleSample(targetCount: number): Promise<Article[]> {
  const sample: Article[] = [];
  const seenIds = new Set<string>();
  let page = 1;
  let hasMorePages = true;

  while (hasMorePages && sample.length < targetCount) {
    const response = await getArticles(page, API_MAX_PAGE_LIMIT);

    response.data.forEach((article) => {
      if (!seenIds.has(article.id) && sample.length < targetCount) {
        seenIds.add(article.id);
        sample.push(article);
      }
    });

    hasMorePages = response.hasMore && response.data.length > 0;
    page += 1;
  }

  return sample;
}

export async function getRandomArticles(targetCount: number): Promise<Article[]> {
  const firstPage = await getArticles(1, API_MAX_PAGE_LIMIT);
  const totalPages = Math.max(1, Math.ceil(firstPage.total / API_MAX_PAGE_LIMIT));
  const pagePool = Array.from({ length: totalPages }, (_, index) => index + 1);
  const randomPages = shuffle(pagePool).slice(0, Math.min(totalPages, RANDOM_PAGE_FETCH_LIMIT));
  const pages = randomPages.length > 0 ? randomPages : [1];
  const articlePool: Article[] = [];
  const seenIds = new Set<string>();

  await Promise.all(
    pages.map(async (page) => {
      const response = page === 1 ? firstPage : await getArticles(page, API_MAX_PAGE_LIMIT);
      response.data.forEach((article) => {
        if (!seenIds.has(article.id)) {
          seenIds.add(article.id);
          articlePool.push(article);
        }
      });
    })
  );

  if (articlePool.length < targetCount && !seenIds.size) {
    firstPage.data.forEach((article) => {
      if (!seenIds.has(article.id)) {
        seenIds.add(article.id);
        articlePool.push(article);
      }
    });
  }

  return shuffle(articlePool).slice(0, targetCount);
}

export async function getArticleById(id: string): Promise<Article | null> {
  const url = `node/article/${id}?include=field_image,field_tags,field_model`;
  const cacheKey = `article:${id}`;

  const cached = await cacheGet<Article>(cacheKey);
  if (cached && isFresh(cached, CACHE_TTL)) {
    return cached.data;
  }

  try {
    const response = await get<ApiResponse<RawArticle>>(url);
    const responseData = responseItems(response);
    if (!responseData.length) {
      return null;
    }

    const article = normalizeArticle(responseData[0]);
    await set(cacheKey, article);

    return article;
  } catch (error) {
    if (error instanceof ApiError && error.statusCode === 404) {
      return null;
    }
    throw error;
  }
}

export async function searchArticles(options: SearchOptions = {}): Promise<Article[]> {
  const { query, tagIds, nsfwFilter = 'all', page = 1, limit = PAGE_LIMIT } = options;

  if (!query && (!tagIds || tagIds.length === 0) && nsfwFilter === 'all') {
    const result = await getArticles(page, limit);
    return result.data;
  }

  const allArticles = await getAllArticles();

  let filtered = allArticles;

  if (query) {
    const queryLower = query.toLowerCase();
    filtered = filtered.filter(article =>
      article.title.toLowerCase().includes(queryLower) ||
      article.prompt.toLowerCase().includes(queryLower) ||
      article.tags.some(tag => tag.name.toLowerCase().includes(queryLower))
    );
  }

  if (tagIds && tagIds.length > 0) {
    filtered = filtered.filter(article =>
      article.tags.some(tag => tagIds.includes(tag.id))
    );
  }

  if (nsfwFilter === 'safe') {
    filtered = filtered.filter(article => !article.nsfw);
  } else if (nsfwFilter === 'nsfw') {
    filtered = filtered.filter(article => article.nsfw);
  }

  return filtered;
}

export async function invalidate(pattern?: string): Promise<void> {
  if (pattern) {
    await cacheInvalidate(pattern);
  } else {
    await cacheInvalidate();
  }
}

export function hasMore(currentPage: number, loadedCount: number): boolean {
  return loadedCount < MAX_ARTICLES && loadedCount % PAGE_LIMIT === 0;
}

function shuffle<T>(items: T[]): T[] {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

export class SessionExpiredError extends Error {
  constructor() {
    super('Your curator session expired. Log in again.');
    this.name = 'SessionExpiredError';
  }
}

async function sendNsfwPatch(id: string, nsfw: boolean, token: string): Promise<Response> {
  const url = joinUrl(import.meta.env.VITE_API_BASE_URL, `node/article/${id}`);
  return fetchWithTimeout(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/vnd.api+json',
      Accept: 'application/vnd.api+json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      data: { type: 'node--article', id, attributes: { field_nsfw: nsfw } },
    }),
  });
}

async function readErrorDetail(response: Response): Promise<string> {
  try {
    const body = await response.json();
    const first = body?.errors?.[0];
    return String(first?.detail || first?.title || body?.message || '').slice(0, 240);
  } catch {
    return '';
  }
}

/** Saves the NSFW flag on the Drupal site. Requires a curator login. */
export async function updateArticleNsfw(id: string, nsfw: boolean): Promise<void> {
  let token = await getAccessToken();
  if (!token) {
    throw new SessionExpiredError();
  }

  let response = await sendNsfwPatch(id, nsfw, token);
  if (response.status === 401) {
    token = await getAccessToken(true);
    if (!token) {
      throw new SessionExpiredError();
    }
    response = await sendNsfwPatch(id, nsfw, token);
  }

  if (response.status === 401) {
    throw new SessionExpiredError();
  }
  if (!response.ok) {
    const detail = await readErrorDetail(response);
    if (response.status === 403) {
      throw new ApiError(`The site refused the change${detail ? `: ${detail}` : '.'}`, 403);
    }
    throw new ApiError(`Could not save the change (HTTP ${response.status})${detail ? `: ${detail}` : '.'}`, response.status);
  }

  // Drop cached copies so the next load shows the new flag.
  await cacheInvalidate(`article:${id}`);
  await cacheClear('articles?');
}
