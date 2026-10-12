<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>
          <span class="title-row">
            <img class="title-logo" src="/promptual-logo.png" alt="" aria-hidden="true" />
            Slide show
          </span>
        </ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <section class="page-intro">
        <div>
          <p class="page-eyebrow">Slide show</p>
          <h1 class="page-heading">Swipe through random images</h1>
          <p class="page-copy">Open an image full screen, then swipe to keep going.</p>
        </div>
      </section>

      <section class="section-pad slideshow-guide" aria-labelledby="slideshow-how">
        <h2 id="slideshow-how" class="slideshow-guide__title">How it works</h2>
        <ol class="slideshow-guide__steps">
          <li>Tap the image below to open it full screen.</li>
          <li><strong>Swipe left</strong> for another random safe image.</li>
          <li><strong>Swipe right</strong> for a random NSFW image. Only swipe right if you want to see adult content.</li>
        </ol>
        <p class="slideshow-guide__note">
          On a computer, use the left and right arrow keys or the buttons. Escape closes the slide show.
        </p>
      </section>

      <section class="section-pad slideshow-preview">
        <button
          v-if="current"
          type="button"
          class="slideshow-preview__button"
          :aria-label="`Open ${current.title} full screen`"
          @click="openViewer"
        >
          <img :src="current.imageUrl ?? ''" :alt="current.title" />
        </button>
        <ErrorState
          v-else-if="loadFailed"
          title="No image loaded"
          message="Check your connection, then try again."
          retry-label="Try again"
          :on-retry="() => showNext('safe')"
        />
        <div v-else class="slideshow-preview__loading" role="status">Finding an image…</div>

        <ion-button v-if="current" expand="block" class="slideshow-preview__start" @click="openViewer">
          <ion-icon slot="start" aria-hidden="true" :icon="expandOutline" />
          Open full screen
        </ion-button>
      </section>

      <SlideshowViewer
        :is-open="isViewerOpen"
        :article="current"
        :is-busy="isBusy"
        :message="message"
        @close="isViewerOpen = false"
        @next="showNext"
      />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonIcon } from '@ionic/vue';
import { expandOutline } from 'ionicons/icons';
import ErrorState from '@/components/ErrorState.vue';
import SlideshowViewer from '@/components/SlideshowViewer.vue';
import { createSlideshowQueues, type SlideKind } from '@/composables/useSlideshow';
import { useArticlesStore } from '@/stores/articles';
import type { Article } from '@/types';

const SAMPLE_SIZE = 40;

const store = useArticlesStore();
const queues = createSlideshowQueues(() => store.loadRandom(SAMPLE_SIZE));

const current = ref<Article | null>(null);
const isViewerOpen = ref(false);
const isBusy = ref(false);
const loadFailed = ref(false);
const message = ref('');

async function showNext(kind: SlideKind = 'safe') {
  if (isBusy.value) {
    return;
  }
  isBusy.value = true;
  message.value = '';
  try {
    const article = await queues.next(kind);
    if (article) {
      current.value = article;
      loadFailed.value = false;
    } else if (current.value) {
      message.value = kind === 'nsfw' ? 'No NSFW image found. Try again.' : 'No image found. Try again.';
    } else {
      loadFailed.value = true;
    }
  } catch {
    if (current.value) {
      message.value = 'Could not load an image. Try again.';
    } else {
      loadFailed.value = true;
    }
  } finally {
    isBusy.value = false;
  }
}

function openViewer() {
  isViewerOpen.value = true;
}

onMounted(() => showNext('safe'));
</script>

<style scoped>
.title-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.slideshow-guide {
  padding-top: 0;
  padding-bottom: var(--space-md);
}

.slideshow-guide__title {
  margin: 0 0 var(--space-xs);
  font-size: 1rem;
}

.slideshow-guide__steps {
  margin: 0;
  padding-left: 1.25rem;
  line-height: 1.5;
}

.slideshow-guide__note {
  margin: var(--space-sm) 0 0;
  color: var(--text-muted);
  font-size: 0.9rem;
}

.slideshow-preview {
  padding-top: 0;
  padding-bottom: calc(var(--space-xl) + 64px);
}

.slideshow-preview__button {
  display: block;
  width: 100%;
  margin: 0;
  padding: 0;
  border: 0;
  background: none;
  cursor: pointer;
}

.slideshow-preview__button img {
  display: block;
  width: 100%;
  max-height: 60vh;
  object-fit: contain;
  border-radius: 10px;
  background: var(--surface-muted);
}

.slideshow-preview__button:focus-visible {
  outline: 3px solid var(--color--focus-ring);
  outline-offset: 4px;
}

.slideshow-preview__loading {
  display: grid;
  place-items: center;
  min-height: 200px;
  color: var(--text-muted);
}

.slideshow-preview__start {
  margin: var(--space-md) 0 0;
}
</style>
