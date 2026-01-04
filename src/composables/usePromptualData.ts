import { ref } from 'vue';
import { getArticles, getTags, type PromptualArticle, type PromptualTag } from '@/services/promptualApi';

const articles = ref<PromptualArticle[]>([]);
const tags = ref<PromptualTag[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
let hasLoaded = false;

async function loadAll() {
  if (hasLoaded) {
    return;
  }
  loading.value = true;
  error.value = null;
  try {
    const [articleData, tagData] = await Promise.all([getArticles(), getTags()]);
    articles.value = articleData;
    tags.value = tagData;
    hasLoaded = true;
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load data.';
  } finally {
    loading.value = false;
  }
}

function forceReload() {
  hasLoaded = false;
  return loadAll();
}

export function usePromptualData() {
  return {
    articles,
    tags,
    loading,
    error,
    loadAll,
    forceReload,
  };
}
