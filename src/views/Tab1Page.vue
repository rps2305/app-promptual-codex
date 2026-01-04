<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>
          <span class="title-row">
            <img class="title-logo" src="/promptual-logo.png" alt="Promptual logo" />
            Promptual Gallery
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
              <img class="title-logo" src="/promptual-logo.png" alt="Promptual logo" />
              Promptual Gallery
            </span>
          </ion-title>
        </ion-toolbar>
      </ion-header>

      <section class="page-section">
        <p class="page-kicker">AI-generated imagery from Promptual.</p>
        <ion-text v-if="error" color="danger">{{ error }}</ion-text>
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
} from '@ionic/vue';
import { RouterLink, useRouter } from 'vue-router';
import { searchOutline } from 'ionicons/icons';
import ImageCard from '@/components/ImageCard.vue';
import { usePromptualData } from '@/composables/usePromptualData';

const { articles, loading, error, loadAll, forceReload } = usePromptualData();
const router = useRouter();
const visibleCount = ref(12);
const visibleArticles = computed(() => articles.value.slice(0, visibleCount.value));
const canLoadMore = computed(() => visibleCount.value < articles.value.length);

function onInfinite(event: CustomEvent) {
  visibleCount.value = Math.min(visibleCount.value + 12, articles.value.length);
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


.tag-list :deep(ion-chip) {
  font-weight: 700;
  font-size: 0.85rem;
}
</style>
