<template>
  <ion-button
    :aria-label="auth.isCurator ? 'Curator account' : 'Curator login'"
    @click="auth.openLogin()"
  >
    <ion-icon
      slot="icon-only"
      aria-hidden="true"
      :icon="auth.isCurator ? personCircle : personCircleOutline"
      :color="auth.isCurator ? 'primary' : undefined"
    />
  </ion-button>
</template>

<script setup lang="ts">
import { IonButton, IonIcon } from '@ionic/vue';
import { personCircle, personCircleOutline } from 'ionicons/icons';
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();
</script>
