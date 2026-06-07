<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>
          <span class="title-row">
            <img class="title-logo" src="/promptual-logo.png" alt="Promptual logo" />
            Favorites
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
              <img class="title-logo" src="/promptual-logo.png" alt="Promptual logo" />
              Favorites
            </span>
          </ion-title>
        </ion-toolbar>
      </ion-header>

      <section class="page-intro">
        <p class="page-eyebrow">Favorites</p>
        <h1 class="page-heading">Images you saved</h1>
        <p class="page-copy">Keep the ideas worth coming back to.</p>
      </section>

      <ErrorState
        v-if="store.error"
        :error="store.error"
        title="Favorites did not load"
        message="Your saved favorites are still on this device. Try loading them again."
        :on-retry="loadSavedArticles"
      />

      <div v-else-if="favorites.length === 0 && !store.isLoading" class="empty-state">
        <ion-icon :icon="heartOutline" size="large" class="empty-icon" />
        <p class="empty-text">No favorites yet</p>
        <p class="empty-subtext">Save images from the gallery and they will appear here.</p>
      </div>

      <ArticleGrid
        v-else
        :articles="favorites"
        :has-more="false"
        :is-loading="store.isLoading"
        :load-more="() => {}"
        @toggle-favorite="onToggleFavorite"
      />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonRefresher,
  IonRefresherContent,
  IonIcon,
} from '@ionic/vue';
import { heartOutline } from 'ionicons/icons';
import ArticleGrid from '@/components/ArticleGrid.vue';
import ErrorState from '@/components/ErrorState.vue';
import { useArticlesStore } from '@/stores/articles';

const store = useArticlesStore();

const favorites = computed(() => store.favoritesList);

function onToggleFavorite(articleId: string) {
  store.toggleFavorite(articleId);
}

async function onRefresh(event: CustomEvent) {
  await loadSavedArticles();
  const target = event.target as { complete?: () => void };
  target.complete?.();
}

async function loadSavedArticles() {
  if (store.favoriteCount > 0 && store.articles.length === 0) {
    await store.loadNextPage();
  }
}

onMounted(async () => {
  await loadSavedArticles();
});
</script>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-2xl) var(--page-gutter);
  text-align: center;
}

.empty-icon {
  color: var(--text-soft);
  margin-bottom: var(--space-md);
}

.empty-text {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color--gray-5);
  margin: 0 0 var(--space-xs);
  overflow-wrap: anywhere;
}

.empty-subtext {
  font-size: 0.875rem;
  color: var(--text-muted);
  margin: 0;
  line-height: 1.5;
  max-width: 34rem;
  overflow-wrap: anywhere;
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
</style>
