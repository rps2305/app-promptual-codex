<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>
          <span class="title-row">
            <img class="title-logo" src="/promptual-logo.png" alt="" aria-hidden="true" />
            Tags
          </span>
        </ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <ion-refresher slot="fixed" @ionRefresh="onRefresh">
        <ion-refresher-content pulling-text="Pull to refresh" refreshing-spinner="crescent" />
      </ion-refresher>
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">
            <span class="title-row">
              <img class="title-logo" src="/promptual-logo.png" alt="" aria-hidden="true" />
              Tags
            </span>
          </ion-title>
        </ion-toolbar>
      </ion-header>

      <section class="page-intro">
        <p class="page-eyebrow">Search</p>
        <h1 class="page-heading">Find a style, subject, or prompt</h1>
        <p class="page-copy">Search the words in titles and prompts, or narrow the gallery with tags.</p>
      </section>

      <div class="section-pad">
        <SearchBar
          :query="uiStore.query"
          :recent-searches="uiStore.recentSearches"
          @update:query="onSearch"
          @search="onSearchSubmit"
          @clear-history="uiStore.clearRecentSearches"
        />
      </div>

      <div class="section-pad">
        <TagFilter
          v-if="articlesStore.articles.length > 0"
          :tags="getAllTags()"
          :selected-tag-ids="uiStore.selectedTagIds"
          :nsfw-filter="uiStore.nsfwFilter"
          @toggle-tag="uiStore.toggleTag"
          @nsfw-filter-change="uiStore.setNsfwFilter"
          @clear-all="uiStore.clearAllFilters"
        />
      </div>

      <section class="search-meta section-pad">
        <ion-text v-if="showResultCount" class="result-count">{{ resultSummary }}</ion-text>
      </section>

      <ErrorState
        v-if="searchError"
        :error="searchError"
        title="Search is unavailable"
        message="Check your connection, then try searching the gallery again."
        :on-retry="performSearch"
      />

      <section v-else-if="showInitialState" class="empty-state section-pad">
        <h2>Start with any word</h2>
        <p>Try a subject, visual style, model name, or a tag from the gallery.</p>
        <div class="suggestion-list" aria-label="Search suggestions">
          <ion-button
            v-for="suggestion in starterSearches"
            :key="suggestion"
            size="small"
            fill="outline"
            @click="applyStarterSearch(suggestion)"
          >
            {{ suggestion }}
          </ion-button>
        </div>
      </section>

      <section v-else-if="showNoMatches" class="empty-state section-pad">
        <h2>No matches found</h2>
        <p>Try fewer words, remove a tag, or clear all filters.</p>
        <ion-button fill="outline" size="small" @click="uiStore.clearAllFilters">
          Clear filters
        </ion-button>
      </section>

      <ion-grid v-else>
        <ion-row>
          <ion-col
            v-for="article in filteredArticles"
            :key="article.id"
            size="12"
            size-md="6"
            size-lg="4"
          >
            <router-link :to="`/tabs/tab1/${article.id}`" class="card-link">
              <ArticleCard :article="article" />
            </router-link>
          </ion-col>

          <template v-if="uiStore.isLoading && !filteredArticles.length">
            <ion-col
              v-for="index in 6"
              :key="`skeleton-${index}`"
              size="12"
              size-md="6"
              size-lg="4"
            >
              <LoadingSkeleton />
            </ion-col>
          </template>
        </ion-row>
      </ion-grid>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, onUnmounted, watch } from 'vue';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonText,
  IonButton,
  IonRefresher,
  IonRefresherContent,
} from '@ionic/vue';
import { RouterLink } from 'vue-router';
import SearchBar from '@/components/SearchBar.vue';
import TagFilter from '@/components/TagFilter.vue';
import ArticleCard from '@/components/ArticleCard.vue';
import LoadingSkeleton from '@/components/LoadingSkeleton.vue';
import ErrorState from '@/components/ErrorState.vue';
import { useArticlesStore } from '@/stores/articles';
import { useUiStore } from '@/stores/ui';
import { searchArticles } from '@/api/articles';
import type { Article, Tag } from '@/types';

const articlesStore = useArticlesStore();
const uiStore = useUiStore();
const filteredArticles = ref<Article[]>([]);
let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let searchRequestId = 0;
const starterSearches = ['portrait', 'forest', 'abstract'];

const showResultCount = computed(() => {
  return uiStore.hasFilters || filteredArticles.value.length > 0;
});

const resultSummary = computed(() => {
  const count = filteredArticles.value.length;
  return `${count} ${count === 1 ? 'result' : 'results'}`;
});

const showInitialState = computed(() => {
  return !uiStore.isLoading && !uiStore.hasFilters && filteredArticles.value.length === 0;
});

const showNoMatches = computed(() => {
  return !uiStore.isLoading && uiStore.hasFilters && filteredArticles.value.length === 0;
});

const searchError = computed(() => {
  return uiStore.error || articlesStore.error;
});

function getAllTags() {
  const allTags = articlesStore.articles.reduce((acc: Tag[], article) => {
    article.tags.forEach(tag => {
      if (!acc.find(t => t.id === tag.id)) {
        acc.push(tag);
      }
    });
    return acc;
  }, []);

  return allTags.sort((a, b) => a.name.localeCompare(b.name));
}

async function performSearch() {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }

  const requestId = ++searchRequestId;
  uiStore.setLoading(true);
  uiStore.setError(null);

  try {
    if (articlesStore.articles.length === 0) {
      await articlesStore.loadNextPage();
    }

    const results = await searchArticles({
      query: uiStore.query || undefined,
      tagIds: uiStore.selectedTagIds.length > 0 ? uiStore.selectedTagIds : undefined,
      nsfwFilter: uiStore.nsfwFilter
    });

    if (requestId === searchRequestId) {
      filteredArticles.value = results;
      uiStore.setFilteredArticles(results);
    }
  } catch (err) {
    if (requestId === searchRequestId) {
      uiStore.setError(err instanceof Error ? err.message : 'Search failed');
      filteredArticles.value = [];
    }
  } finally {
    if (requestId === searchRequestId) {
      uiStore.setLoading(false);
    }
  }
}

function onSearch(value: string) {
  uiStore.setQuery(value);
}

function onSearchSubmit(value: string) {
  uiStore.addRecentSearch(value);
  performSearch();
}

function applyStarterSearch(value: string) {
  uiStore.setQuery(value);
  uiStore.addRecentSearch(value);
  performSearch();
}

async function onRefresh(event: CustomEvent) {
  await performSearch();
  const target = event.target as { complete?: () => void };
  target.complete?.();
}

function debouncedSearch() {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }
  debounceTimer = setTimeout(() => {
    if (uiStore.hasFilters) {
      performSearch();
    } else {
      filteredArticles.value = [];
    }
  }, 300);
}

watch(
  () => [uiStore.query, uiStore.selectedTagIds.join(','), uiStore.nsfwFilter],
  debouncedSearch
);

onUnmounted(() => {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }
});

onMounted(async () => {
  await articlesStore.loadNextPage();
  uiStore.loadFromUrlParams();

  if (uiStore.hasFilters) {
    await performSearch();
  }
});
</script>

<style scoped>
.search-meta {
  padding-top: var(--space-md);
}

.result-count {
  display: block;
  font-size: 0.875rem;
  color: var(--text-muted);
  margin-bottom: var(--space-md);
}

.empty-state {
  display: grid;
  gap: var(--space-xs);
  max-width: 520px;
  padding-top: var(--space-lg);
  color: var(--text-muted);
}

.empty-state h2 {
  margin: 0;
  color: var(--color--gray-5);
  font-family: Lora, georgia, serif;
  font-size: 1.25rem;
  overflow-wrap: anywhere;
}

.empty-state p {
  margin: 0;
  line-height: 1.5;
  overflow-wrap: anywhere;
}

.empty-state ion-button {
  justify-self: start;
  margin-top: var(--space-xs);
  min-height: 44px;
}

.suggestion-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
  margin-top: var(--space-xs);
}

.suggestion-list ion-button {
  margin: 0;
  min-height: 44px;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.title-logo {
  height: 32px;
  width: auto;
}

.card-link {
  text-decoration: none;
  display: block;
  height: 100%;
}
</style>
