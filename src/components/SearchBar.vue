<template>
  <div class="search-bar">
    <ion-searchbar
      v-model="localQuery"
      :placeholder="placeholder"
      :debounce="300"
      :maxlength="120"
      @ionFocus="showHistory = true"
      @ionBlur="hideHistory"
      @ionInput="onInput"
      @ionClear="onClear"
      aria-label="Search images"
    />

    <div v-if="showHistory && recentSearches.length > 0" class="search-history">
      <ion-list>
        <ion-list-header>
          <span>Recent searches</span>
          <ion-button fill="clear" size="small" @click="clearHistory">
            Clear history
          </ion-button>
        </ion-list-header>
        <ion-item
          v-for="search in recentSearches"
          :key="search"
          button
          @click="selectRecentSearch(search)"
        >
          <ion-label>{{ search }}</ion-label>
        </ion-item>
      </ion-list>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onUnmounted, ref, watch } from 'vue';
import { IonSearchbar, IonList, IonListHeader, IonItem, IonLabel, IonButton } from '@ionic/vue';

interface Props {
  query: string;
  recentSearches: string[];
  placeholder?: string;
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Search images or prompts',
});

const emit = defineEmits<{
  'update:query': [value: string];
  search: [query: string];
  clearHistory: [];
}>();

const localQuery = ref(props.query);
const showHistory = ref(false);
let blurTimer: ReturnType<typeof setTimeout> | null = null;

watch(() => props.query, (value) => {
  localQuery.value = value;
});

function onInput(event: CustomEvent) {
  const value = String(event.detail.value ?? '').slice(0, 120);
  emit('update:query', value);
}

function onClear() {
  emit('update:query', '');
  emit('search', '');
}

function selectRecentSearch(search: string) {
  localQuery.value = search;
  emit('update:query', search);
  emit('search', search);
  showHistory.value = false;
}

function clearHistory() {
  emit('clearHistory');
  showHistory.value = false;
}

function hideHistory() {
  if (blurTimer) {
    clearTimeout(blurTimer);
  }
  blurTimer = setTimeout(() => {
    showHistory.value = false;
  }, 200);
}

onUnmounted(() => {
  if (blurTimer) {
    clearTimeout(blurTimer);
  }
});
</script>

<style scoped>
.search-bar {
  position: relative;
}

.search-history {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--ion-background-color, #fff);
  border: 1px solid var(--border-subtle);
  border-radius: 0 0 10px 10px;
  box-shadow: var(--shadow-md);
  z-index: 20;
  max-height: 300px;
  overflow-y: auto;
}

.search-history ion-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-xs) var(--space-md);
  color: var(--text-muted);
  font-size: 0.85rem;
  font-weight: 700;
}

.search-bar :deep(.searchbar-input) {
  border-radius: 10px;
}
</style>
