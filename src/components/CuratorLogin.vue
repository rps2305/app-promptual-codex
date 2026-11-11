<template>
  <ion-modal :is-open="isOpen" @ionModalDidDismiss="emit('close')">
    <ion-header>
      <ion-toolbar>
        <ion-title>Curator</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="emit('close')">Close</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <template v-if="auth.isCurator">
        <p>You are logged in as a curator. You can change the NSFW flag of images, and the change is saved on the site for everyone.</p>
        <ion-button expand="block" fill="outline" @click="onLogout">Log out</ion-button>
      </template>
      <form v-else @submit.prevent="onLogin">
        <p v-if="!auth.isConfigured()" class="curator-error">
          Curator login is not set up for this site yet.
        </p>
        <ion-input
          v-model="username"
          label="Username"
          label-placement="stacked"
          autocomplete="username"
          autocapitalize="off"
          fill="outline"
          class="curator-field"
        />
        <ion-input
          v-model="password"
          type="password"
          label="Password"
          label-placement="stacked"
          autocomplete="current-password"
          fill="outline"
          class="curator-field"
        />
        <p v-if="error" class="curator-error" role="alert">{{ error }}</p>
        <ion-button type="submit" expand="block" :disabled="busy || !username || !password || !auth.isConfigured()">
          {{ busy ? 'Logging in…' : 'Log in' }}
        </ion-button>
      </form>
    </ion-content>
  </ion-modal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { IonButton, IonButtons, IonContent, IonHeader, IonInput, IonModal, IonTitle, IonToolbar } from '@ionic/vue';
import { useAuthStore } from '@/stores/auth';

const props = defineProps<{ isOpen: boolean }>();
const emit = defineEmits<{ close: [] }>();

const auth = useAuthStore();
const username = ref('');
const password = ref('');
const error = ref('');
const busy = ref(false);

watch(() => props.isOpen, (open) => {
  if (open) {
    error.value = '';
  } else {
    password.value = '';
  }
});

async function onLogin() {
  busy.value = true;
  error.value = '';
  try {
    await auth.login(username.value.trim(), password.value);
    password.value = '';
    emit('close');
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Login failed.';
  } finally {
    busy.value = false;
  }
}

function onLogout() {
  auth.logout();
  emit('close');
}
</script>

<style scoped>
.curator-field {
  margin-bottom: 16px;
}

.curator-error {
  color: var(--ion-color-danger);
  margin: 0 0 12px;
}
</style>
