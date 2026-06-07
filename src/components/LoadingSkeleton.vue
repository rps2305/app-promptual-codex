<template>
  <ion-card class="loading-skeleton">
    <div class="loading-skeleton__media">
      <ion-skeleton-text animated style="height: 220px" />
    </div>
    <ion-card-header>
      <ion-skeleton-text animated style="width: 80%" />
      <ion-skeleton-text animated style="width: 60%" />
    </ion-card-header>
    <ion-card-content>
      <div class="loading-skeleton__tags">
        <ion-skeleton-text animated style="width: 60px; height: 24px" />
        <ion-skeleton-text animated style="width: 80px; height: 24px" />
        <ion-skeleton-text animated style="width: 70px; height: 24px" />
      </div>
    </ion-card-content>
  </ion-card>
</template>

<script setup lang="ts">
import { IonCard, IonCardHeader, IonCardContent, IonSkeletonText } from '@ionic/vue';
</script>

<style scoped>
.loading-skeleton {
  border-radius: 10px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 100%;
  margin: 0;
  border: 1px solid var(--border-subtle);
  box-shadow: var(--shadow-sm);
}

.loading-skeleton__media {
  aspect-ratio: 4 / 5;
  overflow: hidden;
}

.loading-skeleton__tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
}
</style>
