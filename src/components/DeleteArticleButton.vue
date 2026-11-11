<template>
  <ion-button
    v-if="auth.isCurator"
    :size="size"
    fill="outline"
    color="danger"
    :disabled="busy"
    aria-label="Delete this image and article from the site"
    @click.stop="confirmDelete"
  >
    <ion-icon slot="start" aria-hidden="true" :icon="trashOutline" />
    {{ busy ? 'Deleting…' : 'Delete' }}
  </ion-button>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { IonButton, IonIcon, alertController } from '@ionic/vue';
import { trashOutline } from 'ionicons/icons';
import { useArticlesStore } from '@/stores/articles';
import { useAuthStore } from '@/stores/auth';

const props = withDefaults(defineProps<{
  articleId: string;
  title: string;
  /** Article to show after this one is gone (captured when the button is tapped). */
  fallbackId?: string | null;
  size?: 'small' | 'default';
}>(), { size: 'small', fallbackId: null });

const emit = defineEmits<{
  done: [message: string];
  deleted: [payload: { id: string; fallbackId: string | null }];
}>();

const auth = useAuthStore();
const store = useArticlesStore();
const busy = ref(false);

async function confirmDelete() {
  if (busy.value) {
    return;
  }
  const id = props.articleId;
  const fallbackId = props.fallbackId ?? null;

  const alert = await alertController.create({
    header: 'Delete permanently?',
    message: `"${props.title || 'This article'}" and its image will be removed from promptual.puntuale.nl for everyone. This cannot be undone.`,
    buttons: [
      { text: 'Cancel', role: 'cancel' },
      { text: 'Delete', role: 'destructive' },
    ],
  });
  await alert.present();
  const { role } = await alert.onDidDismiss();
  if (role !== 'destructive') {
    return;
  }

  busy.value = true;
  try {
    await store.removeArticle(id);
    emit('done', 'Deleted from the site');
    emit('deleted', { id, fallbackId });
  } catch (err) {
    emit('done', err instanceof Error ? err.message : 'Could not delete.');
  } finally {
    busy.value = false;
  }
}
</script>
