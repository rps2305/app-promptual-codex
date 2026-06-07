<template>
  <ion-page>
    <ion-router-outlet></ion-router-outlet>
    <nav class="app-tab-nav" aria-label="Primary">
      <button
        v-for="item in tabs"
        :key="item.path"
        type="button"
        class="app-tab-nav__button"
        :class="{ 'app-tab-nav__button--active': isActive(item.path) }"
        :aria-current="isActive(item.path) ? 'page' : undefined"
        @click="goToTab(item.path)"
      >
        <ion-icon aria-hidden="true" :icon="item.icon" />
        <span>{{ item.label }}</span>
      </button>
    </nav>
  </ion-page>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { IonIcon, IonPage, IonRouterOutlet } from '@ionic/vue';
import { imagesOutline, pricetagsOutline, shuffleOutline, heartOutline } from 'ionicons/icons';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const tabs = [
  { path: '/tabs/tab1', label: 'Gallery', icon: imagesOutline },
  { path: '/tabs/tab2', label: 'Tags', icon: pricetagsOutline },
  { path: '/tabs/tab3', label: 'Random', icon: shuffleOutline },
  { path: '/tabs/favorites', label: 'Favorites', icon: heartOutline },
];
const currentPath = computed(() => route.path);

function isActive(path: string) {
  if (path === '/tabs/tab1') {
    return currentPath.value === path || currentPath.value.startsWith('/tabs/tab1/');
  }
  return currentPath.value === path;
}

function goToTab(path: string) {
  if (currentPath.value !== path) {
    router.push(path);
  }
}
</script>

<style scoped>
.app-tab-nav {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 1000;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  min-height: calc(64px + env(safe-area-inset-bottom));
  padding-bottom: env(safe-area-inset-bottom);
  background: var(--surface);
  border-top: 1px solid var(--color--gray-95);
  box-shadow: 0 -6px 16px rgba(0, 0, 0, 0.06);
}

.app-tab-nav__button {
  display: grid;
  place-items: center;
  align-content: center;
  gap: 2px;
  min-width: 0;
  min-height: 64px;
  padding: 6px 4px;
  border: 0;
  background: transparent;
  color: var(--color--gray-5);
  font: inherit;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  touch-action: manipulation;
}

.app-tab-nav__button ion-icon {
  font-size: 22px;
}

.app-tab-nav__button--active {
  color: var(--ion-color-primary);
}

.app-tab-nav__button:focus-visible {
  outline: 3px solid var(--color--focus-ring);
  outline-offset: -5px;
}

.app-tab-nav__button span {
  overflow: hidden;
  max-width: 100%;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
