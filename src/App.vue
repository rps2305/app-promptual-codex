<template>
  <ion-app>
    <InstallPrompt />
    <ion-router-outlet />
    <CuratorLogin :is-open="loginOpen" @close="closeLogin" />
  </ion-app>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { IonApp, IonRouterOutlet } from '@ionic/vue';
import InstallPrompt from '@/components/InstallPrompt.vue';
import CuratorLogin from '@/components/CuratorLogin.vue';

const route = useRoute();
const router = useRouter();
const loginOpen = ref(false);

// Hidden entry point: add ?curator to any page address.
watch(
  () => route.query.curator,
  (value) => {
    if (value !== undefined) {
      loginOpen.value = true;
    }
  },
  { immediate: true }
);

function closeLogin() {
  loginOpen.value = false;
  if (route.query.curator !== undefined) {
    const { curator: _curator, ...rest } = route.query;
    void router.replace({ path: route.path, query: rest });
  }
}
</script>
