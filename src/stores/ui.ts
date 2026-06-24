import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Article } from '../types';

type NsfwFilter = 'all' | 'safe' | 'nsfw';

const MAX_QUERY_LENGTH = 120;
const MAX_RECENT_SEARCHES = 5;
const MAX_URL_TAGS = 20;
const NSFW_FILTERS = new Set<NsfwFilter>(['all', 'safe', 'nsfw']);

function normalizeQuery(value: string) {
  return value.trim().slice(0, MAX_QUERY_LENGTH);
}

export const useUiStore = defineStore('ui', () => {
  const query = ref('');
  const selectedTagIds = ref<string[]>([]);
  const DEFAULT_NSFW_FILTER: NsfwFilter = 'safe';

  const nsfwFilter = ref<NsfwFilter>(DEFAULT_NSFW_FILTER);
  const recentSearches = ref<string[]>([]);
  const filteredArticles = ref<Article[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const hasFilters = computed(() => {
    return query.value.length > 0 || selectedTagIds.value.length > 0 || nsfwFilter.value !== DEFAULT_NSFW_FILTER;
  });

  function setQuery(value: string) {
    query.value = normalizeQuery(value);
    updateUrlParams();
  }

  function setSelectedTagIds(ids: string[]) {
    selectedTagIds.value = [...new Set(ids.filter(Boolean))].slice(0, MAX_URL_TAGS);
    updateUrlParams();
  }

  function setNsfwFilter(value: NsfwFilter) {
    nsfwFilter.value = NSFW_FILTERS.has(value) ? value : DEFAULT_NSFW_FILTER;
    updateUrlParams();
  }

  function toggleTag(tagId: string) {
    const index = selectedTagIds.value.indexOf(tagId);
    if (index >= 0) {
      selectedTagIds.value.splice(index, 1);
    } else {
      selectedTagIds.value.push(tagId);
    }
    updateUrlParams();
  }

  function clearAllFilters() {
    query.value = '';
    selectedTagIds.value = [];
    nsfwFilter.value = DEFAULT_NSFW_FILTER;
    updateUrlParams();
  }

  function addRecentSearch(search: string) {
    const trimmed = search.trim();
    if (!trimmed) {
      return;
    }

    const filtered = recentSearches.value.filter(s => s.toLowerCase() !== trimmed.toLowerCase());
    filtered.unshift(trimmed);
    recentSearches.value = filtered.slice(0, MAX_RECENT_SEARCHES);
    persistRecentSearches();
  }

  function clearRecentSearches() {
    recentSearches.value = [];
    persistRecentSearches();
  }

  function setFilteredArticles(articles: Article[]) {
    filteredArticles.value = articles;
  }

  function setLoading(value: boolean) {
    isLoading.value = value;
  }

  function setError(value: string | null) {
    error.value = value;
  }

  function persistRecentSearches() {
    try {
      localStorage.setItem('promptual:searchHistory', JSON.stringify(recentSearches.value));
    } catch (err) {
      console.error('Error persisting search history:', err);
    }
  }

  function loadRecentSearches() {
    try {
      const stored = localStorage.getItem('promptual:searchHistory');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          recentSearches.value = parsed
            .filter((item): item is string => typeof item === 'string')
            .map(normalizeQuery)
            .filter(Boolean)
            .slice(0, MAX_RECENT_SEARCHES);
        }
      }
    } catch (err) {
      console.error('Error loading search history:', err);
    }
  }

  function updateUrlParams() {
    const currentQuery = new URLSearchParams(window.location.search);

    if (query.value) {
      currentQuery.set('q', query.value);
    } else {
      currentQuery.delete('q');
    }

    if (selectedTagIds.value.length > 0) {
      currentQuery.set('tags', selectedTagIds.value.join(','));
    } else {
      currentQuery.delete('tags');
    }

    if (nsfwFilter.value !== DEFAULT_NSFW_FILTER) {
      currentQuery.set('nsfw', nsfwFilter.value);
    } else {
      currentQuery.delete('nsfw');
    }

    const queryString = currentQuery.toString();
    const newPath = queryString ? `${window.location.pathname}?${queryString}` : window.location.pathname;
    window.history.replaceState({}, '', newPath);
  }

  function loadFromUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q');
    const tags = params.get('tags');
    const nsfw = params.get('nsfw');

    if (q) {
      query.value = normalizeQuery(q);
    }

    if (tags) {
      selectedTagIds.value = [...new Set(tags.split(',').filter(Boolean))].slice(0, MAX_URL_TAGS);
    }

    if (nsfw && NSFW_FILTERS.has(nsfw as NsfwFilter)) {
      nsfwFilter.value = nsfw as NsfwFilter;
    }
  }

  return {
    query,
    selectedTagIds,
    nsfwFilter,
    recentSearches,
    filteredArticles,
    isLoading,
    error,
    hasFilters,
    setQuery,
    setSelectedTagIds,
    setNsfwFilter,
    toggleTag,
    clearAllFilters,
    addRecentSearch,
    clearRecentSearches,
    setFilteredArticles,
    setLoading,
    setError,
    loadRecentSearches,
    loadFromUrlParams
  };
});
