import { CapacitorHttp } from '@capacitor/core';

const DEFAULT_SITE_BASE = 'https://promptual.puntuale.nl';

function isNativePlatform() {
  if (typeof window === 'undefined') {
    return false;
  }
  const capacitor = (window as typeof window & { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  return capacitor?.isNativePlatform?.() ?? false;
}

const API_BASE =
  typeof window === 'undefined' || isNativePlatform()
    ? `${DEFAULT_SITE_BASE}/jsonapi`
    : '/jsonapi';
const SITE_BASE = typeof window === 'undefined' || isNativePlatform() ? DEFAULT_SITE_BASE : '';
const CANONICAL_BASE = DEFAULT_SITE_BASE;
const CACHE_TTL_MS = 1000 * 60 * 30;
const ARTICLE_PAGE_LIMIT = 30;
const TAG_PAGE_LIMIT = 100;
const MAX_ARTICLES = 600;

type RawArticle = Record<string, any>;
type RawTag = Record<string, any>;

export type PromptualTag = {
  id: string;
  name: string;
  description: string | null;
};

export type PromptualArticle = {
  id: string;
  title: string;
  prompt: string;
  imageUrl: string | null;
  imageWidth: number | null;
  imageHeight: number | null;
  steps: number | null;
  guidanceScale: number | null;
  seed: string | null;
  negativePrompt: string | null;
  model: PromptualTag | null;
  tags: PromptualTag[];
  created: string;
  nsfw: boolean;
  path: string | null;
};

type CachePayload<T> = {
  timestamp: number;
  data: T;
};

const memoryStore = new Map<string, string>();

const storage = {
  getItem(key: string) {
    if (typeof localStorage === 'undefined') {
      return memoryStore.get(key) ?? null;
    }
    return localStorage.getItem(key);
  },
  setItem(key: string, value: string) {
    if (typeof localStorage === 'undefined') {
      memoryStore.set(key, value);
      return;
    }
    localStorage.setItem(key, value);
  },
};

const cacheKey = {
  articles: 'promptual:articles:v1',
  tags: 'promptual:tags:v1',
};

function readCache<T>(key: string): CachePayload<T> | null {
  const raw = storage.getItem(key);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as CachePayload<T>;
  } catch {
    return null;
  }
}

function writeCache<T>(key: string, data: T) {
  const payload: CachePayload<T> = {
    timestamp: Date.now(),
    data,
  };
  storage.setItem(key, JSON.stringify(payload));
}

async function fetchJson<T>(url: string): Promise<T> {
  if (isNativePlatform()) {
    const response = await CapacitorHttp.request({
      url,
      method: 'GET',
      headers: {
        Accept: 'application/vnd.api+json',
      },
      responseType: 'json',
    });
    if (response.status < 200 || response.status >= 300) {
      throw new Error(`Request failed (${response.status})`);
    }
    return response.data as T;
  }
  const response = await fetch(url, {
    headers: {
      Accept: 'application/vnd.api+json',
    },
  });
  if (!response.ok) {
    throw new Error(`Request failed (${response.status})`);
  }
  return response.json() as Promise<T>;
}

export function normalizeTag(tag: RawTag): PromptualTag {
  return {
    id: tag.id,
    name: tag.name ?? 'Untitled',
    description: tag.description?.value ?? null,
  };
}

export function normalizeArticle(article: RawArticle): PromptualArticle {
  const image = Array.isArray(article.field_image) ? article.field_image[0] : null;
  const imageUrl = image?.uri?.url ? `${SITE_BASE}${image.uri.url}` : null;
  const tagList = Array.isArray(article.field_tags) ? article.field_tags : [];
  const modelTag = article.field_model ? normalizeTag(article.field_model) : null;
  const modelTagList = article.field_model ? [article.field_model] : [];
  const rawTags = [...tagList, ...modelTagList];
  const tags = rawTags
    .filter(Boolean)
    .map(normalizeTag)
    .reduce<PromptualTag[]>((unique, tag) => {
      if (!unique.find((item) => item.id === tag.id)) {
        unique.push(tag);
      }
      return unique;
    }, []);

  return {
    id: article.id,
    title: article.title ?? 'Untitled',
    prompt: article.body?.value ?? '',
    imageUrl,
    imageWidth: Number.isFinite(article.field_width) ? Number(article.field_width) : null,
    imageHeight: Number.isFinite(article.field_height) ? Number(article.field_height) : null,
    steps: Number.isFinite(article.field_steps) ? Number(article.field_steps) : null,
    guidanceScale: Number.isFinite(article.field_guidance_scale) ? Number(article.field_guidance_scale) : null,
    seed: article.field_seed ?? null,
    negativePrompt: article.field_negative_prompt ?? null,
    model: modelTag,
    tags,
    created: article.created ?? '',
    nsfw: Boolean(article.field_nsfw),
    path: article.path?.alias ? `${CANONICAL_BASE}${article.path.alias}` : null,
  };
}

async function loadAllArticles(): Promise<PromptualArticle[]> {
  const results: PromptualArticle[] = [];
  let offset = 0;

  while (results.length < MAX_ARTICLES) {
    const url = `${API_BASE}/node/article?include=field_image,field_tags,field_model&sort=-created&page[limit]=${ARTICLE_PAGE_LIMIT}&page[offset]=${offset}`;
    const payload = await fetchJson<{ data?: RawArticle[] }>(url);
    const data = payload.data ?? [];
    if (!data.length) {
      break;
    }
    results.push(...data.map(normalizeArticle));
    if (data.length < ARTICLE_PAGE_LIMIT) {
      break;
    }
    offset += ARTICLE_PAGE_LIMIT;
  }

  return results;
}

async function loadAllTags(): Promise<PromptualTag[]> {
  const results: PromptualTag[] = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const url = `${API_BASE}/taxonomy_term/tags?sort=name&page[limit]=${TAG_PAGE_LIMIT}&page[offset]=${offset}`;
    const payload = await fetchJson<{ data?: RawTag[] }>(url);
    const data = payload.data ?? [];
    if (!data.length) {
      hasMore = false;
      continue;
    }
    results.push(...data.map(normalizeTag));
    hasMore = data.length === TAG_PAGE_LIMIT;
    offset += TAG_PAGE_LIMIT;
  }

  return results;
}

async function withCache<T>(key: string, loader: () => Promise<T>): Promise<T> {
  const cached = readCache<T>(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }
  const data = await loader();
  writeCache(key, data);
  return data;
}

export async function getArticles(): Promise<PromptualArticle[]> {
  return withCache(cacheKey.articles, loadAllArticles);
}

export async function getTags(): Promise<PromptualTag[]> {
  return withCache(cacheKey.tags, loadAllTags);
}
