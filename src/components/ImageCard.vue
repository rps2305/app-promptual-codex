<template>
  <ion-card class="image-card">
    <div class="image-card__media" :style="mediaStyle">
      <ion-img v-if="article.imageUrl" :src="article.imageUrl" :alt="article.title" />
      <div v-else class="image-card__placeholder">No image</div>
    </div>
    <ion-card-header>
      <ion-card-title>{{ article.title }}</ion-card-title>
      <ion-card-subtitle v-if="showPrompt && promptSnippet">{{ promptSnippet }}</ion-card-subtitle>
    </ion-card-header>
    <ion-card-content>
      <div class="image-card__tags">
        <ion-chip v-if="article.nsfw" color="danger">
          <ion-label>NSFW</ion-label>
        </ion-chip>
        <ion-chip v-for="tag in article.tags" :key="tag.id">
          <ion-label>{{ tag.name }}</ion-label>
        </ion-chip>
      </div>
    </ion-card-content>
  </ion-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent, IonChip, IonImg, IonLabel } from '@ionic/vue';
import type { PromptualArticle } from '@/services/promptualApi';

const props = defineProps<{
  article: PromptualArticle;
  showPrompt?: boolean;
}>();

const showPrompt = computed(() => props.showPrompt ?? true);

const promptSnippet = computed(() => {
  const prompt = String(props.article.prompt ?? '').trim();
  if (!prompt) {
    return '';
  }
  return prompt.length > 140 ? `${prompt.slice(0, 140)}…` : prompt;
});

const mediaStyle = computed(() => {
  const { imageWidth, imageHeight } = props.article;
  if (!imageWidth || !imageHeight) {
    return undefined;
  }
  return { aspectRatio: `${imageWidth} / ${imageHeight}` };
});
</script>

<style scoped>
.image-card {
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 18px 45px rgba(18, 14, 8, 0.15);
  display: flex;
  flex-direction: column;
  height: 100%;
  margin-bottom: 16px;
}

.image-card :deep(ion-card-title) {
  font-weight: 700;
}

.image-card :deep(ion-chip) {
  --background: var(--color--primary-50);
  --color: #ffffff;
  font-weight: 700;
  font-size: 0.85rem;
  letter-spacing: 0.01em;
}

.image-card :deep(ion-chip[color='danger']) {
  --background: var(--color--red);
  --color: #ffffff;
}

.image-card__media {
  aspect-ratio: 4 / 5;
  overflow: hidden;
}

.image-card ion-img::part(image) {
  object-fit: cover;
}

.image-card :deep(ion-card-content) {
  margin-top: auto;
}

.image-card__placeholder {
  display: grid;
  place-items: center;
  min-height: 180px;
  background: linear-gradient(135deg, rgba(215, 206, 191, 0.5), rgba(242, 238, 230, 0.8));
  color: rgba(78, 63, 40, 0.65);
  font-weight: 600;
}

.image-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
</style>
