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
        <div
          class="detail-hero__media"
          :style="heroStyle"
        >
          <ion-img v-if="article.imageUrl" :src="article.imageUrl" :alt="article.title" />
          <div v-else class="detail-hero__placeholder">Image unavailable</div>
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
            <ion-button size="small" fill="outline" @click="shareImage">
              <ion-icon slot="start" :icon="shareSocialOutline" />
              Share
            </ion-button>
            <ion-button v-if="!isIos" size="small" fill="solid" @click="saveToPhotos">
              <ion-icon slot="start" :icon="downloadOutline" />
              Save
            </ion-button>
            <ion-text v-else class="detail-ios-hint" color="medium">Save via Share</ion-text>
          </div>
        </div>
      </section>

      <section v-else class="detail-loading">
        <ion-skeleton-text animated style="height: 240px" />
        <ion-skeleton-text animated style="width: 60%" />
        <ion-skeleton-text animated style="width: 90%" />
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
  IonImg,
  IonBackButton,
  IonChip,
  IonSkeletonText,
  IonText,
  IonButton,
  IonLabel,
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
  padding: 16px 16px 0;
}

.detail-hero__media {
  border-radius: 20px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.6);
  aspect-ratio: 4 / 5;
}

.detail-hero__placeholder {
  display: grid;
  place-items: center;
  min-height: 240px;
  color: rgba(78, 63, 40, 0.65);
  font-weight: 600;
}

.detail-hero__meta {
  margin-top: 12px;
}

.detail-kicker {
  margin: 0 0 8px;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgba(52, 43, 30, 0.65);
}

.detail-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.detail-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.detail-tag-label {
  font-weight: 700;
  font-size: 0.85rem;
}

.detail-tags :deep(ion-chip) {
  --background: var(--color--primary-50);
  --color: #ffffff;
}

.detail-tags :deep(ion-chip[color='danger']) {
  --background: var(--color--red);
  --color: #ffffff;
}

.detail-section {
  padding: 8px 16px 0;
}

.detail-prompt-section,
.detail-meta-section {
  background: #ffffff;
  border-radius: 18px;
  padding: 16px 20px;
  margin: 8px 16px 0;
  box-shadow: 0 2px 8px rgba(18, 14, 8, 0.08);
}

.detail-section-title {
  font-family: Lora, georgia, serif;
  font-weight: 600;
  font-size: 1.125rem;
  margin: 0 0 12px;
  color: var(--color--gray-5);
}

.detail-prompt {
  white-space: pre-wrap;
  line-height: 1.6;
  color: var(--color--gray-5);
  margin: 0;
}

.detail-negative {
  margin-top: 12px;
  color: var(--color--red);
  font-size: 0.875rem;
}

.detail-metadata {
  display: grid;
  gap: 10px;
  margin: 0 0 16px;
}

.detail-meta-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--color--gray-95);
}

.detail-meta-row:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.detail-metadata dt {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color--gray-20);
  flex-shrink: 0;
}

.detail-metadata dd {
  margin: 0;
  font-size: 0.875rem;
  color: var(--color--gray-5);
  text-align: right;
  word-break: break-all;
}

.detail-ios-hint {
  font-size: 0.8125rem;
  display: inline-block;
  margin-top: 4px;
}

.detail-loading {
  padding: 16px;
  display: grid;
  gap: 12px;
}
</style>
