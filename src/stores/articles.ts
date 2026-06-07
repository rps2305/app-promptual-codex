import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { getAllArticles, getArticles, getArticleById } from '../api/articles';
import type { Article } from '../types';

export const useArticlesStore = defineStore('articles', () => {
  const articles = ref<Article[]>([]);
  const currentPage = ref(1);
  const hasMore = ref(true);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const hasLoadedAllArticles = ref(false);

  const favorites = ref<Set<string>>(new Set());

  const favoritedArticles = computed(() => {
    return articles.value.map(article => ({
      ...article,
      isFavorite: favorites.value.has(article.id)
    }));
  });

  const favoritesList = computed(() => {
    return articles.value.filter(article =>
      favorites.value.has(article.id)
    );
  });

  const favoriteCount = computed(() => favorites.value.size);

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

        return articleWithFavorite;
      }
      return null;
    } catch (err) {
      console.error('Error loading article:', err);
      throw err;
    }
  }

  async function loadRandom(count: number = 8): Promise<Article[]> {
    if (!hasLoadedAllArticles.value) {
      const allArticles = await getAllArticles();
      const existingIds = new Set(articles.value.map(article => article.id));
      allArticles.forEach((article) => {
        if (!existingIds.has(article.id)) {
          articles.value.push({
            ...article,
            isFavorite: favorites.value.has(article.id)
          });
        }
      });
      hasMore.value = false;
      hasLoadedAllArticles.value = true;
    }

    const shuffled = [...articles.value].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count).map(article => ({
      ...article,
      isFavorite: favorites.value.has(article.id)
    }));
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
      const stored = localStorage.getItem('promptual:favorites');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          favorites.value = new Set(parsed.filter((item): item is string => typeof item === 'string'));
        }
        articles.value.forEach(article => {
          article.isFavorite = favorites.value.has(article.id);
        });
      }
    } catch (err) {
      console.error('Error loading favorites:', err);
    }
  }

  function persistFavorites() {
    try {
      localStorage.setItem('promptual:favorites', JSON.stringify([...favorites.value]));
    } catch (err) {
      console.error('Error persisting favorites:', err);
    }
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
    loadNextPage,
    loadArticle,
    loadRandom,
    toggleFavorite,
    resetPagination,
    loadFavorites
  };
});
