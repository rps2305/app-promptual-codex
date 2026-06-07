<template>
  <ion-page>
    <ion-header translucent>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/tabs/tab1" />
        </ion-buttons>
        <ion-title>
          <span class="title-row">
            <img class="title-logo" src="/promptual-logo.png" alt="" aria-hidden="true" />
            {{ article?.title ?? 'Artwork' }}
          </span>
        </ion-title>
        <ion-buttons slot="end">
          <ion-button aria-label="Search images and tags" @click="goToTags">
            <ion-icon slot="icon-only" aria-hidden="true" :icon="searchOutline" />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <ion-refresher slot="fixed" @ionRefresh="onRefresh">
        <ion-refresher-content pulling-text="Pull to refresh" refreshing-spinner="crescent" />
      </ion-refresher>
      <section class="detail-hero" v-if="article">
        <div
          class="detail-hero__media"
          :style="heroStyle"
          role="button"
          tabindex="0"
          aria-label="Open image viewer"
          @click="openImageViewer"
          @keyup.enter="openImageViewer"
          @keyup.space.prevent="openImageViewer"
        >
          <ion-img v-if="article.imageUrl" :src="article.imageUrl" :alt="article.title" />
          <div v-else class="detail-hero__placeholder">No image</div>
        </div>
        <div class="detail-hero__meta">
          <p class="detail-kicker">{{ formattedDate }}</p>
          <div class="detail-tags">
            <ion-chip v-if="article.nsfw" color="danger">
              <ion-label class="detail-tag-label">NSFW</ion-label>
            </ion-chip>
            <ion-chip v-for="tag in article.tags" :key="tag.id">
              <ion-label class="detail-tag-label">{{ tag.name }}</ion-label>
            </ion-chip>
          </div>
          <div class="detail-actions">
            <ion-button size="small" fill="outline" @click="toggleFavorite">
              <ion-icon slot="start" aria-hidden="true" :icon="article.isFavorite ? heart : heartOutline" />
              {{ article.isFavorite ? 'Saved' : 'Save' }}
            </ion-button>
            <ion-button size="small" fill="outline" @click="shareImage">
              <ion-icon slot="start" aria-hidden="true" :icon="shareSocialOutline" />
              Share
            </ion-button>
            <ion-button v-if="!isIos" size="small" fill="solid" @click="saveToPhotos">
              <ion-icon slot="start" aria-hidden="true" :icon="downloadOutline" />
              Save image
            </ion-button>
          </div>
        </div>
      </section>

      <section v-else-if="loading" class="detail-loading">
        <ion-skeleton-text animated style="height: 240px" />
        <ion-skeleton-text animated style="width: 60%" />
        <ion-skeleton-text animated style="width: 90%" />
      </section>

      <section v-if="article" class="detail-section">
        <ion-card>
          <ion-card-header>
            <ion-card-title>Prompt</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <p class="detail-prompt">{{ article.prompt || 'No prompt provided.' }}</p>
            <p v-if="article.negativePrompt" class="detail-negative">
              <strong>Negative prompt:</strong> {{ article.negativePrompt }}
            </p>
          </ion-card-content>
        </ion-card>
      </section>

      <section v-if="article" class="detail-section">
        <ion-card>
          <ion-card-header>
            <ion-card-title>Generation details</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <dl class="detail-metadata">
              <div>
                <dt>Model</dt>
                <dd>{{ article.model?.name ?? 'Unknown' }}</dd>
              </div>
              <div>
                <dt>Resolution</dt>
                <dd>
                  {{ article.imageWidth && article.imageHeight ? `${article.imageWidth} × ${article.imageHeight}` : 'Unknown' }}
                </dd>
              </div>
              <div>
                <dt>Steps</dt>
                <dd>{{ article.steps ?? 'Unknown' }}</dd>
              </div>
              <div>
                <dt>Guidance</dt>
                <dd>{{ article.guidanceScale ?? 'Unknown' }}</dd>
              </div>
              <div>
                <dt>Seed</dt>
                <dd>{{ article.seed ?? 'Unknown' }}</dd>
              </div>
            </dl>
            <ion-button v-if="article.path" size="small" fill="outline" :href="article.path" target="_blank" rel="noopener">
              View on Promptual
            </ion-button>
          </ion-card-content>
        </ion-card>
      </section>

      <ErrorState
        v-if="error && !loading"
        :error="error"
        title="Artwork did not load"
        message="This image may be unavailable, or the connection may have dropped."
        :on-retry="fetchArticle"
        :on-back="goToGallery"
      />

      <ion-toast :is-open="toastOpen" :message="toastMessage" duration="2000" @didDismiss="toastOpen = false" />
    </ion-content>

    <ImageViewer
      :is-open="imageViewerOpen"
      :image-url="article?.imageUrl || null"
      :title="article?.title || ''"
      :prompt="article?.prompt || ''"
      @close="closeImageViewer"
    />
  </ion-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonImg,
  IonButtons,
  IonBackButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonChip,
  IonLabel,
  IonSkeletonText,
  IonButton,
  IonIcon,
  IonRefresher,
  IonRefresherContent,
  IonToast,
} from '@ionic/vue';
import { Capacitor, CapacitorHttp } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Media } from '@capacitor-community/media';
import { downloadOutline, searchOutline, shareSocialOutline, heart, heartOutline } from 'ionicons/icons';
import ImageViewer from '@/components/ImageViewer.vue';
import ErrorState from '@/components/ErrorState.vue';
import { useArticlesStore } from '@/stores/articles';

const route = useRoute();
const router = useRouter();
const articlesStore = useArticlesStore();

const articleId = computed(() => route.params.id as string);
const article = computed(() => articlesStore.favoritedArticles.find((item) => item.id === articleId.value));
const loading = ref(false);
const error = ref<string | null>(null);
const actionMessage = ref('');
const toastMessage = computed(() => actionMessage.value);
const toastOpen = ref(false);
const imageViewerOpen = ref(false);
const isIos = computed(() => Capacitor.getPlatform() === 'ios');
const isAndroid = computed(() => Capacitor.getPlatform() === 'android');

const formattedDate = computed(() => {
  if (!article.value?.created) {
    return '';
  }
  return new Date(article.value.created).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
});

const heroStyle = computed(() => {
  if (!article.value?.imageWidth || !article.value?.imageHeight) {
    return undefined;
  }
  return { aspectRatio: `${article.value.imageWidth} / ${article.value.imageHeight}` };
});

function showToast(message: string) {
  actionMessage.value = message;
  toastOpen.value = true;
}

async function fetchArticle() {
  loading.value = true;
  error.value = null;

  try {
    await articlesStore.loadArticle(articleId.value);
    if (!article.value) {
      error.value = 'Artwork not found';
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Artwork did not load';
  } finally {
    loading.value = false;
  }
}

function openImageViewer() {
  if (article.value?.imageUrl) {
    imageViewerOpen.value = true;
  }
}

function closeImageViewer() {
  imageViewerOpen.value = false;
}

function toggleFavorite() {
  if (article.value) {
    articlesStore.toggleFavorite(article.value.id);
    showToast(article.value.isFavorite ? 'Removed from favorites' : 'Added to favorites');
  }
}

async function fetchImageData() {
  if (!article.value?.imageUrl) {
    throw new Error('No image available.');
  }
  if (Capacitor.isNativePlatform()) {
    const response = await CapacitorHttp.request({
      url: article.value.imageUrl,
      method: 'GET',
      responseType: 'blob',
    });
    if (response.status < 200 || response.status >= 300) {
      throw new Error('Failed to download image.');
    }
    const contentTypeHeader = Object.entries(response.headers ?? {}).find(
      ([key]) => key.toLowerCase() === 'content-type'
    );
    const mimeType = contentTypeHeader ? String(contentTypeHeader[1]) : 'image/jpeg';
    const dataUrl = `data:${mimeType};base64,${String(response.data ?? '')}`;
    return { dataUrl };
  }
  const response = await fetch(article.value.imageUrl);
  if (!response.ok) {
    throw new Error('Failed to download image.');
  }
  const blob = await response.blob();
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Failed to read image.'));
    reader.readAsDataURL(blob);
  });
  return { dataUrl };
}

async function shareImage() {
  if (!article.value) {
    return;
  }

  try {
    if (Capacitor.isNativePlatform()) {
      const { dataUrl } = await fetchImageData();
      const base64 = dataUrl.split(',')[1] ?? '';
      const fileName = `promptual-${article.value.id}.jpg`;
      await Filesystem.writeFile({
        path: fileName,
        data: base64,
        directory: Directory.Cache,
      });
      const uri = (await Filesystem.getUri({ directory: Directory.Cache, path: fileName })).uri;
      await Share.share({
        title: article.value.title,
        text: article.value.prompt ? article.value.prompt.slice(0, 140) : 'Promptual artwork',
        files: [uri],
      });
    } else if (navigator.share) {
      await navigator.share({
        title: article.value.title,
        text: article.value.prompt ? article.value.prompt.slice(0, 140) : 'Promptual artwork',
        url: article.value.imageUrl ?? article.value.path ?? window.location.href,
      });
    } else if (article.value.imageUrl) {
      window.open(article.value.imageUrl, '_blank');
    }
    showToast('Ready to share.');
  } catch (err) {
    showToast(err instanceof Error ? err.message : 'Share failed.');
  }
}

async function saveToPhotos() {
  if (!article.value?.imageUrl) {
    showToast('No image available.');
    return;
  }
  try {
    if (Capacitor.isNativePlatform()) {
      let albumIdentifier: string | undefined;
      if (isAndroid.value) {
        const albumName = 'Promptual';
        const { albums } = await Media.getAlbums();
        const existing = albums.find((album) => album.name === albumName);
        if (!existing) {
          await Media.createAlbum({ name: albumName });
          const refreshed = await Media.getAlbums();
          albumIdentifier = refreshed.albums.find((album) => album.name === albumName)?.identifier;
        } else {
          albumIdentifier = existing.identifier;
        }
      }
      await Media.savePhoto({
        path: article.value.imageUrl,
        albumIdentifier,
        fileName: `promptual-${article.value.id}`,
      });
      showToast('Saved to Photos.');
      return;
    }
    const link = document.createElement('a');
    link.href = article.value.imageUrl;
    link.download = `${article.value.title}.png`;
    link.click();
    showToast('Download started.');
  } catch (err) {
    showToast(err instanceof Error ? err.message : 'Save failed.');
  }
}

function goToTags() {
  router.push({ path: '/tabs/tab2', query: { focus: 'search' } });
}

function goToGallery() {
  router.push('/tabs/tab1');
}

async function onRefresh(event: CustomEvent) {
  await fetchArticle();
  const target = event.target as { complete?: () => void };
  target.complete?.();
}

onMounted(() => {
  fetchArticle();
});
</script>

<style scoped>
.detail-hero {
  width: 100%;
  max-width: 900px;
  margin-inline: auto;
  padding: var(--space-md) var(--page-gutter) 0;
  box-sizing: border-box;
}

.detail-hero__media {
  border-radius: 12px;
  overflow: hidden;
  background: var(--surface-muted);
  aspect-ratio: 4 / 5;
  cursor: zoom-in;
  border: 1px solid var(--border-subtle);
  outline: none;
}

.detail-hero__media:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--ion-color-primary) 30%, transparent);
}

.detail-hero__placeholder {
  display: grid;
  place-items: center;
  min-height: 240px;
  color: var(--text-muted);
  font-weight: 600;
}

.detail-hero__meta {
  margin-top: var(--space-md);
}

.detail-kicker {
  margin: 0 0 var(--space-xs);
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0;
  color: var(--text-soft);
}

.detail-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
  margin-bottom: var(--space-sm);
}

.detail-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
  margin-top: var(--space-sm);
}

.detail-actions ion-button {
  min-height: 44px;
  margin: 0;
}

.detail-tag-label {
  font-weight: 700;
  font-size: 0.85rem;
}

.detail-tags :deep(ion-chip) {
  --background: var(--surface-muted);
  --color: var(--text-muted);
  min-height: 28px;
  margin: 0;
  border: 1px solid var(--border-subtle);
}

.detail-tags :deep(ion-chip[color='danger']) {
  --background: var(--color--red);
  --color: var(--color--on-accent);
}

.detail-section {
  width: 100%;
  max-width: 900px;
  margin-inline: auto;
  padding: var(--space-sm) var(--page-gutter) 0;
  box-sizing: border-box;
}

.detail-section ion-card {
  margin: 0;
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  box-shadow: var(--shadow-sm);
}

.detail-section :deep(ion-card-title) {
  font-family: Lora, georgia, serif;
  font-size: 1.12rem;
  line-height: 1.25;
}

.detail-prompt {
  white-space: pre-wrap;
  line-height: 1.55;
  color: var(--color--gray-5);
}

.detail-negative {
  margin-top: var(--space-sm);
  color: color-mix(in srgb, var(--color--red) 72%, var(--color--gray-5));
}

.detail-metadata {
  display: grid;
  gap: var(--space-sm);
  margin: 0 0 var(--space-md);
}

.detail-metadata div {
  display: grid;
  grid-template-columns: minmax(7rem, auto) minmax(0, 1fr);
  align-items: start;
  gap: 12px;
}

.detail-metadata dt {
  font-weight: 600;
  color: var(--text-muted);
}

.detail-metadata dd {
  margin: 0;
  color: var(--color--gray-5);
  text-align: right;
  overflow-wrap: anywhere;
}

@media (max-width: 480px) {
  .detail-metadata div {
    grid-template-columns: 1fr;
    gap: var(--space-2xs);
  }

  .detail-metadata dd {
    text-align: start;
  }
}

.detail-loading {
  width: 100%;
  max-width: 900px;
  margin-inline: auto;
  padding: var(--space-md) var(--page-gutter);
  display: grid;
  gap: var(--space-sm);
  box-sizing: border-box;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.title-logo {
  height: 32px;
  width: 32px;
}
</style>
