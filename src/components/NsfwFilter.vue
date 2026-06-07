<template>
  <div class="nsfw-filter" aria-label="NSFW filter">
    <ion-segment :value="modelValue" @ionChange="setNsfwFilter">
      <ion-segment-button value="all">
        <ion-label>All</ion-label>
      </ion-segment-button>
      <ion-segment-button value="safe">
        <ion-label>Safe</ion-label>
      </ion-segment-button>
      <ion-segment-button value="nsfw">
        <ion-label>NSFW</ion-label>
      </ion-segment-button>
    </ion-segment>
  </div>
</template>

<script setup lang="ts">
import { IonLabel, IonSegment, IonSegmentButton } from '@ionic/vue';
import type { SegmentChangeEventDetail } from '@ionic/vue';

type NsfwFilterValue = 'all' | 'safe' | 'nsfw';

interface Props {
  modelValue: NsfwFilterValue;
}

defineProps<Props>();

const emit = defineEmits<{
  'update:modelValue': [value: NsfwFilterValue];
}>();

function setNsfwFilter(event: CustomEvent<SegmentChangeEventDetail>) {
  const value = event.detail.value;
  if (value === 'all' || value === 'safe' || value === 'nsfw') {
    emit('update:modelValue', value);
  }
}
</script>

<style scoped>
.nsfw-filter {
  width: 100%;
}

.nsfw-filter ion-segment {
  width: min(100%, 360px);
  --background: var(--surface-muted);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
}

.nsfw-filter :deep(ion-segment-button) {
  min-height: 44px;
  --indicator-color: var(--ion-color-primary);
  --color: var(--color--gray-20);
  --color-checked: var(--color--on-accent);
  font-weight: 700;
}
</style>
