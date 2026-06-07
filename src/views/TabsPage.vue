<template>
  <ion-page>
    <ion-tabs>
      <ion-router-outlet></ion-router-outlet>
      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="tab1" @click="goToTab('/tabs/tab1')">
          <ion-icon aria-hidden="true" :icon="imagesOutline" />
          <ion-label>Gallery</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="tab2" @click="goToTab('/tabs/tab2')">
          <ion-icon aria-hidden="true" :icon="pricetagsOutline" />
          <ion-label>Tags</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="tab3" @click="goToTab('/tabs/tab3')">
          <ion-icon aria-hidden="true" :icon="shuffleOutline" />
          <ion-label>Random</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="favorites" @click="goToTab('/tabs/favorites')">
          <ion-icon aria-hidden="true" :icon="heartOutline" />
          <ion-label>Favorites</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  </ion-page>
</template>

<script setup lang="ts">
import { IonTabBar, IonTabButton, IonTabs, IonLabel, IonIcon, IonPage, IonRouterOutlet } from '@ionic/vue';
import { imagesOutline, pricetagsOutline, shuffleOutline, heartOutline } from 'ionicons/icons';
import { useRouter } from 'vue-router';

const router = useRouter();

function goToTab(path: string) {
  router.push(path);
}
</script>
