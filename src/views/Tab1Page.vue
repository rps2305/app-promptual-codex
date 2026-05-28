<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>
          <span class="title-row">
            <AppLogo />
            Gallery
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
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">
            <span class="title-row">
              <AppLogo />
              Promptual Gallery
            </span>
          </ion-title>
        </ion-toolbar>
      </ion-header>

      <section class="page-section">
        <p class="page-kicker">{{ filteredArticles.length }} images</p>
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
        <ion-text v-if="error" color="danger">{{ error }}</ion-text>
        <ion-button v-if="error" size="small" fill="clear" @click="forceReload">
          Retry
        </ion-button>
      </section>

      <ion-grid>
        <ion-row>
          <ion-col
            v-for="article in visibleArticles"
            :key="article.id"
            size="12"
            size-md="6"
            size-lg="4"
          >
            <router-link :to="`/tabs/tab1/${article.id}`" class="card-link">
              <ImageCard :article="article" :show-prompt="false" />
            </router-link>
          </ion-col>

          <template v-if="loading && !articles.length">
            <ion-col
              v-for="index in 6"
              :key="`skeleton-${index}`"
              size="12"
              size-md="6"
              size-lg="4"
            >
              <ion-card class="image-card">
                <ion-skeleton-text animated style="height: 220px" />
                <ion-card-header>
                  <ion-skeleton-text animated style="width: 80%" />
                  <ion-skeleton-text animated style="width: 60%" />
                </ion-card-header>
              </ion-card>
            </ion-col>
          </template>

          <ion-col v-if="!loading && filteredArticles.length === 0" size="12">
            <div class="empty-state">
              <ion-text color="medium">
                <p class="empty-text">No results found.</p>
                <p class="empty-hint">Try adjusting the NSFW filter to see more images.</p>
              </ion-text>
            </div>
          </ion-col>
        </ion-row>
      </ion-grid>

      <ion-infinite-scroll v-if="canLoadMore" @ionInfinite="onInfinite">
        <ion-infinite-scroll-content loading-text="Loading more art..." />
      </ion-infinite-scroll>

      <ion-loading :is-open="loading" message="Loading gallery..." />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  IonCard,
  IonCardHeader,
  IonSkeletonText,
  IonText,
  IonRefresher,
  IonRefresherContent,
  IonLoading,
  IonSegment,
  IonSegmentButton,
  IonLabel,
} from '@ionic/vue';
import { RouterLink, useRouter } from 'vue-router';
import { searchOutline } from 'ionicons/icons';
import ImageCard from '@/components/ImageCard.vue';
import AppLogo from '@/components/AppLogo.vue';
import { usePromptualData } from '@/composables/usePromptualData';

const { articles, loading, error, loadAll, forceReload } = usePromptualData();
const router = useRouter();
const visibleCount = ref(12);
const nsfwFilter = ref<'show' | 'hide' | 'only'>('show');

const filteredArticles = computed(() => {
  const nsfwMode = nsfwFilter.value;
  return nsfwMode === 'show'
    ? articles.value
    : articles.value.filter((a) => nsfwMode === 'hide' ? !a.nsfw : a.nsfw);
});

const visibleArticles = computed(() => filteredArticles.value.slice(0, visibleCount.value));
const canLoadMore = computed(() => visibleCount.value < filteredArticles.value.length);

function onNsfwChange(event: CustomEvent) {
  nsfwFilter.value = event.detail.value as 'show' | 'hide' | 'only';
  visibleCount.value = 12;
}

function onInfinite(event: CustomEvent) {
  visibleCount.value = Math.min(visibleCount.value + 12, filteredArticles.value.length);
  const target = event.target as { complete?: () => void };
  target.complete?.();
}

async function onRefresh(event: CustomEvent) {
  await forceReload();
  const target = event.target as { complete?: () => void };
  target.complete?.();
}

function goToTags() {
  router.push({ path: '/tabs/tab2', query: { focus: 'search' } });
}

watch(articles, () => {
  visibleCount.value = Math.min(visibleCount.value, articles.value.length || 12);
});

onMounted(() => {
  loadAll();
});
</script>

<style scoped>
.page-section {
  padding: 20px 20px 10px;
}

.page-kicker {
  margin: 0 0 8px;
  font-size: 0.875rem;
  line-height: 1.125rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color--gray-45, #6b7280);
}

.card-link {
  text-decoration: none;
  display: block;
  height: 100%;
}

.empty-state {
  display: flex;
  justify-content: center;
  padding: 48px 20px;
  text-align: center;
}

.empty-text {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0 0 8px;
}

.empty-hint {
  font-size: 0.875rem;
  margin: 0;
  opacity: 0.7;
}

.tag-list :deep(ion-chip) {
  font-weight: 700;
  font-size: 0.85rem;
}
</style>
