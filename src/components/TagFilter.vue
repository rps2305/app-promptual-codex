<template>
  <div class="tag-filter">
    <div class="tag-filter__header">
      <h3 class="tag-filter__title">Filters</h3>
      <ion-button v-if="hasActiveFilters" fill="clear" size="small" @click="clearAll">
        Clear filters
      </ion-button>
    </div>

    <div class="tag-filter__safety" aria-label="NSFW filter">
      <ion-segment :value="nsfwFilter" @ionChange="setNsfwFilter">
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

    <div v-if="tags.length > 0" class="tag-filter__chips">
      <ion-chip
        v-for="tag in tags"
        :key="tag.id"
        :outline="!isSelected(tag.id)"
        :color="isSelected(tag.id) ? 'primary' : 'medium'"
        :button="true"
        :aria-pressed="isSelected(tag.id)"
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
import { IonChip, IonLabel, IonButton, IonSegment, IonSegmentButton } from '@ionic/vue';
import type { Tag } from '../types';
import type { SegmentChangeEventDetail } from '@ionic/vue';

interface Props {
  tags: Tag[];
  selectedTagIds: string[];
  nsfwFilter: 'all' | 'safe' | 'nsfw';
}

const props = defineProps<Props>();

const emit = defineEmits<{
  toggleTag: [tagId: string];
  nsfwFilterChange: [value: 'all' | 'safe' | 'nsfw'];
  clearAll: [];
}>();

const selectedTags = computed(() => {
  return props.tags.filter(tag => props.selectedTagIds.includes(tag.id));
});

const hasActiveFilters = computed(() => {
  return selectedTags.value.length > 0 || props.nsfwFilter !== 'all';
});

function isSelected(tagId: string): boolean {
  return props.selectedTagIds.includes(tagId);
}

function toggleTag(tagId: string) {
  emit('toggleTag', tagId);
}

function setNsfwFilter(event: CustomEvent<SegmentChangeEventDetail>) {
  const value = event.detail.value;
  if (value === 'all' || value === 'safe' || value === 'nsfw') {
    emit('nsfwFilterChange', value);
  }
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

.tag-filter__safety {
  margin-bottom: var(--space-sm);
}

.tag-filter__safety ion-segment {
  width: min(100%, 360px);
  --background: var(--surface-muted);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
}

.tag-filter__safety :deep(ion-segment-button) {
  min-height: 44px;
  --indicator-color: var(--ion-color-primary);
  --color: var(--color--gray-20);
  --color-checked: var(--color--on-accent);
  font-weight: 700;
}

.tag-filter :deep(ion-chip) {
  min-height: 44px;
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
