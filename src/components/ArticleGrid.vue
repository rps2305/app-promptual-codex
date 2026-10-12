<template>
  <ion-grid>
    <ion-row>
      <ion-col
        v-for="article in articles"
        :key="article.id"
        size="12"
        size-md="6"
        size-lg="4"
      >
        <router-link
          :to="`/tabs/tab1/${article.id}`"
          class="card-link"
          @click="openArticle(article.id)"
        >
          <ArticleCard
            :article="article"
            @toggle-favorite="onToggleFavorite"
          />
        </router-link>
      </ion-col>

      <template v-if="isLoading">
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

  <ion-infinite-scroll
    v-if="hasMore && !isLoading"
    @ionInfinite="onLoadMore"
    threshold="80%"
  >
    <ion-infinite-scroll-content loading-text="Adding more images..." />
  </ion-infinite-scroll>

  <div v-if="!hasMore && articles.length > 0" class="end-message">
    <p>You are caught up.</p>
    <ion-button fill="clear" @click="scrollToTop">Return to top</ion-button>
  </div>
</template>

<script setup lang="ts">
import { IonButton, IonCol, IonGrid, IonInfiniteScroll, IonInfiniteScrollContent, IonRow } from '@ionic/vue';
import { RouterLink, useRouter } from 'vue-router';
import ArticleCard from './ArticleCard.vue';
import LoadingSkeleton from './LoadingSkeleton.vue';
import type { Article } from '../types';

interface Props {
  articles: Article[];
  hasMore: boolean;
  isLoading: boolean;
  loadMore: () => void;
}

const props = defineProps<Props>();
const router = useRouter();

const emit = defineEmits<{
  toggleFavorite: [articleId: string];
}>();

async function onLoadMore(event: CustomEvent) {
  await props.loadMore();
  const target = event.target as { complete?: () => void };
  target.complete?.();
}

function onToggleFavorite(articleId: string) {
  emit('toggleFavorite', articleId);
}

function openArticle(articleId: string) {
  router.push(`/tabs/tab1/${articleId}`);
}

function scrollToTop() {
  const activeContent = document.querySelector(
    'ion-router-outlet .ion-page:not(.ion-page-hidden) ion-content'
  ) as HTMLIonContentElement | null;

  if (activeContent?.scrollToTop) {
    activeContent.scrollToTop(500);
    return;
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}
</script>

<style scoped>
.card-link {
  text-decoration: none;
  display: block;
  height: 100%;
  color: inherit;
  min-width: 0;
  cursor: pointer;
  touch-action: manipulation;
  content-visibility: auto;
  contain-intrinsic-size: 520px;
}

.end-message {
  text-align: center;
  padding: var(--space-xl) var(--page-gutter) calc(var(--space-2xl) + env(safe-area-inset-bottom));
  color: var(--text-muted);
}

.end-message p {
  margin: 0 0 var(--space-xs);
  font-size: 0.9rem;
}
</style>
