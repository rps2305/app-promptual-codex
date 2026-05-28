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
            <p class="page-kicker">Fresh picks from the gallery.</p>
            <ion-text v-if="error" color="danger">{{ error }}</ion-text>
            <ion-button v-if="error" size="small" fill="clear" @click="forceReload">
              Retry
            </ion-button>
          </div>
          <ion-button size="small" color="secondary" @click="refreshRandom">
            <ion-icon slot="start" :icon="shuffleOutline" />
            Refresh
          </ion-button>
        </div>
      </section>


      <ion-grid>
        <ion-row>
          <ion-col
            v-for="article in randomArticles"
            :key="article.id"
            size="12"
            size-md="6"
            size-lg="6"
          >
            <router-link :to="`/tabs/tab1/${article.id}`" class="card-link">
              <ImageCard :article="article" :show-prompt="false" />
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

      <ion-loading :is-open="loading" message="Loading random picks..." />
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
  IonCard,
  IonCardHeader,
  IonSkeletonText,
  IonText,
  IonRefresher,
  IonRefresherContent,
  IonLoading,
} from '@ionic/vue';
import { shuffleOutline } from 'ionicons/icons';
import ImageCard from '@/components/ImageCard.vue';
import AppLogo from '@/components/AppLogo.vue';
import { usePromptualData } from '@/composables/usePromptualData';
import type { PromptualArticle } from '@/services/promptualApi';

const { articles, loading, error, loadAll, forceReload } = usePromptualData();
const randomArticles = ref<PromptualArticle[]>([]);
const RANDOM_COUNT = 8;

function shuffle(list: PromptualArticle[]) {
  const result = [...list];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function refreshRandom() {
  const source = articles.value.filter((article) => Boolean(article?.id));
  if (!source.length) {
    randomArticles.value = [];
    return;
  }
  randomArticles.value = shuffle(source).slice(0, RANDOM_COUNT);
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
  font-size: 0.875rem;
  line-height: 1.125rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color--gray-45, #6b7280);
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
}
</style>
