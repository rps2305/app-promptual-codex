<template>
  <ion-card class="article-card" :class="{ 'article-card--featured': featured }">
    <div class="article-card__media" :style="mediaStyle">
      <ion-img
        v-if="article.imageUrl && !imageFailed"
        :src="article.imageUrl"
        :alt="article.title"
        @ionError="onImageError"
        loading="lazy"
      />
      <div v-else class="article-card__placeholder">
        <ion-icon :icon="imageOutline" size="large" />
        <span>Image unavailable</span>
      </div>
    </div>
    <ion-card-header>
      <ion-card-title>{{ article.title }}</ion-card-title>
      <ion-card-subtitle v-if="showPrompt && promptSnippet">
        {{ promptSnippet }}
      </ion-card-subtitle>
    </ion-card-header>
    <ion-card-content>
      <div class="article-card__tags">
        <ion-chip v-if="article.nsfw" color="danger">
          <ion-label>NSFW</ion-label>
        </ion-chip>
        <ion-chip v-for="tag in article.tags" :key="tag.id">
          <ion-label>{{ tag.name }}</ion-label>
        </ion-chip>
      </div>
    </ion-card-content>
    <ion-button
      v-if="showFavorite"
      fill="clear"
      class="article-card__favorite"
      :color="article.isFavorite ? 'primary' : 'medium'"
      @click="toggleFavorite"
      :aria-label="article.isFavorite ? `Remove ${article.title} from favorites` : `Save ${article.title} to favorites`"
    >
      <ion-icon slot="icon-only" :icon="article.isFavorite ? heart : heartOutline" />
    </ion-button>
  </ion-card>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import {
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardSubtitle,
  IonCardContent,
  IonChip,
  IonImg,
  IonLabel,
  IonIcon,
  IonButton
} from '@ionic/vue';
import { heart, heartOutline, imageOutline } from 'ionicons/icons';
import type { Article } from '../types';

interface Props {
  article: Article;
  showPrompt?: boolean;
  showFavorite?: boolean;
  featured?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showPrompt: true,
  showFavorite: true,
  featured: false
});

const emit = defineEmits<{
  toggleFavorite: [articleId: string];
}>();

const showPrompt = computed(() => props.showPrompt ?? true);
const imageFailed = ref(false);

const promptSnippet = computed(() => {
  const prompt = String(props.article.prompt ?? '').trim();
  if (!prompt) {
    return '';
  }
  return prompt.length > 118 ? `${prompt.slice(0, 118).trim()}...` : prompt;
});

const mediaStyle = computed(() => {
  const { imageWidth, imageHeight } = props.article;
  if (!imageWidth || !imageHeight) {
    return undefined;
  }
  return { aspectRatio: `${imageWidth} / ${imageHeight}` };
});

watch(() => props.article.imageUrl, () => {
  imageFailed.value = false;
});

function onImageError() {
  imageFailed.value = true;
}

function toggleFavorite(event: Event) {
  event.preventDefault();
  event.stopPropagation();
  emit('toggleFavorite', props.article.id);
}
</script>

<style scoped>
.article-card {
  border-radius: 10px;
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  height: 100%;
  margin: 0;
  position: relative;
  border: 1px solid var(--border-subtle);
  transition: transform 180ms ease-out, box-shadow 180ms ease-out, border-color 180ms ease-out;
}

.article-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: color-mix(in srgb, var(--ion-color-primary) 26%, var(--border-subtle));
}

.article-card :deep(ion-card-title) {
  color: var(--color--gray-5);
  font-family: Lora, georgia, serif;
  font-size: 1.02rem;
  font-weight: 700;
  line-height: 1.25;
  display: -webkit-box;
  overflow: hidden;
  overflow-wrap: anywhere;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}

.article-card :deep(ion-card-subtitle) {
  margin-top: var(--space-xs);
  color: var(--text-muted);
  font-size: 0.9rem;
  line-height: 1.42;
  text-transform: none;
  letter-spacing: 0;
  display: -webkit-box;
  overflow: hidden;
  overflow-wrap: anywhere;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}

.article-card :deep(ion-chip) {
  --background: var(--surface-muted);
  --color: var(--text-muted);
  min-height: 24px;
  margin: 0;
  border: 1px solid var(--border-subtle);
  font-weight: 600;
  font-size: 0.78rem;
  letter-spacing: 0;
  max-width: 100%;
}

.article-card :deep(ion-chip ion-label) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.article-card :deep(ion-chip[color='danger']) {
  --background: var(--color--red);
  --color: #ffffff;
}

.article-card__media {
  aspect-ratio: 4 / 5;
  overflow: hidden;
  position: relative;
  background: var(--surface-muted);
}

.article-card ion-img::part(image) {
  object-fit: cover;
}

.article-card :deep(ion-card-header) {
  padding: var(--space-md) var(--space-md) var(--space-xs);
}

.article-card :deep(ion-card-content) {
  margin-top: auto;
  padding: 0 var(--space-md) var(--space-md);
}

.article-card__placeholder {
  display: grid;
  gap: var(--space-xs);
  place-items: center;
  min-height: 180px;
  background: linear-gradient(135deg, rgba(215, 206, 191, 0.5), rgba(242, 238, 230, 0.8));
  color: rgba(78, 63, 40, 0.65);
  text-align: center;
  font-weight: 600;
}

.article-card__placeholder span {
  padding-inline: var(--space-md);
  overflow-wrap: anywhere;
}

.article-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  max-height: 60px;
  overflow: hidden;
  min-width: 0;
}

.article-card__favorite {
  position: absolute;
  top: var(--space-xs);
  right: var(--space-xs);
  width: 44px;
  height: 44px;
  --border-radius: 999px;
  --background: rgba(255, 255, 255, 0.88);
  --background-hover: #ffffff;
  --padding-start: 8px;
  --padding-end: 8px;
  --padding-top: 8px;
  --padding-bottom: 8px;
  backdrop-filter: blur(8px);
}

.article-card--featured :deep(ion-card-title) {
  font-size: clamp(1.2rem, 4vw, 1.5rem);
}

@media (prefers-reduced-motion: reduce) {
  .article-card {
    transition: none;
  }

  .article-card:hover {
    transform: none;
  }
}
</style>
