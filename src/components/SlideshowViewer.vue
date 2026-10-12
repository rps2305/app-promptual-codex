<template>
  <ion-modal :is-open="isOpen" class="slideshow-modal" @ionModalDidDismiss="emit('close')">
    <div
      class="slideshow"
      @pointerdown="onPointerDown"
      @pointermove="wake"
      @pointerup="onPointerUp"
      @pointercancel="startPoint = null"
    >
      <img
        v-if="article?.imageUrl"
        :key="article.id"
        :src="article.imageUrl"
        :alt="article.title"
        class="slideshow__image"
        draggable="false"
      />

      <div class="slideshow__top" :class="{ 'slideshow__controls--dim': isDimmed }">
        <button type="button" class="slideshow__close" aria-label="Close slide show" @click="emit('close')">
          <ion-icon aria-hidden="true" :icon="closeOutline" />
        </button>
        <span v-if="article?.nsfw" class="slideshow__badge">NSFW</span>
      </div>

      <p v-if="message" class="slideshow__message" role="status">{{ message }}</p>

      <div class="slideshow__bottom" :class="{ 'slideshow__controls--dim': isDimmed }">
        <p v-if="article" class="slideshow__title">{{ article.title }}</p>
        <div class="slideshow__actions">
          <button type="button" class="slideshow__action" :disabled="isBusy" @click="emit('next', 'safe')">
            <ion-icon aria-hidden="true" :icon="arrowBackOutline" />
            Safe image
          </button>
          <button type="button" class="slideshow__action" :disabled="isBusy" @click="emit('next', 'nsfw')">
            NSFW image
            <ion-icon aria-hidden="true" :icon="arrowForwardOutline" />
          </button>
        </div>
      </div>
    </div>
  </ion-modal>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue';
import { IonIcon, IonModal } from '@ionic/vue';
import { arrowBackOutline, arrowForwardOutline, closeOutline } from 'ionicons/icons';
import { swipeDirection, type SlideKind } from '@/composables/useSlideshow';
import type { Article } from '@/types';

const props = defineProps<{
  isOpen: boolean;
  article: Article | null;
  isBusy: boolean;
  message: string;
}>();

const emit = defineEmits<{
  close: [];
  next: [kind: SlideKind];
}>();

const DIM_AFTER_MS = 3000;

const startPoint = ref<{ x: number; y: number } | null>(null);
const isDimmed = ref(false);
let dimTimer: ReturnType<typeof setTimeout> | undefined;

function wake() {
  isDimmed.value = false;
  clearTimeout(dimTimer);
  if (props.isOpen) {
    dimTimer = setTimeout(() => { isDimmed.value = true; }, DIM_AFTER_MS);
  }
}

function onPointerDown(event: PointerEvent) {
  wake();
  startPoint.value = { x: event.clientX, y: event.clientY };
}

function onPointerUp(event: PointerEvent) {
  const start = startPoint.value;
  startPoint.value = null;
  if (!start || props.isBusy) {
    return;
  }
  const kind = swipeDirection(event.clientX - start.x, event.clientY - start.y);
  if (kind) {
    emit('next', kind);
  }
}

function onKeydown(event: KeyboardEvent) {
  if (!props.isOpen) {
    return;
  }
  wake();
  if (props.isBusy) {
    return;
  }
  if (event.key === 'ArrowLeft') {
    emit('next', 'safe');
  } else if (event.key === 'ArrowRight') {
    emit('next', 'nsfw');
  } else if (event.key === 'Escape') {
    emit('close');
  }
}

watch(() => [props.isOpen, props.article?.id], wake);

onMounted(() => window.addEventListener('keydown', onKeydown));
onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown);
  clearTimeout(dimTimer);
});
</script>

<style scoped>
.slideshow-modal {
  --width: 100%;
  --height: 100%;
  --background: var(--viewer-background);
}

.slideshow {
  position: relative;
  width: 100vw;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
  background: var(--viewer-background);
  color: var(--viewer-text);
  touch-action: pan-y;
  user-select: none;
}

.slideshow__image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: contain;
  animation: slide-in 0.25s ease-out;
}

.slideshow__top {
  position: absolute;
  top: calc(var(--space-md) + env(safe-area-inset-top));
  left: var(--space-md);
  right: var(--space-md);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.slideshow__close,
.slideshow__action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-width: 44px;
  min-height: 44px;
  padding: 0 16px;
  border: 0;
  border-radius: 999px;
  background: var(--viewer-overlay);
  color: var(--viewer-text);
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}

.slideshow__close {
  padding: 0;
  font-size: 24px;
}

.slideshow__action:disabled {
  opacity: 0.5;
}

.slideshow__close:focus-visible,
.slideshow__action:focus-visible {
  outline: 3px solid var(--color--focus-ring);
  outline-offset: 2px;
}

.slideshow__badge {
  padding: 4px 10px;
  border-radius: 999px;
  background: var(--color--red);
  color: var(--color--on-accent);
  font-size: 0.78rem;
  font-weight: 700;
}

.slideshow__message {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  margin: 0;
  padding: 8px 14px;
  border-radius: 8px;
  background: var(--viewer-overlay);
  font-size: 0.95rem;
}

.slideshow__bottom {
  position: absolute;
  right: var(--space-md);
  bottom: calc(var(--space-md) + env(safe-area-inset-bottom));
  left: var(--space-md);
  display: grid;
  gap: var(--space-sm);
  justify-items: center;
  text-align: center;
}

.slideshow__title {
  margin: 0;
  padding: 6px 12px;
  border-radius: 8px;
  background: var(--viewer-overlay);
  font-size: 0.95rem;
  font-weight: 600;
}

.slideshow__actions {
  display: flex;
  gap: var(--space-sm);
}

.slideshow__top,
.slideshow__bottom {
  transition: opacity 0.6s ease;
}

.slideshow__controls--dim {
  opacity: 0.2;
}

@keyframes slide-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@media (prefers-reduced-motion: reduce) {
  .slideshow__image {
    animation: none;
  }

  .slideshow__top,
  .slideshow__bottom {
    transition: none;
  }
}
</style>
