import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { getRandomArticles, getArticles, getArticleById } from '../api/articles';
import type { Article } from '../types';

const FAVORITES_KEY = 'promptual:favorites';
const FAVORITE_ARTICLES_KEY = 'promptual:favoriteArticles';
export const useArticlesStore = defineStore('articles', () => {
  const articles = ref<Article[]>([]);
  const currentPage = ref(1);
  const hasMore = ref(true);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const hasLoadedAllArticles = ref(false);

  const favorites = ref<Set<string>>(new Set());
  const favoriteSnapshots = ref<Record<string, Article>>({});

  const favoritedArticles = computed(() => {
    return articles.value.map(article => ({
      ...article,
      isFavorite: favorites.value.has(article.id)
    }));
  });

  const favoritesList = computed<Article[]>(() => {
    const savedArticles: Article[] = [];

    favorites.value.forEach((id) => {
      const article = articles.value.find(item => item.id === id) ?? favoriteSnapshots.value[id];
      if (article) {
        savedArticles.push({ ...article, isFavorite: true });
      }
    });

    return savedArticles;
  });

  const favoriteCount = computed(() => favorites.value.size);
  const favoriteIds = computed(() => [...favorites.value]);

  async function loadNextPage() {
    if (isLoading.value || !hasMore.value) {
      return;
    }

    isLoading.value = true;
    error.value = null;

    try {
      const response = await getArticles(currentPage.value);

      const articlesWithFavorites = response.data.map(article => ({
        ...article,
        isFavorite: favorites.value.has(article.id)
      }));

      articles.value.push(...articlesWithFavorites);
      syncFavoriteSnapshots(articlesWithFavorites);
      hasMore.value = response.hasMore;
      if (!response.hasMore) {
        hasLoadedAllArticles.value = true;
      }
      currentPage.value++;
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load articles';
      console.error('Error loading articles:', err);
    } finally {
      isLoading.value = false;
    }
  }

  async function loadArticle(id: string): Promise<Article | null> {
    try {
      const article = await getArticleById(id);
      if (article) {
        const articleWithFavorite = {
          ...article,
          isFavorite: favorites.value.has(article.id)
        };

        const existingIndex = articles.value.findIndex(a => a.id === id);
        if (existingIndex >= 0) {
          articles.value[existingIndex] = articleWithFavorite;
        } else {
          articles.value.push(articleWithFavorite);
        }
        syncFavoriteSnapshots([articleWithFavorite]);

        return articleWithFavorite;
      }
      return null;
    } catch (err) {
      console.error('Error loading article:', err);
      throw err;
    }
  }

  async function loadFavoriteArticles(): Promise<void> {
    if (favorites.value.size === 0) {
      return;
    }

    isLoading.value = true;
    error.value = null;

    try {
      const missingIds = [...favorites.value].filter((id) => {
        return !articles.value.some(article => article.id === id) && !favoriteSnapshots.value[id];
      });

      await Promise.all(missingIds.map(id => loadArticle(id)));

      articles.value.forEach(article => {
        article.isFavorite = favorites.value.has(article.id);
      });
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load favorites';
      console.error('Error loading favorite articles:', err);
    } finally {
      isLoading.value = false;
    }
  }

  async function loadRandom(count: number = 8): Promise<Article[]> {
    const random = await getRandomArticles(count);
    const existingIds = new Set(articles.value.map(article => article.id));
    const randomWithFavorites = random.map(article => ({
      ...article,
      isFavorite: favorites.value.has(article.id)
    }));

    randomWithFavorites.forEach((article) => {
      if (!existingIds.has(article.id)) {
        articles.value.push(article);
      }
    });

    syncFavoriteSnapshots(randomWithFavorites);
    return randomWithFavorites;
  }

  function toggleFavorite(articleId: string) {
    if (favorites.value.has(articleId)) {
      favorites.value.delete(articleId);
    } else {
      favorites.value.add(articleId);
    }

    const article = articles.value.find(a => a.id === articleId);
    if (article) {
      article.isFavorite = favorites.value.has(articleId);
      if (favorites.value.has(articleId)) {
        favoriteSnapshots.value[articleId] = { ...article, isFavorite: true };
      } else {
        delete favoriteSnapshots.value[articleId];
      }
    }

    persistFavorites();
  }

  function resetPagination() {
    articles.value = [];
    currentPage.value = 1;
    hasMore.value = true;
    hasLoadedAllArticles.value = false;
    error.value = null;
  }

  function loadFavorites() {
    try {
      const stored = localStorage.getItem(FAVORITES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          favorites.value = new Set(parsed.filter((item): item is string => typeof item === 'string'));
        }
      }

      const storedArticles = localStorage.getItem(FAVORITE_ARTICLES_KEY);
      if (storedArticles) {
        const parsedArticles = JSON.parse(storedArticles);
        if (parsedArticles && typeof parsedArticles === 'object' && !Array.isArray(parsedArticles)) {
          favoriteSnapshots.value = Object.fromEntries(
            Object.entries(parsedArticles)
              .filter(([id, article]) => favorites.value.has(id) && isArticleSnapshot(article))
          ) as Record<string, Article>;
        }
      }

      articles.value.forEach(article => {
        article.isFavorite = favorites.value.has(article.id);
      });
    } catch (err) {
      console.error('Error loading favorites:', err);
    }
  }

  function persistFavorites() {
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify([...favorites.value]));
      localStorage.setItem(FAVORITE_ARTICLES_KEY, JSON.stringify(favoriteSnapshots.value));
    } catch (err) {
      console.error('Error persisting favorites:', err);
    }
  }

  function syncFavoriteSnapshots(articleList: Article[]) {
    let changed = false;
    articleList.forEach((article) => {
      if (favorites.value.has(article.id)) {
        favoriteSnapshots.value[article.id] = { ...article, isFavorite: true };
        changed = true;
      }
    });
    if (changed) {
      persistFavorites();
    }
  }

  function isArticleSnapshot(value: unknown): value is Article {
    return Boolean(
      value &&
      typeof value === 'object' &&
      'id' in value &&
      'title' in value &&
      typeof (value as Article).id === 'string' &&
      typeof (value as Article).title === 'string'
    );
  }

  return {
    articles,
    currentPage,
    hasMore,
    isLoading,
    error,
    favoritedArticles,
    favoritesList,
    favoriteCount,
    favoriteIds,
    loadNextPage,
    loadArticle,
    loadFavoriteArticles,
    loadRandom,
    toggleFavorite,
    resetPagination,
    loadFavorites
  };
});
