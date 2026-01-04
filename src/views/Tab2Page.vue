<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>
          <span class="title-row">
            <img class="title-logo" src="/promptual-logo.png" alt="Promptual logo" />
            Tags
          </span>
        </ion-title>
        <ion-buttons slot="end">
          <ion-button @click="toggleSearch">
            <ion-icon slot="icon-only" :icon="searchOutline" />
          </ion-button>
        </ion-buttons>
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
              <img class="title-logo" src="/promptual-logo.png" alt="Promptual logo" />
              Tags
            </span>
          </ion-title>
        </ion-toolbar>
      </ion-header>

      <section class="page-section">
        <p class="page-kicker">Search by title, prompt, or tag.</p>
        <ion-searchbar
          v-if="showSearch"
          :value="query"
          :debounce="300"
          placeholder="Try “portrait”, “flux”, “forest”…"
          @ionInput="onSearchInput"
          @ionChange="onSearchInput"
          @ionClear="onSearchClear"
        ></ion-searchbar>
      </section>

      <section class="tag-section" v-if="tags.length">
        <div class="tag-header">
          <ion-text class="tag-label">Filter by tag</ion-text>
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
            v-if="tags.length > tagOptions.length"
            size="small"
            fill="clear"
            @click="showAllTags = true"
          >
            Show all
          </ion-button>
        </div>
      </section>

      <section class="page-section">
        <ion-text class="result-count">{{ filteredArticles.length }} results</ion-text>
        <ion-text v-if="error" color="danger">{{ error }}</ion-text>
      </section>

      <ion-grid>
        <ion-row>
          <ion-col
            v-for="article in filteredArticles"
            :key="article.id"
            size="12"
            size-md="6"
            size-lg="4"
          >
            <router-link :to="`/tabs/tab1/${article.id}`" class="card-link">
              <ImageCard :article="article" :show-prompt="false" />
            </router-link>
          </ion-col>

          <template v-if="loading && !articles.length">
            <ion-col
              v-for="index in 6"
              :key="`skeleton-${index}`"
              size="12"
              size-md="6"
              size-lg="4"
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
        </ion-row>
      </ion-grid>

      <ion-loading :is-open="loading" message="Loading search..." />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
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
} from '@ionic/vue';
import { searchOutline } from 'ionicons/icons';
import ImageCard from '@/components/ImageCard.vue';
import { usePromptualData } from '@/composables/usePromptualData';
import { useRoute } from 'vue-router';

const { articles, tags, loading, error, loadAll, forceReload } = usePromptualData();
const query = ref('');
const selectedTags = ref<string[]>([]);
const showAllTags = ref(false);
const showSearch = ref(false);
const TAG_PREVIEW_LIMIT = 24;
const route = useRoute();

const tagOptions = computed(() => {
  const sorted = [...tags.value].sort((a, b) => a.name.localeCompare(b.name));
  return showAllTags.value ? sorted : sorted.slice(0, TAG_PREVIEW_LIMIT);
});

const filteredArticles = computed(() => {
  const normalizedQuery = String(query.value ?? '').trim().toLowerCase();
  const hasTagFilter = selectedTags.value.length > 0;

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

    return matchesTagFilter && matchesQuery;
  });
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

function toggleSearch() {
  showSearch.value = !showSearch.value;
}

async function onRefresh(event: CustomEvent) {
  await forceReload();
  const target = event.target as { complete?: () => void };
  target.complete?.();
}

onMounted(() => {
  if (route.query.focus === 'search') {
    showSearch.value = true;
  }
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

.tag-label {
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color--gray-45, #6b7280);
}

.tag-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.result-count {
  display: block;
  font-size: 0.875rem;
  color: var(--color--gray-45, #6b7280);
}

.card-link {
  text-decoration: none;
  display: block;
  height: 100%;
}
</style>
