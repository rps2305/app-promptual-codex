<template>
  <section class="article-grid-wrap">
    <div class="article-grid">
      <router-link
        v-for="(article, index) in articles"
        :key="article.id"
        :to="`/tabs/tab1/${article.id}`"
        class="card-link"
        :class="{ 'card-link--featured': index === 0 && articles.length > 2 }"
      >
        <ArticleCard
          :article="article"
          :featured="index === 0 && articles.length > 2"
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
import { RouterLink } from 'vue-router';
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

function scrollToTop() {
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
}

@media (min-width: 760px) {
  .card-link--featured {
    grid-column: span 2;
  }

  .card-link--featured :deep(.article-card) {
    display: grid;
    grid-template-columns: minmax(320px, 58%) 1fr;
  }

  .card-link--featured :deep(.article-card__media) {
    height: 100%;
  }
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
