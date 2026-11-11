<template>
  <ion-button
    v-if="auth.isCurator"
    :size="size"
    fill="outline"
    :color="nsfw ? 'danger' : 'medium'"
    :disabled="busy"
    :aria-label="nsfw ? 'Marked NSFW. Mark as safe' : 'Marked safe. Mark as NSFW'"
    @click.stop="toggle"
  >
    <ion-icon slot="start" aria-hidden="true" :icon="nsfw ? eyeOffOutline : eyeOutline" />
    {{ busy ? 'Saving…' : nsfw ? 'NSFW · mark safe' : 'Safe · mark NSFW' }}
  </ion-button>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { IonButton, IonIcon } from '@ionic/vue';
import { eyeOffOutline, eyeOutline } from 'ionicons/icons';
import { useArticlesStore } from '@/stores/articles';
import { useAuthStore } from '@/stores/auth';

const props = withDefaults(defineProps<{
  articleId: string;
  nsfw: boolean;
  size?: 'small' | 'default';
}>(), { size: 'small' });

const emit = defineEmits<{
  done: [message: string];
}>();

const auth = useAuthStore();
const store = useArticlesStore();
const busy = ref(false);

async function toggle() {
  if (busy.value) {
    return;
  }
  busy.value = true;
  const next = !props.nsfw;
  try {
    await store.setNsfw(props.articleId, next);
    emit('done', next ? 'Marked as NSFW' : 'Marked as safe');
  } catch (err) {
    emit('done', err instanceof Error ? err.message : 'Could not save the change.');
  } finally {
    busy.value = false;
  }
}
</script>
