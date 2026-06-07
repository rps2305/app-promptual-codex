<template>
  <div class="error-state" role="status" aria-live="polite">
    <div class="error-state__content">
      <ion-icon :icon="errorIcon" class="error-state__icon" aria-hidden="true" />
      <div class="error-state__copy">
        <h2 class="error-state__title">{{ resolvedTitle }}</h2>
        <p class="error-state__message">{{ resolvedMessage }}</p>
      </div>

      <div v-if="showRetry || showClear || showBack" class="error-state__actions">
        <ion-button v-if="showRetry" @click="onRetry">
          {{ retryLabel }}
        </ion-button>

        <ion-button v-if="showClear" fill="outline" @click="onClearCache">
          Clear saved data
        </ion-button>

        <ion-button v-if="showBack" fill="clear" @click="onBack">
          Browse gallery
        </ion-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import {
  IonIcon,
  IonButton
} from '@ionic/vue';
import { alertCircle, wifiOutline } from 'ionicons/icons';
import { ApiError, CacheError } from '../types';

interface Props {
  error?: Error | ApiError | CacheError | string | null;
  title?: string;
  message?: string;
  retryLabel?: string;
  onRetry?: () => void;
  onClearCache?: () => void;
  onBack?: () => void;
}

const props = withDefaults(defineProps<Props>(), {
  error: null,
  title: undefined,
  message: undefined,
  retryLabel: 'Try again'
});

const errorIcon = computed(() => {
  if (props.error instanceof ApiError) {
    return wifiOutline;
  }
  return alertCircle;
});

const resolvedTitle = computed(() => {
  if (props.title) {
    return props.title;
  }

  if (!props.error) {
    return 'Something went wrong';
  }

  if (props.error instanceof ApiError) {
    if (props.error.statusCode === 404) {
      return 'Not found';
    }
    if (props.error.statusCode === 401) {
      return 'Access denied';
    }
    if (props.error.statusCode === 429) {
      return 'Too many requests';
    }
    if (props.error.statusCode && props.error.statusCode >= 500) {
      return 'Server error';
    }
    return 'Connection error';
  }

  if (props.error instanceof CacheError) {
    return 'Saved data needs a refresh';
  }

  if (typeof props.error === 'string') {
    return 'We could not load this yet';
  }

  return 'We could not load this yet';
});

const resolvedMessage = computed(() => {
  if (props.message) {
    return props.message;
  }

  if (!props.error) {
    return 'Try again in a moment. If you are offline, previously loaded images may still be available.';
  }

  if (props.error instanceof ApiError) {
    if (props.error.statusCode === 404) {
      return 'That artwork is no longer available. You can return to the gallery and keep browsing.';
    }
    if (props.error.statusCode === 401) {
      return 'This content is not available from this app.';
    }
    if (props.error.statusCode === 429) {
      return 'Promptual is getting a lot of requests. Wait a moment, then try again.';
    }
    if (props.error.statusCode && props.error.statusCode >= 500) {
      return 'Promptual is not responding right now. Your saved favorites are still on this device.';
    }
    return 'Check your connection, then try loading the gallery again.';
  }

  if (props.error instanceof CacheError) {
    return 'The saved gallery data could not be read. Clearing saved data may help.';
  }

  if (typeof props.error === 'string') {
    return 'Check your connection, then try loading the gallery again.';
  }

  return props.error.message || 'Try again in a moment.';
});

const showRetry = computed(() => {
  return props.onRetry !== undefined;
});

const showClear = computed(() => {
  return props.onClearCache !== undefined;
});

const showBack = computed(() => {
  return props.onBack !== undefined;
});
</script>

<style scoped>
.error-state {
  width: 100%;
  max-width: var(--content-max);
  margin-inline: auto;
  padding: var(--space-lg) var(--page-gutter);
  box-sizing: border-box;
}

.error-state__content {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: var(--space-md);
  align-items: start;
  max-width: 620px;
  padding: var(--space-md);
  border: 1px solid color-mix(in srgb, var(--ion-color-danger) 20%, var(--border-subtle));
  border-radius: 12px;
  background: color-mix(in srgb, var(--ion-color-danger) 5%, var(--surface));
}

.error-state__icon {
  color: var(--ion-color-danger);
  width: 24px;
  height: 24px;
  margin-top: 2px;
}

.error-state__copy {
  min-width: 0;
}

.error-state__title {
  margin: 0 0 var(--space-2xs);
  color: var(--color--gray-5);
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.35;
  overflow-wrap: anywhere;
}

.error-state__message {
  margin: 0;
  color: var(--text-muted);
  line-height: 1.45;
  overflow-wrap: anywhere;
}

.error-state__actions {
  grid-column: 2;
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-xs);
  margin-top: var(--space-xs);
}

.error-state__actions ion-button {
  min-height: 44px;
  margin: 0;
}

@media (max-width: 420px) {
  .error-state__content {
    grid-template-columns: 1fr;
  }

  .error-state__actions {
    grid-column: 1;
  }
}
</style>
