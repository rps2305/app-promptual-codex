<template>
  <section v-if="isVisible" class="onboarding-tips" aria-label="Getting started">
    <div class="onboarding-tips__copy">
      <p class="onboarding-tips__eyebrow">New here?</p>
      <h2>Start by opening one image.</h2>
      <p>Look around, search in everyday words, then tap the heart on anything worth saving.</p>
    </div>

    <div class="onboarding-tips__actions">
      <ion-button size="small" fill="outline" @click="goToSearch">
        <ion-icon slot="start" :icon="searchOutline" />
        Search
      </ion-button>
      <ion-button size="small" fill="clear" @click="dismiss">
        Got it
      </ion-button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { IonButton, IonIcon } from '@ionic/vue';
import { searchOutline } from 'ionicons/icons';

const STORAGE_KEY = 'promptual:onboarding:gallery-tips-dismissed';
const isVisible = ref(readInitialVisibility());

const emit = defineEmits<{
  search: [];
}>();

function readInitialVisibility() {
  if (typeof localStorage === 'undefined') {
    return true;
  }
  return localStorage.getItem(STORAGE_KEY) !== 'true';
}

function dismiss() {
  isVisible.value = false;
  try {
    localStorage.setItem(STORAGE_KEY, 'true');
  } catch {
    // Dismissal is optional; ignore storage failures.
  }
}

function goToSearch() {
  dismiss();
  emit('search');
}
</script>

<style scoped>
.onboarding-tips {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: var(--space-md);
  align-items: center;
  width: calc(100% - (var(--page-gutter) * 2));
  max-width: calc(var(--content-max) - (var(--page-gutter) * 2));
  margin: 0 auto var(--space-md);
  padding: var(--space-md);
  border: 1px solid color-mix(in srgb, var(--ion-color-primary) 20%, var(--border-subtle));
  border-radius: 12px;
  background: color-mix(in srgb, var(--ion-color-primary) 5%, var(--surface));
  box-sizing: border-box;
}

.onboarding-tips__copy {
  min-width: 0;
}

.onboarding-tips__eyebrow {
  margin: 0 0 var(--space-2xs);
  color: var(--text-soft);
  font-size: 0.76rem;
  font-weight: 700;
  line-height: 1rem;
  text-transform: uppercase;
}

.onboarding-tips h2 {
  margin: 0;
  color: var(--color--gray-5);
  font-family: Lora, georgia, serif;
  font-size: 1.1rem;
  line-height: 1.25;
  overflow-wrap: anywhere;
}

.onboarding-tips p {
  margin: var(--space-2xs) 0 0;
  color: var(--text-muted);
  line-height: 1.45;
  overflow-wrap: anywhere;
}

.onboarding-tips__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: var(--space-xs);
}

.onboarding-tips__actions ion-button {
  min-height: 40px;
  margin: 0;
}

@media (max-width: 560px) {
  .onboarding-tips {
    grid-template-columns: 1fr;
  }

  .onboarding-tips__actions {
    justify-content: flex-start;
  }
}
</style>
