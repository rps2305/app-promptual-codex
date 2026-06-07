<template>
  <ion-app>
    <InstallPrompt />
    <ion-router-outlet />
  </ion-app>
</template>

<script setup lang="ts">
import { IonApp, IonRouterOutlet } from '@ionic/vue';
import InstallPrompt from '@/components/InstallPrompt.vue';
</script>
