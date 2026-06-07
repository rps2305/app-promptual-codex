<template>
  <section class="article-grid-wrap">
    <div class="article-grid">
      <router-link
        v-for="article in articles"
        :key="article.id"
        :to="`/tabs/tab1/${article.id}`"
        class="card-link"
        @click="openArticle(article.id)"
      >
        <ArticleCard
          :article="article"
          @toggle-favorite="onToggleFavorite"
        />
      </router-link>

      <template v-if="isLoading">
        <LoadingSkeleton
          v-for="index in 6"
          :key="`skeleton-${index}`"
        />
      </template>
    </div>
  </section>

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
import { IonInfiniteScroll, IonInfiniteScrollContent, IonButton } from '@ionic/vue';
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
.article-grid-wrap {
  width: 100%;
  max-width: var(--content-max);
  margin-inline: auto;
  padding: var(--space-md) var(--page-gutter) var(--space-xl);
  box-sizing: border-box;
}

.article-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr));
  gap: var(--space-lg);
  align-items: stretch;
}

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
