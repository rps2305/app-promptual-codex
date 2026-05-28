<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>
          <span class="title-row">
            <AppLogo />
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
          <ion-title size="large">Tags</ion-title>
        </ion-toolbar>
      </ion-header>

      <section class="page-section">
        <p class="page-kicker">{{ filteredArticles.length }} results</p>
        <ion-searchbar
          :value="query"
          :debounce="300"
          placeholder="Search by title, prompt, or tag…"
          @ionInput="onSearchInput"
          @ionChange="onSearchInput"
          @ionClear="onSearchClear"
          class="tags-search"
        ></ion-searchbar>
      </section>

      <section class="tag-section" v-if="tags.length">
        <div class="tag-header">
          <ion-button v-if="selectedTags.length" size="small" fill="clear" @click="clearTags">
            Clear
          </ion-button>
        </div>
        <div class="tag-list">
          <ion-chip
            v-for="tag in tagOptions"
            :key="tag.id"
            :outline="!isSelected(tag.id)"
            color="primary"
            @click="toggleTag(tag.id)"
          >
            <ion-label>{{ tag.name }}</ion-label>
          </ion-chip>
          <ion-button
            v-if="!showAllTags && tags.length > tagOptions.length"
            size="small"
            fill="clear"
            @click="showAllTags = true"
          >
            Show all
          </ion-button>
          <ion-button
            v-if="showAllTags"
            size="small"
            fill="clear"
            @click="showAllTags = false"
          >
            Show less
          </ion-button>
        </div>
      </section>

      <section class="page-section">
        <ion-segment :value="nsfwFilter" @ionChange="onNsfwChange">
          <ion-segment-button value="show" title="Display all images regardless of content rating">
            <ion-label>All</ion-label>
          </ion-segment-button>
          <ion-segment-button value="hide" title="Filter out images flagged as Not Safe For Work (NSFW)">
            <ion-label>Safe</ion-label>
          </ion-segment-button>
          <ion-segment-button value="only" title="Show only images flagged as Not Safe For Work (NSFW)">
            <ion-label>NSFW</ion-label>
          </ion-segment-button>
        </ion-segment>
      </section>

      <section class="page-section">
        <ion-text v-if="error" color="danger">{{ error }}</ion-text>
        <ion-button v-if="error" size="small" fill="clear" @click="forceReload">
          Try again
        </ion-button>
      </section>

      <ion-grid>
        <ion-row>
          <ion-col
            v-for="(article, index) in visibleArticles"
            :key="article.id"
            size="12"
            size-md="6"
            size-lg="3"
            :style="{ '--card-index': index }"
          >
            <router-link :to="`/tabs/tab1/${article.id}`" class="card-link">
              <ImageCard :article="article" compact />
            </router-link>
          </ion-col>

          <template v-if="loading && !articles.length">
            <ion-col
              v-for="index in 8"
              :key="`skeleton-${index}`"
              size="12"
              size-md="6"
              size-lg="3"
            >
              <ion-card class="image-card">
                <ion-skeleton-text animated style="height: 220px" />
                <ion-card-header>
                  <ion-skeleton-text animated style="width: 80%" />
                  <ion-skeleton-text animated style="width: 60%" />
                </ion-card-header>
              </ion-card>
            </ion-col>
          </template>

          <ion-col v-if="!loading && filteredArticles.length === 0" size="12">
            <div class="empty-state">
              <ion-icon :icon="searchOutline" class="empty-icon" />
              <ion-text color="medium">
                <p class="empty-text">Nothing matched</p>
                <p class="empty-hint">Try a broader search, pick a different tag, or loosen the NSFW filter — there's plenty more to explore.</p>
              </ion-text>
            </div>
          </ion-col>
        </ion-row>
      </ion-grid>

      <ion-infinite-scroll :disabled="visibleCount >= filteredArticles.length" @ionInfinite="onInfinite">
        <ion-infinite-scroll-content loading-spinner="crescent" />
      </ion-infinite-scroll>

      <ion-loading :is-open="loading" message="Searching images…" />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButton,
  IonContent,
  IonSearchbar,
  IonChip,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardHeader,
  IonSkeletonText,
  IonText,
  IonLabel,
  IonRefresher,
  IonRefresherContent,
  IonLoading,
  IonSegment,
  IonSegmentButton,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonIcon,
} from '@ionic/vue';
import { searchOutline } from 'ionicons/icons';
import ImageCard from '@/components/ImageCard.vue';
import AppLogo from '@/components/AppLogo.vue';
import { usePromptualData } from '@/composables/usePromptualData';

const { articles, tags, loading, error, loadAll, forceReload } = usePromptualData();
const query = ref('');
const selectedTags = ref<string[]>([]);
const showAllTags = ref(false);
const nsfwFilter = ref<'show' | 'hide' | 'only'>('show');
const TAG_PREVIEW_LIMIT = 24;

const usedTagIds = computed(() => {
  const ids = new Set<string>();
  for (const article of articles.value) {
    for (const tag of article.tags) {
      ids.add(tag.id);
    }
  }
  return ids;
});

const tagOptions = computed(() => {
  const sorted = [...tags.value]
    .filter((tag) => usedTagIds.value.has(tag.id))
    .sort((a, b) => a.name.localeCompare(b.name));
  return showAllTags.value ? sorted : sorted.slice(0, TAG_PREVIEW_LIMIT);
});

const filteredArticles = computed(() => {
  const normalizedQuery = String(query.value ?? '').trim().toLowerCase();
  const hasTagFilter = selectedTags.value.length > 0;
  const nsfwMode = nsfwFilter.value;

  return articles.value.filter((article) => {
    const tagNames = article.tags.map((tag) => tag.name.toLowerCase());
    const matchesTagFilter = !hasTagFilter
      ? true
      : article.tags.some((tag) => selectedTags.value.includes(tag.id));

    const matchesQuery = !normalizedQuery
      ? true
      : article.title.toLowerCase().includes(normalizedQuery) ||
        article.prompt.toLowerCase().includes(normalizedQuery) ||
        tagNames.some((name) => name.includes(normalizedQuery));

    const matchesNsfw = nsfwMode === 'show'
      ? true
      : nsfwMode === 'hide'
        ? !article.nsfw
        : article.nsfw;

    return matchesTagFilter && matchesQuery && matchesNsfw;
  });
});

const PAGE_SIZE = 24;
const visibleCount = ref(PAGE_SIZE);
const visibleArticles = computed(() => filteredArticles.value.slice(0, visibleCount.value));

function onNsfwChange(event: CustomEvent) {
  const value = event.detail.value as 'show' | 'hide' | 'only';
  nsfwFilter.value = value;
}

function onInfinite(event: CustomEvent) {
  visibleCount.value = Math.min(visibleCount.value + PAGE_SIZE, filteredArticles.value.length);
  const target = event.target as { complete?: () => void };
  target.complete?.();
}

watch([query, selectedTags, nsfwFilter], () => {
  visibleCount.value = PAGE_SIZE;
});

watch(articles, () => {
  visibleCount.value = Math.min(visibleCount.value, articles.value.length || PAGE_SIZE);
});

function toggleTag(tagId: string) {
  if (selectedTags.value.includes(tagId)) {
    selectedTags.value = selectedTags.value.filter((id) => id !== tagId);
    return;
  }
  selectedTags.value = [...selectedTags.value, tagId];
}

function isSelected(tagId: string) {
  return selectedTags.value.includes(tagId);
}

function clearTags() {
  selectedTags.value = [];
}

function onSearchInput(event: CustomEvent) {
  const detail = event.detail as { value?: string | null };
  query.value = detail?.value ?? '';
}

function onSearchClear() {
  query.value = '';
}

async function onRefresh(event: CustomEvent) {
  await forceReload();
  const target = event.target as { complete?: () => void };
  target.complete?.();
}

onMounted(() => {
  loadAll();
});
</script>

<style scoped>
.page-section {
  padding: 20px 20px 10px;
}

.page-kicker {
  margin: 0 0 8px;
  font-size: 0.875rem;
  line-height: 1.125rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color--gray-45, #6b7280);
}

.tag-section {
  padding: 0 20px 12px;
}

.tag-header {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.tags-search {
  margin-bottom: 12px;
  padding: 0;
}

.card-link {
  text-decoration: none;
  display: block;
  height: 100%;
  animation: card-enter 0.4s ease-out both;
  animation-delay: calc(var(--card-index, 0) * 40ms);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48px 20px;
  text-align: center;
}

.empty-icon {
  font-size: 2.5rem;
  margin-bottom: 16px;
  opacity: 0.35;
  color: var(--color--gray-45);
}

.empty-text {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0 0 8px;
}

.empty-hint {
  font-size: 0.875rem;
  margin: 0;
  opacity: 0.7;
  max-width: 320px;
}
</style>
