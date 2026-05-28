<template>
  <ion-page>
    <ion-header translucent>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/tabs/tab1" />
        </ion-buttons>
        <ion-title>
          <span class="title-row">
            <AppLogo />
            {{ article?.title ?? 'Artwork' }}
          </span>
        </ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">{{ article?.title ?? 'Artwork' }}</ion-title>
        </ion-toolbar>
      </ion-header>
      <ion-refresher slot="fixed" @ionRefresh="onRefresh">
        <ion-refresher-content pulling-text="Pull to refresh" refreshing-spinner="crescent" />
      </ion-refresher>
      <section class="detail-hero" v-if="article">
        <div class="detail-hero__media" :style="heroStyle">
          <img v-if="article.imageUrl" :src="article.imageUrl" :alt="article.title" />
          <div v-else class="detail-hero__placeholder">Image unavailable</div>
          <div class="detail-hero__overlay">
            <h1 class="detail-hero__title">{{ article.title }}</h1>
          </div>
        </div>
        <div class="detail-hero__bar">
          <div class="detail-hero__tags">
            <span v-if="article.nsfw" class="detail-hero__tag detail-hero__tag--nsfw">NSFW</span>
            <span v-for="tag in article.tags" :key="tag.id" class="detail-hero__tag">{{ tag.name }}</span>
          </div>
          <p class="detail-hero__date">{{ formattedDate }}</p>
          <div class="detail-hero__actions">
            <button class="detail-hero__action" @click="shareImage">
              <ion-icon :icon="shareSocialOutline" />
              Share
            </button>
            <button v-if="!isIos" class="detail-hero__action detail-hero__action--primary" @click="saveToPhotos">
              <ion-icon :icon="downloadOutline" />
              Save
            </button>
            <span v-else class="detail-ios-hint">Save via Share</span>
          </div>
        </div>
      </section>

      <section v-else class="detail-loading">
        <div class="skeleton-item">
          <div class="skeleton-item__frame">
            <ion-skeleton-text animated style="height: 100%; width: 100%; display: block" />
          </div>
          <div class="skeleton-item__caption">
            <ion-skeleton-text animated style="width: 75%; height: 22px; display: block" />
            <ion-skeleton-text animated style="width: 50%; height: 14px; display: block" />
            <ion-skeleton-text animated style="width: 90%; height: 14px; display: block" />
          </div>
        </div>
      </section>

      <section v-if="article" class="detail-section detail-prompt-section">
        <h3 class="detail-section-title">Full Prompt</h3>
        <p class="detail-prompt">{{ article.prompt || 'No prompt' }}</p>
        <p v-if="article.negativePrompt" class="detail-negative">
          <strong>Negative prompt:</strong> {{ article.negativePrompt }}
        </p>
      </section>

      <section v-if="article" class="detail-section detail-meta-section">
        <h3 class="detail-section-title">Metadata</h3>
        <dl class="detail-metadata">
          <div class="detail-meta-row">
            <dt>Model</dt>
            <dd>{{ article.model?.name ?? 'Unknown' }}</dd>
          </div>
          <div class="detail-meta-row">
            <dt>Resolution</dt>
            <dd>
              {{ article.imageWidth && article.imageHeight ? `${article.imageWidth} × ${article.imageHeight}` : 'Unknown' }}
            </dd>
          </div>
          <div class="detail-meta-row">
            <dt>Steps</dt>
            <dd>{{ article.steps ?? 'Unknown' }}</dd>
          </div>
          <div class="detail-meta-row">
            <dt>CFG Scale</dt>
            <dd>{{ article.guidanceScale ?? 'Unknown' }}</dd>
          </div>
          <div class="detail-meta-row">
            <dt>Seed</dt>
            <dd>{{ article.seed ?? 'Unknown' }}</dd>
          </div>
        </dl>
        <ion-button v-if="article.path" size="small" fill="outline" :href="article.path" target="_blank" rel="noopener">
          View original post
        </ion-button>
      </section>

      <section v-if="error" class="detail-section">
        <ion-text color="danger">{{ error }}</ion-text>
      </section>

      <ion-loading :is-open="loading" message="Loading image…" />
      <ion-toast :is-open="toastOpen" :message="toastMessage" duration="2000" @didDismiss="toastOpen = false" />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonBackButton,
  IonSkeletonText,
  IonText,
  IonButton,
  IonIcon,
  IonRefresher,
  IonRefresherContent,
  IonLoading,
  IonToast,
} from '@ionic/vue';
import { Capacitor, CapacitorHttp } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Media } from '@capacitor-community/media';
import { downloadOutline, shareSocialOutline } from 'ionicons/icons';
import { usePromptualData } from '@/composables/usePromptualData';
import AppLogo from '@/components/AppLogo.vue';

const route = useRoute();
const { articles, error, loadAll, forceReload, loading } = usePromptualData();
const articleId = computed(() => route.params.id as string);
const article = computed(() => articles.value.find((item) => item.id === articleId.value));
const actionMessage = ref('');
const toastMessage = computed(() => actionMessage.value);
const toastOpen = ref(false);
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

async function fetchImageData() {
  if (!article.value?.imageUrl) {
    throw new Error('No image to share.');
  }
  if (Capacitor.isNativePlatform()) {
    const response = await CapacitorHttp.request({
      url: article.value.imageUrl,
      method: 'GET',
      responseType: 'blob',
    });
    if (response.status < 200 || response.status >= 300) {
      throw new Error('Could not download the image.');
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
    throw new Error('Could not download the image.');
  }
  const blob = await response.blob();
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Could not read the image.'));
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
    showToast('Shared successfully');
  } catch (err) {
    showToast(err instanceof Error ? err.message : 'Could not share this image.');
  }
}

async function saveToPhotos() {
  if (!article.value?.imageUrl) {
    showToast('No image to save');
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
      showToast('Saved to Photos');
      return;
    }
    const link = document.createElement('a');
    link.href = article.value.imageUrl;
    link.download = `${article.value.title}.png`;
    link.click();
    showToast('Download started');
  } catch (err) {
    showToast(err instanceof Error ? err.message : 'Could not save this image.');
  }
}

async function onRefresh(event: CustomEvent) {
  await forceReload();
  const target = event.target as { complete?: () => void };
  target.complete?.();
}

onMounted(() => {
  loadAll();
});
</script>

<style scoped>
.detail-hero {
  display: flex;
  flex-direction: column;
}

.detail-hero__media {
  position: relative;
  overflow: hidden;
  background: hsl(40, 10%, 88%);
  animation: hero-reveal 0.6s var(--ease-out-expo) both;
}

.detail-hero__placeholder {
  display: grid;
  place-items: center;
  min-height: 280px;
  color: var(--color--gray-45);
  font-weight: 600;
}

.detail-hero__overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 40px 20px 24px;
  background: linear-gradient(
    to top,
    hsla(35, 20%, 5%, 0.7) 0%,
    hsla(35, 20%, 5%, 0.2) 40%,
    transparent 70%
  );
  pointer-events: none;
}

.detail-hero__title {
  font-family: Lora, georgia, serif;
  font-weight: 700;
  font-size: clamp(1.4rem, 4vw, 2.2rem);
  line-height: 1.2;
  color: #fff;
  margin: 0;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.detail-hero__bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border-bottom: 1px solid var(--color--gray-95);
}

.detail-hero__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.detail-hero__tag {
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color--gray-20);
  background: hsl(35, 10%, 90%);
  padding: 2px 7px;
  border-radius: 3px;
}

.detail-hero__tag--nsfw {
  background: var(--color--red);
  color: #fff;
}

.detail-hero__date {
  font-size: 0.75rem;
  color: var(--color--gray-45);
  margin: 0;
  margin-left: auto;
}

.detail-hero__actions {
  display: flex;
  gap: 6px;
  width: 100%;
  margin-top: 4px;
}

.detail-hero__action {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color--gray-20);
  background: hsl(35, 10%, 92%);
  border: none;
  border-radius: 6px;
  padding: 6px 12px;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.2s ease;
}

.detail-hero__action:hover {
  background: hsl(35, 10%, 86%);
}

.detail-hero__action--primary {
  background: var(--color--terracotta);
  color: #fff;
}

.detail-hero__action--primary:hover {
  background: var(--color--terracotta-light);
}

.detail-ios-hint {
  font-size: 0.75rem;
  color: var(--color--gray-45);
  display: inline-flex;
  align-items: center;
}

.detail-section {
  padding: 0 20px 20px;
}

.detail-prompt-section,
.detail-meta-section {
  background: hsl(40, 12%, 97%);
  border-radius: 12px;
  padding: 20px 24px;
  margin: 0;
}

.detail-section-title {
  font-family: Lora, georgia, serif;
  font-weight: 700;
  font-size: 1.1rem;
  margin: 0 0 16px;
  color: var(--color--gray-5);
  letter-spacing: -0.01em;
  padding-bottom: 12px;
  border-bottom: 2px solid var(--color--gray-90);
}

.detail-prompt {
  white-space: pre-wrap;
  line-height: 1.7;
  color: var(--color--gray-20);
  margin: 0;
  font-size: 0.925rem;
}

.detail-negative {
  margin-top: 14px;
  color: var(--color--red);
  font-size: 0.85rem;
  line-height: 1.5;
}

.detail-metadata {
  display: grid;
  gap: 0;
  margin: 0;
}

.detail-meta-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid var(--color--gray-95);
}

.detail-meta-row:last-child {
  border-bottom: none;
}

.detail-metadata dt {
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color--gray-45);
  flex-shrink: 0;
}

.detail-metadata dd {
  margin: 0;
  font-size: 0.875rem;
  color: var(--color--gray-5);
  text-align: right;
  font-family: Lora, georgia, serif;
  word-break: break-all;
}

.detail-loading {
  padding: 0;
  display: grid;
  gap: 0;
}

.detail-loading .skeleton-item {
  display: flex;
  flex-direction: column;
}

.detail-loading .skeleton-item__frame {
  aspect-ratio: auto;
  height: 320px;
  background: hsl(35, 10%, 91%);
  border: none;
}

.detail-loading .skeleton-item__caption {
  padding: 20px;
  display: grid;
  gap: 10px;
}
</style>
