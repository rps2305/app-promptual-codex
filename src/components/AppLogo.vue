<template>
  <img
    class="title-logo"
    src="/promptual-logo.png"
    alt="Promptual logo"
    @click="onClick"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { usePromptualData } from '@/composables/usePromptualData';

const { forceReload } = usePromptualData();
const lastTap = ref(0);

function onClick() {
  const now = Date.now();
  if (now - lastTap.value < 400) {
    localStorage.removeItem('promptual:articles:v2');
    localStorage.removeItem('promptual:tags:v2');
    forceReload();
  }
  lastTap.value = now;
}
</script>
