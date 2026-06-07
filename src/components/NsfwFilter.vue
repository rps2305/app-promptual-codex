<template>
  <fieldset class="nsfw-filter" :aria-describedby="helpId">
    <div class="nsfw-filter__header">
      <legend class="nsfw-filter__legend">Show images</legend>
      <p :id="helpId" class="nsfw-filter__help">Choose the content level for this view.</p>
    </div>

    <div class="nsfw-filter__options">
      <label
        v-for="option in options"
        :key="option.value"
        class="nsfw-filter__option"
        :class="{ 'nsfw-filter__option--selected': modelValue === option.value }"
      >
        <input
          class="nsfw-filter__input"
          type="radio"
          :name="groupName"
          :value="option.value"
          :checked="modelValue === option.value"
          @change="setNsfwFilter(option.value)"
        />
        <span class="nsfw-filter__label">{{ option.label }}</span>
      </label>
    </div>
  </fieldset>
</template>

<script setup lang="ts">
type NsfwFilterValue = 'all' | 'safe' | 'nsfw';

let filterInstanceCount = 0;

interface Props {
  modelValue: NsfwFilterValue;
}

defineProps<Props>();

const emit = defineEmits<{
  'update:modelValue': [value: NsfwFilterValue];
}>();

const options: Array<{ value: NsfwFilterValue; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'safe', label: 'Safe' },
  { value: 'nsfw', label: 'NSFW' }
];

const instanceId = `nsfw-filter-${filterInstanceCount++}`;
const groupName = `${instanceId}-group`;
const helpId = `${instanceId}-help`;

function setNsfwFilter(value: NsfwFilterValue) {
  emit('update:modelValue', value);
}
</script>

<style scoped>
.nsfw-filter {
  width: 100%;
  max-width: 520px;
  min-width: 0;
  margin: 0;
  padding: var(--space-sm);
  border: 1px solid var(--color--gray-85);
  border-radius: 8px;
  background: var(--surface);
  box-shadow: var(--shadow-sm);
}

.nsfw-filter__header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--space-sm);
  margin-bottom: var(--space-xs);
}

.nsfw-filter__legend {
  padding: 0;
  color: var(--color--gray-5);
  font-size: 0.9rem;
  font-weight: 700;
  line-height: 1.2;
}

.nsfw-filter__help {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.82rem;
  line-height: 1.3;
  text-align: end;
}

.nsfw-filter__options {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 4px;
  padding: 4px;
  border-radius: 8px;
  background: var(--surface-muted);
}

.nsfw-filter__option {
  position: relative;
  display: grid;
  min-width: 0;
  min-height: 44px;
  place-items: center;
  border-radius: 6px;
  color: var(--color--gray-5);
  cursor: pointer;
  font-weight: 700;
  line-height: 1.1;
  text-align: center;
  transition: background-color 160ms var(--ease-out-quart), color 160ms var(--ease-out-quart), box-shadow 160ms var(--ease-out-quart);
}

.nsfw-filter__option--selected {
  background: var(--color--gray-5);
  color: var(--color--on-accent);
  box-shadow: 0 1px 3px var(--shadow--strong);
}

.nsfw-filter__input {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  cursor: pointer;
  opacity: 0;
}

.nsfw-filter__label {
  min-width: 0;
  padding-inline: var(--space-xs);
  overflow-wrap: anywhere;
  pointer-events: none;
}

.nsfw-filter__option:has(.nsfw-filter__input:focus-visible) {
  outline: 3px solid var(--color--focus-ring);
  outline-offset: 3px;
}

.nsfw-filter__option:hover {
  background: var(--color--gray-95);
}

.nsfw-filter__option--selected:hover {
  background: var(--color--gray-5);
}

@media (max-width: 420px) {
  .nsfw-filter__header {
    display: grid;
    gap: 2px;
  }

  .nsfw-filter__help {
    text-align: start;
  }
}

@media (prefers-reduced-motion: reduce) {
  .nsfw-filter__option {
    transition: none;
  }
}
</style>
