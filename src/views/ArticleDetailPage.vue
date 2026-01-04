<template>
  <ion-page>
    <ion-header translucent>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/tabs/tab1" />
        </ion-buttons>
        <ion-title>
          <span class="title-row">
            <img class="title-logo" src="/promptual-logo.png" alt="Promptual logo" />
            {{ article?.title ?? 'Artwork' }}
          </span>
        </ion-title>
        <ion-buttons slot="end">
          <ion-button @click="goToTags">
            <ion-icon slot="icon-only" :icon="searchOutline" />
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
            <ion-button size="small" fill="outline" @click="shareImage">
              <ion-icon slot="start" :icon="shareSocialOutline" />
              Share
            </ion-button>
            <ion-button v-if="!isIos" size="small" fill="solid" @click="saveToPhotos">
              <ion-icon slot="start" :icon="downloadOutline" />
              Save
            </ion-button>
          </div>
        </div>
      </section>

      <section v-else class="detail-loading">
        <ion-skeleton-text animated style="height: 240px" />
        <ion-skeleton-text animated style="width: 60%" />
        <ion-skeleton-text animated style="width: 90%" />
      </section>

      <section v-if="article" class="detail-section">
        <ion-card>
          <ion-card-header>
            <ion-card-title>Full Prompt</ion-card-title>
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
            <ion-card-title>Metadata</ion-card-title>
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

      <section v-if="error" class="detail-section">
        <ion-text color="danger">{{ error }}</ion-text>
      </section>

      <ion-loading :is-open="loading" message="Loading artwork..." />
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
  IonButtons,
  IonBackButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonChip,
  IonSkeletonText,
  IonText,
  IonButton,
  IonLabel,
  IonRefresher,
  IonRefresherContent,
  IonLoading,
  IonToast,
  IonIcon,
} from '@ionic/vue';
import { Capacitor, CapacitorHttp } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Media } from '@capacitor-community/media';
import { downloadOutline, searchOutline, shareSocialOutline } from 'ionicons/icons';
import { usePromptualData } from '@/composables/usePromptualData';
import { useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
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

.detail-prompt {
  white-space: pre-wrap;
  line-height: 1.5;
  color: rgba(32, 24, 14, 0.9);
}

.detail-negative {
  margin-top: 12px;
  color: rgba(82, 26, 26, 0.8);
}

.detail-metadata {
  display: grid;
  gap: 12px;
  margin: 0 0 16px;
}

.detail-metadata div {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.detail-metadata dt {
  font-weight: 600;
  color: rgba(43, 29, 12, 0.8);
}

.detail-metadata dd {
  margin: 0;
  color: rgba(43, 29, 12, 0.9);
}

.detail-loading {
  padding: 16px;
  display: grid;
  gap: 12px;
}
</style>
