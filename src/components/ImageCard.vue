<template>
  <figure
    class="gallery-item"
    :class="{ 'gallery-item--compact': compact, 'gallery-item--expanded': expanded }"
  >
    <div class="gallery-item__frame" @click="goToDetail">
      <img v-if="article.imageUrl" :src="article.imageUrl" :alt="article.title" loading="lazy" @click="goToDetail" />
      <div v-else class="gallery-item__placeholder" @click="goToDetail">Image unavailable</div>
    </div>
    <figcaption class="gallery-item__caption">
      <h3 class="gallery-item__title" @click="goToDetail">{{ article.title }}</h3>
      <p v-if="promptSnippet && !compact" class="gallery-item__prompt" @click.stop="$emit('select')">{{ promptSnippet }}</p>
      <div v-if="!compact && !expanded && article.tags.length" class="gallery-item__tags-row">
        <span v-if="article.nsfw" class="gallery-item__tag gallery-item__tag--nsfw">NSFW</span>
        <span v-for="tag in article.tags.slice(0, 3)" :key="tag.id" class="gallery-item__tag">{{ tag.name }}</span>
        <span v-if="article.tags.length > 3" class="gallery-item__tag">+{{ article.tags.length - 3 }}</span>
      </div>
    </figcaption>
    <div v-if="expanded" class="gallery-item__expanded">
      <div class="gallery-item__expanded-divider"></div>
      <p class="gallery-item__full-prompt">{{ article.prompt || 'No prompt' }}</p>
      <p v-if="article.negativePrompt" class="gallery-item__negative">
        <strong>Negative prompt:</strong> {{ article.negativePrompt }}
      </p>
      <dl class="gallery-item__meta">
        <div v-if="article.model?.name" class="gallery-item__meta-row">
          <dt>Model</dt>
          <dd>{{ article.model.name }}</dd>
        </div>
        <div v-if="article.steps" class="gallery-item__meta-row">
          <dt>Steps</dt>
          <dd>{{ article.steps }}</dd>
        </div>
        <div v-if="article.guidanceScale" class="gallery-item__meta-row">
          <dt>CFG</dt>
          <dd>{{ article.guidanceScale }}</dd>
        </div>
        <div v-if="article.seed" class="gallery-item__meta-row">
          <dt>Seed</dt>
          <dd>{{ article.seed }}</dd>
        </div>
        <div v-if="article.imageWidth && article.imageHeight" class="gallery-item__meta-row">
          <dt>Size</dt>
          <dd>{{ article.imageWidth }} × {{ article.imageHeight }}</dd>
        </div>
      </dl>
      <div class="gallery-item__expanded-tags">
        <span v-if="article.nsfw" class="gallery-item__tag gallery-item__tag--nsfw">NSFW</span>
        <span v-for="tag in article.tags" :key="tag.id" class="gallery-item__tag gallery-item__tag--expanded">{{ tag.name }}</span>
      </div>
      <router-link
        :to="`/tabs/tab1/${article.id}`"
        class="gallery-item__detail-link"
        @click.stop
      >
        View full detail &rarr;
      </router-link>
    </div>
  </figure>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import type { PromptualArticle } from '@/services/promptualApi';

const props = defineProps<{
  article: PromptualArticle;
  compact?: boolean;
  expanded?: boolean;
}>();

defineEmits<{
  select: [];
}>();

const router = useRouter();

function goToDetail() {
  router.push(`/tabs/tab1/${props.article.id}`);
}

const promptSnippet = computed(() => {
  const prompt = String(props.article.prompt ?? '').trim();
  if (!prompt) {
    return '';
  }
  return prompt.length > 120 ? `${prompt.slice(0, 120)}…` : prompt;
});
</script>

<style scoped>
.gallery-item {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.gallery-item__frame {
  position: relative;
  aspect-ratio: 4 / 5;
  overflow: hidden;
  border: 2px solid var(--color--gray-20);
  background: linear-gradient(135deg, var(--color--gray-20), var(--color--terracotta));
  padding: 8px;
  cursor: pointer;
  touch-action: manipulation;
  transition: box-shadow 0.3s var(--ease-out-quart), transform 0.3s var(--ease-out-quart);
  box-shadow:
    0 3px 0 var(--color--gray-20),
    0 12px 28px rgba(18, 14, 8, 0.18);
}

.gallery-item__frame::after {
  content: '';
  position: absolute;
  inset: 0;
  border: 1px solid rgba(255, 255, 255, 0.25);
  pointer-events: none;
}

@media (hover: hover) {
  .gallery-item:hover .gallery-item__frame {
    box-shadow:
      0 4px 0 var(--color--gray-20),
      0 18px 36px rgba(18, 14, 8, 0.24);
  }
}

.gallery-item--compact .gallery-item__frame {
  aspect-ratio: 3 / 4;
}

.gallery-item__frame img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: opacity 0.3s ease;
  cursor: pointer;
}

.gallery-item__placeholder {
  display: grid;
  place-items: center;
  height: 100%;
  min-height: 160px;
  color: var(--color--gray-45);
  font-weight: 500;
  font-size: 0.85rem;
}

.gallery-item__caption {
  padding: 8px 0 0;
}

.gallery-item__title {
  font-family: Lora, georgia, serif;
  font-weight: 700;
  font-size: 1.05rem;
  color: var(--color--gray-5);
  margin: 0;
  line-height: 1.35;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
}

.gallery-item--compact .gallery-item__title {
  font-size: 0.85rem;
}

.gallery-item__prompt {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color--gray-20);
  margin: 2px 0 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
  cursor: pointer;
}

@media (hover: hover) {
  .gallery-item:hover .gallery-item__prompt {
    -webkit-line-clamp: 6;
  }
}

.gallery-item__prompt:hover {
  color: var(--color--terracotta);
}

.gallery-item--compact .gallery-item__prompt {
  display: none;
}

.gallery-item__tags-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}

.gallery-item__tag {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color--gray-20);
  background: var(--color--gray-90);
  padding: 3px 8px;
  border: 1px solid var(--color--gray-85);
  border-radius: 999px;
}

.gallery-item__tag--nsfw {
  background: var(--color--red);
  color: #fff;
}

/* Expanded state */
.gallery-item__expanded {
  padding-top: 0;
  animation: fadeIn 0.2s ease-out;
}

.gallery-item__expanded-divider {
  height: 2px;
  background: var(--color--terracotta-light);
  margin: 8px 0 10px;
}

.gallery-item__full-prompt {
  font-size: 0.85rem;
  line-height: 1.55;
  color: var(--color--gray-20);
  margin: 0 0 8px;
  white-space: pre-wrap;
}

.gallery-item__negative {
  font-size: 0.8rem;
  color: var(--color--red);
  margin: 0 0 10px;
}

.gallery-item__meta {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 3px 10px;
  margin: 0 0 10px;
  font-size: 0.8rem;
}

.gallery-item__meta-row {
  display: contents;
}

.gallery-item__meta dt {
  color: var(--color--gray-45);
  font-weight: 600;
}

.gallery-item__meta dd {
  margin: 0;
  color: var(--color--gray-20);
  text-align: right;
}

.gallery-item__expanded-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 10px;
}

.gallery-item__tag--expanded {
  font-size: 0.75rem;
}

.gallery-item__detail-link {
  display: inline-block;
  font-size: 0.85rem;
  font-weight: 700;
  color: var(--color--terracotta);
  text-decoration: none;
  padding: 6px 0;
}

.gallery-item__detail-link:hover {
  text-decoration: underline;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-4px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
