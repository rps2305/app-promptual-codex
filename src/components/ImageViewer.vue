<template>
  <ion-modal :is-open="isOpen" @ionModalDidDismiss="onDismiss" class="image-viewer-modal">
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button aria-label="Close image viewer" @click="onDismiss">
            <ion-icon slot="icon-only" aria-hidden="true" :icon="closeOutline" />
          </ion-button>
        </ion-buttons>
        <ion-title>Image Viewer</ion-title>
        <ion-buttons slot="end">
          <ion-button aria-label="Previous image" :disabled="!hasPrev" @click="emit('prev')">
            <ion-icon slot="icon-only" aria-hidden="true" :icon="chevronBackOutline" />
          </ion-button>
          <ion-button aria-label="Next image" :disabled="!hasNext" @click="emit('next')">
            <ion-icon slot="icon-only" aria-hidden="true" :icon="chevronForwardOutline" />
          </ion-button>
          <ion-button aria-label="Zoom out" @click="zoomOut" :disabled="zoomLevel <= 1">
            <ion-icon slot="icon-only" aria-hidden="true" :icon="removeOutline" />
          </ion-button>
          <ion-button aria-label="Zoom in" @click="zoomIn" :disabled="zoomLevel >= 5">
            <ion-icon slot="icon-only" aria-hidden="true" :icon="addOutline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true" class="image-viewer-content">
      <div
        class="image-viewer-container"
        @click="onContainerClick"
        @dblclick="resetZoom"
        @touchstart.passive="swipe.onTouchStart"
        @touchend="onContainerTouchEnd"
        @touchcancel="swipe.cancel"
      >
        <div
          class="image-viewer-image-wrapper"
          :style="transformStyle"
          @wheel="onWheel"
          @touchstart="onTouchStart"
          @touchmove="onTouchMove"
          @touchend="onTouchEnd"
        >
          <img
            v-if="imageUrl"
            :src="imageUrl"
            :alt="title"
            class="image-viewer-image"
            draggable="false"
          />
        </div>
      </div>

    </ion-content>
    <ion-footer class="image-viewer-footer">
      <div class="image-viewer-info">
        <ion-text class="image-title">{{ title }}</ion-text>
        <ion-button size="default" fill="solid" color="light" class="viewer-details" aria-label="Go to the details page" @click="emit('detail')">
          <ion-icon slot="start" aria-hidden="true" :icon="informationCircleOutline" />
          Go to details
        </ion-button>
      </div>
    </ion-footer>
  </ion-modal>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonButtons,
  IonButton,
  IonIcon,
  IonTitle,
  IonContent,
  IonFooter,
  IonText
} from '@ionic/vue';
import { createSwipeTracker } from '@/utils/swipe';
import {
  closeOutline,
  addOutline,
  removeOutline,
  chevronBackOutline,
  chevronForwardOutline,
  informationCircleOutline
} from 'ionicons/icons';

interface Props {
  isOpen: boolean;
  imageUrl: string | null;
  title: string;
  hasPrev?: boolean;
  hasNext?: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  close: [];
  prev: [];
  next: [];
  detail: [];
}>();

let swiped = false;
const swipe = createSwipeTracker((direction) => {
  if (direction === 'left' && props.hasNext) emit('next');
  if (direction === 'right' && props.hasPrev) emit('prev');
});

const zoomLevel = ref(1);
const minZoom = 1;
const maxZoom = 5;
const position = ref({ x: 0, y: 0 });
const isDragging = ref(false);
const lastTouchDistance = ref(0);
const lastTouchPoint = ref<{ x: number; y: number } | null>(null);

const transformStyle = computed(() => {
  return {
    transform: `translate(${position.value.x}px, ${position.value.y}px) scale(${zoomLevel.value})`,
    transition: isDragging.value ? 'none' : 'transform 0.2s ease-out'
  };
});

function zoomIn() {
  if (zoomLevel.value < maxZoom) {
    zoomLevel.value = Math.min(zoomLevel.value + 0.5, maxZoom);
    centerImage();
  }
}

function zoomOut() {
  if (zoomLevel.value > minZoom) {
    zoomLevel.value = Math.max(zoomLevel.value - 0.5, minZoom);
    centerImage();
  }
}

function toggleZoom() {
  if (zoomLevel.value > 1) {
    resetZoom();
  } else {
    zoomLevel.value = 3;
    centerImage();
  }
}

function resetZoom() {
  zoomLevel.value = 1;
  position.value = { x: 0, y: 0 };
}

function centerImage() {
  position.value = { x: 0, y: 0 };
}

function onWheel(event: WheelEvent) {
  event.preventDefault();
  const delta = event.deltaY > 0 ? -0.1 : 0.1;
  const newZoom = Math.max(minZoom, Math.min(maxZoom, zoomLevel.value + delta));

  if (newZoom !== zoomLevel.value) {
    zoomLevel.value = newZoom;
    centerImage();
  }
}

function getTouchDistance(touches: TouchList): number {
  if (touches.length < 2) return 0;
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

function onTouchStart(event: TouchEvent) {
  if (event.touches.length === 2) {
    lastTouchDistance.value = getTouchDistance(event.touches);
  } else if (event.touches.length === 1) {
    const touch = event.touches[0];
    lastTouchPoint.value = { x: touch.clientX, y: touch.clientY };
    isDragging.value = zoomLevel.value > 1;
  }
}

function onTouchMove(event: TouchEvent) {
  if (event.touches.length === 2) {
    const currentDistance = getTouchDistance(event.touches);
    const delta = (currentDistance - lastTouchDistance.value) / 100;
    const newZoom = Math.max(minZoom, Math.min(maxZoom, zoomLevel.value + delta));

    if (newZoom !== zoomLevel.value) {
      zoomLevel.value = newZoom;
      lastTouchDistance.value = currentDistance;
    }
  } else if (event.touches.length === 1 && isDragging.value && lastTouchPoint.value) {
    event.preventDefault();
    const touch = event.touches[0];
    const deltaX = touch.clientX - lastTouchPoint.value.x;
    const deltaY = touch.clientY - lastTouchPoint.value.y;
    position.value = {
      x: position.value.x + deltaX,
      y: position.value.y + deltaY
    };
    lastTouchPoint.value = { x: touch.clientX, y: touch.clientY };
  }
}

function onTouchEnd() {
  isDragging.value = false;
  lastTouchPoint.value = null;
  lastTouchDistance.value = 0;
}

function onContainerTouchEnd(event: TouchEvent) {
  if (zoomLevel.value > 1) {
    swipe.cancel();
    return;
  }
  if (swipe.onTouchEnd(event)) {
    swiped = true;
    // Stop the browser from turning the swipe into a click that toggles zoom.
    event.preventDefault();
  }
}

function onContainerClick() {
  if (swiped) {
    swiped = false;
    return;
  }
  toggleZoom();
}

function onDismiss() {
  emit('close');
  resetZoom();
}

function handleKeydown(event: KeyboardEvent) {
  if (!props.isOpen) return;

  switch (event.key) {
    case 'Escape':
      onDismiss();
      break;
    case 'ArrowLeft':
      if (props.hasPrev) emit('prev');
      break;
    case 'ArrowRight':
      if (props.hasNext) emit('next');
      break;
    case '+':
    case '=':
      zoomIn();
      break;
    case '-':
    case '_':
      zoomOut();
      break;
    case '0':
    case '1':
      resetZoom();
      break;
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
});

const propsWatch = props;
watch(
  () => propsWatch.imageUrl,
  () => resetZoom()
);
watch(
  () => propsWatch.isOpen,
  (isOpen) => {
    if (isOpen) {
      resetZoom();
    }
  }
);
</script>

<style scoped>
.image-viewer-modal {
  --width: 100%;
  --height: 100%;
}

.image-viewer-content {
  --background: var(--viewer-background);
}

.image-viewer-container {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  cursor: zoom-in;
  touch-action: none;
}

.image-viewer-image-wrapper {
  max-width: 100%;
  max-height: 100%;
  transition: transform 0.2s ease-out;
}

.image-viewer-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  user-select: none;
}

.image-viewer-footer {
  background: var(--viewer-background);
}

.image-viewer-info {
  background: var(--viewer-overlay);
  padding: 12px 20px calc(12px + env(safe-area-inset-bottom));
  text-align: center;
}

.image-title {
  display: block;
  font-size: 1rem;
  font-weight: 600;
  color: var(--viewer-text);
  margin-bottom: 8px;
}

.viewer-details {
  margin: 4px 0 0;
}
</style>
