<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>
          <span class="title-row">
            <AppLogo />
            Random
          </span>
        </ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <ion-refresher slot="fixed" @ionRefresh="onRefresh">
        <ion-refresher-content pulling-text="Pull to refresh" refreshing-spinner="crescent" />
      </ion-refresher>
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">Random</ion-title>
        </ion-toolbar>
      </ion-header>

      <section class="page-section">
        <div class="random-header">
          <div>
            <p class="page-kicker">{{ randomArticles.length }} images</p>
            <ion-text v-if="error" color="danger">{{ error }}</ion-text>
            <ion-button v-if="error" size="small" fill="clear" @click="forceReload">
              Try again
            </ion-button>
          </div>
          <ion-button size="small" color="secondary" @click="refreshRandom">
            <ion-icon slot="start" :icon="shuffleOutline" />
            Refresh
          </ion-button>
        </div>
      </section>

      <section class="page-section nsfw-section">
        <ion-segment :value="nsfwFilter" @ionChange="onNsfwChange">
          <ion-segment-button value="show" title="Display all images regardless of content rating">
            <ion-label>All</ion-label>
          </ion-segment-button>
          <ion-segment-button value="hide" title="Filter out images flagged as Not Safe For Work (NSFW)">
            <ion-label>Safe</ion-label>
          </ion-segment-button>
          <ion-segment-button value="only" title="Show only images flagged as Not Safe For Work (NSFW)">
            <ion-label>NSFW</ion-label>
          </ion-segment-button>
        </ion-segment>
      </section>

      <ion-grid>
        <ion-row class="shuffle-row">
          <ion-col
            v-for="(article, index) in randomArticles"
            :key="`${article.id}-${shuffleKey}`"
            size="12"
            size-md="6"
            size-lg="6"
            :style="{ '--card-index': index }"
            class="random-card"
          >
            <router-link :to="`/tabs/tab1/${article.id}`" class="card-link">
              <ImageCard :article="article" />
            </router-link>
          </ion-col>

          <template v-if="loading && !articles.length">
            <ion-col
              v-for="index in 8"
              :key="`skeleton-${index}`"
              size="12"
              size-md="6"
              size-lg="6"
            >
              <div class="skeleton-item">
                <div class="skeleton-item__frame">
                  <ion-skeleton-text animated style="height: 100%; width: 100%; display: block" />
                </div>
                <div class="skeleton-item__caption">
                  <ion-skeleton-text animated style="width: 70%; height: 14px; display: block" />
                  <ion-skeleton-text animated style="width: 45%; height: 10px; display: block; margin-top: 6px" />
                </div>
              </div>
            </ion-col>
          </template>
        </ion-row>
      </ion-grid>

      <ion-loading :is-open="loading" message="Picking images…" />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButton,
  IonIcon,
  IonContent,
  IonGrid,
  IonRow,
  IonCol,

  IonSkeletonText,
  IonText,
  IonRefresher,
  IonRefresherContent,
  IonLoading,
  IonSegment,
  IonSegmentButton,
  IonLabel,
} from '@ionic/vue';
import { shuffleOutline } from 'ionicons/icons';
import ImageCard from '@/components/ImageCard.vue';
import AppLogo from '@/components/AppLogo.vue';
import { usePromptualData } from '@/composables/usePromptualData';
import type { PromptualArticle } from '@/services/promptualApi';

const { articles, loading, error, loadAll, forceReload } = usePromptualData();
const randomArticles = ref<PromptualArticle[]>([]);
const shuffleKey = ref(0);
const RANDOM_COUNT = 8;
const nsfwFilter = ref<'show' | 'hide' | 'only'>(localStorage.getItem('promptual:nsfwFilter') as 'show' | 'hide' | 'only' ?? 'hide');

function saveNsfwFilter(value: 'show' | 'hide' | 'only') {
  localStorage.setItem('promptual:nsfwFilter', value);
}

function shuffle(list: PromptualArticle[]) {
  const result = [...list];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function refreshRandom() {
  const source = articles.value.filter((article) => {
    if (nsfwFilter.value === 'hide' && article.nsfw) {
      return false;
    }
    if (nsfwFilter.value === 'only' && !article.nsfw) {
      return false;
    }
    return true;
  });
  if (!source.length) {
    randomArticles.value = [];
    return;
  }
  randomArticles.value = shuffle(source).slice(0, RANDOM_COUNT);
  shuffleKey.value += 1;
}

function onNsfwChange(event: CustomEvent) {
  const value = event.detail.value as 'show' | 'hide' | 'only';
  nsfwFilter.value = value;
  saveNsfwFilter(value);
  refreshRandom();
}

async function onRefresh(event: CustomEvent) {
  await forceReload();
  const target = event.target as { complete?: () => void };
  target.complete?.();
}

watch(
  articles,
  (value) => {
    if (value.length) {
      refreshRandom();
    }
  },
  { immediate: true }
);

onMounted(() => {
  loadAll();
});
</script>

<style scoped>
.page-section {
  padding: 20px 20px 10px;
}

.page-kicker {
  margin: 0;
  font-family: Lora, georgia, serif;
  font-weight: 700;
  font-size: clamp(1.8rem, 5vw, 3rem);
  line-height: 1.1;
  letter-spacing: -0.01em;
  color: var(--color--gray-5);
}

.random-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.card-link {
  text-decoration: none;
  display: block;
  height: 100%;
  animation: card-enter 0.35s ease-out both;
  animation-delay: calc(var(--card-index, 0) * 70ms);
}

.nsfw-section {
  padding-top: 0;
}

.skeleton-item {
  display: flex;
  flex-direction: column;
}

.skeleton-item__frame {
  aspect-ratio: 4 / 5;
  background: hsl(35, 10%, 91%);
  border: 1.5px solid var(--color--gray-90);
}

.skeleton-item__caption {
  padding: 8px 0 0;
  display: grid;
  gap: 6px;
}
</style>
