import { openDB, IDBPDatabase } from 'idb';
import { CacheEntry, CacheError } from '../types';

const DB_NAME = 'promptual-cache';
const DB_VERSION = 1;
const STORE_ARTICLES = 'articles';
const STORE_TAGS = 'tags';

const CACHE_TTL = parseInt(import.meta.env.VITE_CACHE_TTL_MS || '1800000');

interface StoredCacheEntry<T> {
  url: string;
  value: CacheEntry<T>;
}

let db: IDBPDatabase<unknown> | null = null;

function hasIndexedDB(): boolean {
  return typeof indexedDB !== 'undefined';
}

async function getDB(): Promise<IDBPDatabase<unknown>> {
  if (!hasIndexedDB()) {
    throw new CacheError('IndexedDB is unavailable');
  }

  if (db) {
    return db;
  }

  try {
    db = await openDB(DB_NAME, DB_VERSION, {
      upgrade(upgradeDB) {
        if (!upgradeDB.objectStoreNames.contains(STORE_ARTICLES)) {
          upgradeDB.createObjectStore(STORE_ARTICLES, { keyPath: 'url' });
        }
        if (!upgradeDB.objectStoreNames.contains(STORE_TAGS)) {
          upgradeDB.createObjectStore(STORE_TAGS, { keyPath: 'url' });
        }
      }
    });
    return db;
  } catch (error) {
    throw new CacheError('Failed to open IndexedDB', error instanceof Error ? error : undefined);
  }
}

function getLocalKey(key: string): string {
  return `promptual:cache:${key}`;
}

function isEntryFresh(entry: CacheEntry<unknown>, ttl: number): boolean {
  return Date.now() - entry.timestamp < ttl;
}

export async function get<T>(key: string): Promise<CacheEntry<T> | null> {
  const storeName = key.startsWith('tags') ? STORE_TAGS : STORE_ARTICLES;

  try {
    const localValue = localStorage.getItem(getLocalKey(key));
    if (localValue) {
      const entry = JSON.parse(localValue) as CacheEntry<T>;
      if (isEntryFresh(entry, CACHE_TTL)) {
        return entry;
      }
      localStorage.removeItem(getLocalKey(key));
    }

    if (!hasIndexedDB()) {
      return null;
    }

    const database = await getDB();
    const stored = await database.get(storeName, key) as StoredCacheEntry<T> | undefined;

    if (!stored) {
      return null;
    }

    if (!isEntryFresh(stored.value, CACHE_TTL)) {
      await database.delete(storeName, key);
      return null;
    }

    return stored.value;
  } catch (error) {
    console.error('Cache get error:', error);
    return null;
  }
}

export async function set<T>(key: string, data: T, options?: { page?: number; totalPages?: number }): Promise<void> {
  const storeName = key.startsWith('tags') ? STORE_TAGS : STORE_ARTICLES;
  const entry: CacheEntry<T> = {
    timestamp: Date.now(),
    data,
    ...options
  };

  const entryJson = JSON.stringify(entry);
  const entrySize = new Blob([entryJson]).size;

  try {
    if (entrySize < 50 * 1024) {
      localStorage.setItem(getLocalKey(key), entryJson);
    } else {
      if (hasIndexedDB()) {
        const database = await getDB();
        const stored: StoredCacheEntry<T> = {
          url: key,
          value: entry
        };
        await database.put(storeName, stored);
      } else {
        localStorage.setItem(getLocalKey(key), entryJson);
      }
    }
  } catch (error) {
    throw new CacheError('Failed to write to cache', error instanceof Error ? error : undefined);
  }
}

export async function invalidate(key?: string): Promise<void> {
  try {
    if (key) {
      const storeName = key.startsWith('tags') ? STORE_TAGS : STORE_ARTICLES;
      localStorage.removeItem(getLocalKey(key));

      if (hasIndexedDB()) {
        const database = await getDB();
        await database.delete(storeName, key);
      }
    } else {
      await clear();
    }
  } catch (error) {
    console.error('Cache invalidate error:', error);
  }
}

export async function clear(pattern?: string | undefined): Promise<void> {
  try {
    if (pattern) {
      const localKeys = Object.keys(localStorage).filter(key =>
        key.startsWith(`promptual:cache:${pattern}`)
      );
      localKeys.forEach(key => localStorage.removeItem(key));

      if (hasIndexedDB()) {
        const database = await getDB();
        for (const storeName of [STORE_ARTICLES, STORE_TAGS]) {
          const keys = await database.getAllKeys(storeName) as string[];
          const matchingKeys = keys.filter(key => key.startsWith(pattern));
          const tx = database.transaction(storeName, 'readwrite');
          await Promise.all(matchingKeys.map(key => tx.store.delete(key)));
        }
      }
    } else {
      Object.keys(localStorage)
        .filter(key => key.startsWith('promptual:cache:'))
        .forEach(key => localStorage.removeItem(key));

      if (hasIndexedDB()) {
        const database = await getDB();
        await database.clear(STORE_ARTICLES);
        await database.clear(STORE_TAGS);
      }
    }
  } catch (error) {
    throw new CacheError('Failed to clear cache', error instanceof Error ? error : undefined);
  }
}

export function isFresh(entry: CacheEntry<unknown>, ttl: number): boolean {
  return isEntryFresh(entry, ttl);
}
