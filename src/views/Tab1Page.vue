<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>
          <span class="title-row">
            <img class="title-logo" src="/promptual-logo.png" alt="" aria-hidden="true" />
            Promptual Gallery
          </span>
        </ion-title>
        <ion-buttons slot="end">
          <ion-button aria-label="Search images and tags" @click="goToTags">
            <ion-icon slot="icon-only" aria-hidden="true" :icon="searchOutline" />
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
              <img class="title-logo" src="/promptual-logo.png" alt="" aria-hidden="true" />
              Promptual Gallery
            </span>
          </ion-title>
        </ion-toolbar>
      </ion-header>

      <section class="page-intro gallery-intro">
        <p class="page-eyebrow">Gallery</p>
        <h1 class="page-heading">Browse recent AI images</h1>
        <p class="page-copy">A calm place to look around, open an image, and save what catches your eye.</p>
      </section>

      <OnboardingTips v-if="!store.error" @search="goToTags" />

      <ErrorState
        v-if="store.error"
        :error="store.error"
        title="The gallery did not load"
        message="Check your connection, then try loading the newest images again."
        :on-retry="retryGallery"
      />

      <ArticleGrid
        v-else
        :articles="store.favoritedArticles"
        :has-more="store.hasMore"
        :is-loading="store.isLoading"
        :load-more="onLoadMore"
        @toggle-favorite="onToggleFavorite"
      />

    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
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
import { useRouter } from 'vue-router';
import { searchOutline } from 'ionicons/icons';
import ArticleGrid from '@/components/ArticleGrid.vue';
import ErrorState from '@/components/ErrorState.vue';
import OnboardingTips from '@/components/OnboardingTips.vue';
import { useArticlesStore } from '@/stores/articles';

const router = useRouter();
const store = useArticlesStore();

async function onLoadMore() {
  await store.loadNextPage();
}

async function onRefresh(event: CustomEvent) {
  store.resetPagination();
  await store.loadNextPage();
  const target = event.target as { complete?: () => void };
  target.complete?.();
}

function onToggleFavorite(articleId: string) {
  store.toggleFavorite(articleId);
}

function goToTags() {
  router.push({ path: '/tabs/tab2', query: { focus: 'search' } });
}

async function retryGallery() {
  store.resetPagination();
  await store.loadNextPage();
}

onMounted(async () => {
  if (store.articles.length === 0) {
    await store.loadNextPage();
  }
});
</script>

<style scoped>
.gallery-intro {
  padding-bottom: var(--space-md);
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
