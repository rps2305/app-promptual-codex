<template>
  <div class="tag-filter">
    <div class="tag-filter__header">
      <h3 class="tag-filter__title">Filter by tags</h3>
      <ion-button v-if="selectedTags.length > 0" fill="clear" size="small" @click="clearAll">
        Clear filters
      </ion-button>
    </div>

    <div class="tag-filter__chips">
      <ion-chip
        v-for="tag in tags"
        :key="tag.id"
        :outline="!isSelected(tag.id)"
        :color="isSelected(tag.id) ? 'primary' : 'medium'"
        @click="toggleTag(tag.id)"
        :aria-label="isSelected(tag.id) ? `Remove ${tag.name} filter` : `Filter by ${tag.name}`"
      >
        <ion-label>{{ tag.name }}</ion-label>
      </ion-chip>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { IonChip, IonLabel, IonButton } from '@ionic/vue';
import type { Tag } from '../types';

interface Props {
  tags: Tag[];
  selectedTagIds: string[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
  toggleTag: [tagId: string];
  clearAll: [];
}>();

const selectedTags = computed(() => {
  return props.tags.filter(tag => props.selectedTagIds.includes(tag.id));
});

function isSelected(tagId: string): boolean {
  return props.selectedTagIds.includes(tagId);
}

function toggleTag(tagId: string) {
  emit('toggleTag', tagId);
}

function clearAll() {
  emit('clearAll');
}
</script>

<style scoped>
.tag-filter {
  padding: var(--space-md) 0 0;
}

.tag-filter__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-sm);
}

.tag-filter__title {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.3;
}

.tag-filter__chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
}

.tag-filter :deep(ion-chip) {
  min-height: 32px;
  margin: 0;
  cursor: pointer;
  transition: transform 160ms ease-out, box-shadow 160ms ease-out;
}

.tag-filter :deep(ion-chip:hover) {
  transform: translateY(-2px);
  box-shadow: var(--shadow-sm);
}

@media (prefers-reduced-motion: reduce) {
  .tag-filter :deep(ion-chip) {
    transition: none;
  }

  .tag-filter :deep(ion-chip:hover) {
    transform: none;
  }
}
</style>
