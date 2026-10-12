import { beforeEach, describe, expect, it } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useArticlesStore } from '@/stores/articles';
import type { Article } from '@/types';

const article: Article = {
  id: 'search-1', title: 'Search result', prompt: '', imageUrl: 'https://img/1.jpg',
  imageWidth: null, imageHeight: null, steps: null, guidanceScale: null, seed: null,
  negativePrompt: null, model: null, tags: [], created: '', nsfw: false, path: null
};

describe('articles store favorites', () => {
  beforeEach(() => {
    localStorage.clear();
    setActivePinia(createPinia());
  });

  it('saves a snapshot for an article that is not in the loaded list', () => {
    const store = useArticlesStore();
    store.toggleFavorite(article.id, article);

    expect(store.favoritesList.map(item => item.id)).toEqual(['search-1']);
    expect(JSON.parse(localStorage.getItem('promptual:favorites') ?? '[]')).toEqual(['search-1']);
    expect(Object.keys(JSON.parse(localStorage.getItem('promptual:favoriteArticles') ?? '{}'))).toEqual(['search-1']);
  });

  it('removes the favorite and its snapshot when toggled again', () => {
    const store = useArticlesStore();
    store.toggleFavorite(article.id, article);
    store.toggleFavorite(article.id);

    expect(store.favoritesList).toEqual([]);
    expect(localStorage.getItem('promptual:favorites')).toBe('[]');
    expect(localStorage.getItem('promptual:favoriteArticles')).toBe('{}');
  });
});
