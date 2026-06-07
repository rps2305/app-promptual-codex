import { CapacitorHttp } from '@capacitor/core';

const DEFAULT_SITE_BASE = 'https://promptual.puntuale.nl';

function isNativePlatform() {
  if (typeof window === 'undefined') {
    return false;
  }
  const capacitor = (window as typeof window & { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  return capacitor?.isNativePlatform?.() ?? false;
}

const isRootDeployment = import.meta.env.DEV && !isNativePlatform()
  && import.meta.env.BASE_URL === '/';
const API_BASE = isRootDeployment ? '/jsonapi' : `${DEFAULT_SITE_BASE}/jsonapi`;
const SITE_BASE = isRootDeployment ? '' : DEFAULT_SITE_BASE;
const CANONICAL_BASE = DEFAULT_SITE_BASE;
const CACHE_TTL_MS = 1000 * 60 * 60 * 24;
const ARTICLE_PAGE_LIMIT = 30;
const TAG_PAGE_LIMIT = 100;
const MAX_ARTICLES = 2000;
const ARTICLE_SORT = '-created,id';
const DB_NAME = 'promptual-cache';
const DB_VERSION = 1;
const DB_STORE = 'responses';

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

type JsonApiPage<T> = {
  data?: T[];
  links?: {
    next?: {
      href?: string;
    };
  };
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

function canUseIndexedDb() {
  return typeof indexedDB !== 'undefined';
}

function openCacheDb() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    if (!canUseIndexedDb()) {
      reject(new Error('IndexedDB is not available.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(DB_STORE)) {
        db.createObjectStore(DB_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Could not open cache database.'));
  });
}

async function readIndexedDb(key: string) {
  if (!canUseIndexedDb()) {
    return null;
  }

  try {
    const db = await openCacheDb();
    return await new Promise<string | null>((resolve, reject) => {
      const transaction = db.transaction(DB_STORE, 'readonly');
      const request = transaction.objectStore(DB_STORE).get(key);
      request.onsuccess = () => resolve(typeof request.result === 'string' ? request.result : null);
      request.onerror = () => reject(request.error ?? new Error('Could not read cache database.'));
      transaction.oncomplete = () => db.close();
      transaction.onerror = () => db.close();
    });
  } catch {
    return null;
  }
}

async function writeIndexedDb(key: string, value: string) {
  if (!canUseIndexedDb()) {
    memoryStore.set(key, value);
    return;
  }

  const db = await openCacheDb();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(DB_STORE, 'readwrite');
    const request = transaction.objectStore(DB_STORE).put(value, key);
    request.onerror = () => reject(request.error ?? new Error('Could not write cache database.'));
    transaction.oncomplete = () => {
      db.close();
      resolve();
    };
    transaction.onerror = () => {
      db.close();
      reject(transaction.error ?? new Error('Could not write cache database.'));
    };
  });
}

const cacheKey = {
  articles: 'promptual:articles:v4',
  tags: 'promptual:tags:v2',
};

async function readCache<T>(key: string): Promise<CachePayload<T> | null> {
  let raw: string | null = null;
  try {
    raw = storage.getItem(key);
  } catch {
    raw = null;
  }
  raw = raw ?? await readIndexedDb(key);
  if (!raw) {
    return null;
  }
  try {
    return JSON.parse(raw) as CachePayload<T>;
  } catch {
    return null;
  }
}

async function writeCache<T>(key: string, data: T) {
  const payload: CachePayload<T> = {
    timestamp: Date.now(),
    data,
  };
  const serialized = JSON.stringify(payload);
  try {
    storage.setItem(key, serialized);
  } catch {
    await writeIndexedDb(key, serialized);
  }
}

function toApiUrl(href: string) {
  if (isRootDeployment && href.startsWith(`${DEFAULT_SITE_BASE}/jsonapi`)) {
    return href.replace(`${DEFAULT_SITE_BASE}/jsonapi`, API_BASE);
  }
  return href;
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
      throw new Error('Could not load data. Check your connection and try again.');
    }
    return response.data as T;
  }
  const response = await fetch(url, {
    headers: {
      Accept: 'application/vnd.api+json',
    },
  });
  if (!response.ok) {
    throw new Error('Could not load data. Check your connection and try again.');
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
  const seenIds = new Set<string>();
  let url: string | null = `${API_BASE}/node/article?include=field_image,field_tags,field_model&sort=${ARTICLE_SORT}&page[limit]=${ARTICLE_PAGE_LIMIT}&page[offset]=0`;

  while (url && results.length < MAX_ARTICLES) {
    const payload: JsonApiPage<RawArticle> = await fetchJson<JsonApiPage<RawArticle>>(url);
    const data = payload.data ?? [];
    if (!data.length) {
      break;
    }
    for (const article of data.map(normalizeArticle)) {
      if (!seenIds.has(article.id)) {
        seenIds.add(article.id);
        results.push(article);
      }
    }
    url = payload.links?.next?.href ? toApiUrl(payload.links.next.href) : null;
  }

  return results;
}

async function loadAllTags(): Promise<PromptualTag[]> {
  const results: PromptualTag[] = [];
  let url: string | null = `${API_BASE}/taxonomy_term/tags?sort=name&page[limit]=${TAG_PAGE_LIMIT}&page[offset]=0`;

  while (url) {
    const payload: JsonApiPage<RawTag> = await fetchJson<JsonApiPage<RawTag>>(url);
    const data = payload.data ?? [];
    if (!data.length) {
      break;
    }
    results.push(...data.map(normalizeTag));
    url = payload.links?.next?.href ? toApiUrl(payload.links.next.href) : null;
  }

  return results;
}

async function withCache<T>(key: string, loader: () => Promise<T>, force = false): Promise<T> {
  const cached = await readCache<T>(key);
  if (!force && cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }
  const data = await loader();
  await writeCache(key, data);
  return data;
}

export async function getArticles(force = false): Promise<PromptualArticle[]> {
  return withCache(cacheKey.articles, loadAllArticles, force);
}

export async function getTags(force = false): Promise<PromptualTag[]> {
  return withCache(cacheKey.tags, loadAllTags, force);
}
