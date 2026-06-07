<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>
          <span class="title-row">
            <img class="title-logo" src="/promptual-logo.png" alt="Promptual logo" />
            Random
          </span>
        </ion-title>
        <ion-buttons slot="end">
          <ion-button @click="goToTags">
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
              Random
            </span>
          </ion-title>
        </ion-toolbar>
      </ion-header>

      <section class="page-intro random-intro">
        <div>
          <p class="page-eyebrow">Random</p>
          <h1 class="page-heading">A fresh handful of images</h1>
          <p class="page-copy">For when browsing needs a little chance.</p>
        </div>
        <ion-button size="small" fill="outline" :disabled="store.isLoading" @click="refreshRandom">
          <ion-icon slot="start" :icon="refreshOutline" />
          Refresh
        </ion-button>
      </section>

      <ErrorState
        v-if="store.error"
        :error="store.error"
        title="Random images did not load"
        message="Check your connection, then try another random set."
        retry-label="Try another set"
        :on-retry="retryRandom"
      />

      <ArticleGrid
        v-else
        :articles="randomArticles"
        :has-more="false"
        :is-loading="store.isLoading"
        :load-more="() => {}"
        @toggle-favorite="onToggleFavorite"
      />

    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonContent,
  IonRefresher,
  IonRefresherContent,
} from '@ionic/vue';
import { searchOutline, refreshOutline } from 'ionicons/icons';
import ArticleGrid from '@/components/ArticleGrid.vue';
import ErrorState from '@/components/ErrorState.vue';
import { useArticlesStore } from '@/stores/articles';
import type { Article } from '@/types';

const router = useRouter();
const store = useArticlesStore();
const randomArticles = ref<Article[]>([]);
const RANDOM_COUNT = 8;

async function refreshRandom() {
  const random = await store.loadRandom(RANDOM_COUNT);
  randomArticles.value = random;
}

function onToggleFavorite(articleId: string) {
  store.toggleFavorite(articleId);
}

async function onRefresh(event: CustomEvent) {
  await refreshRandom();
  const target = event.target as { complete?: () => void };
  target.complete?.();
}

function goToTags() {
  router.push({ path: '/tabs/tab2', query: { focus: 'search' } });
}

async function retryRandom() {
  store.resetPagination();
  await store.loadNextPage();
  await refreshRandom();
}

watch(
  () => store.articles.length,
  (length) => {
    if (length > 0 && randomArticles.value.length === 0) {
      refreshRandom();
    }
  },
  { immediate: true }
);

onMounted(async () => {
  if (store.articles.length === 0) {
    await store.loadNextPage();
  }
});
</script>

<style scoped>
.random-intro {
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: var(--space-md);
}

.random-intro ion-button {
  min-height: 40px;
  margin: 0;
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

@media (max-width: 480px) {
  .random-intro {
    grid-template-columns: 1fr;
  }

  .random-intro ion-button {
    justify-self: start;
  }
}
</style>
