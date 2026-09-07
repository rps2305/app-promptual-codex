<template>
  <span v-if="text" ref="container" class="copy-prompt">
    <button type="button" :disabled="copying" @click.stop="copy">
      <ion-icon :icon="copyOutline" aria-hidden="true" />
      Copy prompt
    </button>
    <span role="status" class="copy-status">{{ message }}</span>
  </span>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { IonIcon } from '@ionic/vue';
import { copyOutline } from 'ionicons/icons';
import { copyText } from '@/utils/clipboard';

const props = defineProps<{ text: string }>();
const container = ref<HTMLElement>();
const copying = ref(false);
const message = ref('');
watch(() => props.text, () => { message.value = ''; });

async function copy() {
  copying.value = true;
  message.value = '';
  try {
    await copyText(props.text, container.value);
    message.value = 'Copied';
  } catch {
    message.value = 'Could not copy. Touch and hold the prompt to select it.';
  } finally {
    copying.value = false;
  }
}
</script>

<style scoped>
.copy-prompt {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 0.8125rem;
}
button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 44px;
  padding: 4px 8px;
  background: transparent;
  color: inherit;
  border: 1px solid transparent;
  border-radius: 6px;
  font: inherit;
  cursor: pointer;
}
button:hover { background: rgba(127, 127, 127, 0.1); }
button:focus-visible { outline: 2px solid currentColor; outline-offset: 2px; }
.copy-status { font-size: 0.75rem; }
</style>
