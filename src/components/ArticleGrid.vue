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
        <ArticleCard
          :article="article"
          :to="`/tabs/tab1/${article.id}`"
          viewer
          @toggle-favorite="onToggleFavorite"
          @view="openViewer"
        />
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

  <ImageViewer
    :is-open="viewerId !== null"
    :image-url="viewerArticle?.imageUrl || null"
    :title="viewerArticle?.title || ''"
    :article-id="viewerArticle?.id"
    :nsfw="viewerArticle?.nsfw"
    :has-prev="viewerIndex > 0"
    :has-next="viewerIndex >= 0 && (viewerIndex < articles.length - 1 || hasMore)"
    @close="viewerId = null"
    @prev="stepViewer(-1)"
    @next="stepViewer(1)"
  />

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
import { computed, ref, watch } from 'vue';
import ArticleCard from './ArticleCard.vue';
import ImageViewer from './ImageViewer.vue';
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

const viewerId = ref<string | null>(null);
const viewerIndex = computed(() => props.articles.findIndex(item => item.id === viewerId.value));
const viewerArticle = computed(() => props.articles[viewerIndex.value] ?? null);

// If the flagged image drops out of the filtered list, close the viewer instead of showing a blank one.
watch(viewerIndex, (index) => {
  if (viewerId.value !== null && index < 0) {
    viewerId.value = null;
  }
});

function openViewer(articleId: string) {
  viewerId.value = articleId;
}

async function stepViewer(step: 1 | -1) {
  const index = viewerIndex.value;
  if (index < 0) {
    return;
  }
  if (step === 1 && index === props.articles.length - 1 && props.hasMore && !props.isLoading) {
    await props.loadMore();
  }
  const target = props.articles[index + step];
  if (target) {
    viewerId.value = target.id;
  }
}

async function onLoadMore(event: CustomEvent) {
  await props.loadMore();
  const target = event.target as { complete?: () => void };
  target.complete?.();
}

function onToggleFavorite(articleId: string) {
  emit('toggleFavorite', articleId);
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
