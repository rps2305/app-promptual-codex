<template>
  <ion-app>
    <InstallPrompt />
    <ion-router-outlet />
    <CuratorLogin :is-open="auth.loginOpen" @close="closeLogin" />
  </ion-app>
</template>

<script setup lang="ts">
import { watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { IonApp, IonRouterOutlet } from '@ionic/vue';
import InstallPrompt from '@/components/InstallPrompt.vue';
import CuratorLogin from '@/components/CuratorLogin.vue';
import { useAuthStore } from '@/stores/auth';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

// Hidden entry point: add ?curator to any page address.
watch(
  () => route.query.curator,
  (value) => {
    if (value !== undefined) {
      auth.openLogin();
    }
  },
  { immediate: true }
);

function closeLogin() {
  auth.closeLogin();
  if (route.query.curator !== undefined) {
    const { curator: _curator, ...rest } = route.query;
    void router.replace({ path: route.path, query: rest });
  }
}
</script>
