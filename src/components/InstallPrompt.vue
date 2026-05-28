<template>
  <div v-if="visible" class="install-prompt">
    <div class="install-prompt__body">
      <button class="install-prompt__close" @click="dismiss" aria-label="Dismiss">&times;</button>
      <div class="install-prompt__icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 3v12m0 0-3-3m3 3 3-3" />
          <path d="M5 16v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2" />
        </svg>
      </div>
      <p class="install-prompt__title">Install Promptual</p>
      <p class="install-prompt__text">
        Tap <strong>Share</strong>
        <svg class="install-prompt__share-icon" viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
          <path d="M15 8a3 3 0 1 0-2.98-2.97 1 1 0 0 0-.02.17v2.51L9 8.4V5.87a1 1 0 0 0-.01-.16A3 3 0 1 0 5 8.03v3.2a3 3 0 1 0 2 0V9.8l3.02-.66v2.49a3 3 0 1 0 2 0V8l-3 1.2V5.4c.08-.05.16-.1.24-.16a1 1 0 0 0 .35-.2l.02-.01A3 3 0 0 0 15 8Z"/>
        </svg>
        then <strong>Add to Home Screen</strong>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

const STORAGE_KEY = 'promptual:installPromptDismissed';

const visible = ref(false);

function isIOS() {
  const ua = navigator.userAgent;
  return (
    /iPhone|iPad|iPod/.test(ua) ||
    (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)
  ) && !('MSStream' in window);
}

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
}

function dismiss() {
  visible.value = false;
  try {
    localStorage.setItem(STORAGE_KEY, '1');
  } catch {}
}

onMounted(() => {
  const dismissed = (() => { try { return localStorage.getItem(STORAGE_KEY); } catch { return null; } })();
  if (dismissed) return;
  if (!isIOS()) return;
  if (isStandalone()) return;
  visible.value = true;
});
</script>

<style scoped>
.install-prompt {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 9999;
  padding: 16px 16px 12px;
  background: linear-gradient(180deg, hsl(40, 14%, 97%) 0%, hsl(40, 12%, 95%) 100%);
  border-bottom: 1px solid var(--color--gray-90);
  box-shadow: 0 4px 16px rgba(18, 14, 8, 0.1);
  animation: slideDown 0.35s var(--ease-out-expo) both;
}

.install-prompt__body {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-right: 8px;
}

.install-prompt__close {
  position: absolute;
  top: 6px;
  right: 8px;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  font-size: 1.4rem;
  line-height: 1;
  color: var(--color--gray-45);
  cursor: pointer;
  display: grid;
  place-items: center;
  border-radius: 4px;
}

.install-prompt__close:hover {
  background: var(--color--gray-90);
  color: var(--color--gray-5);
}

.install-prompt__icon {
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  color: var(--color--terracotta);
}

.install-prompt__icon svg {
  width: 100%;
  height: 100%;
}

.install-prompt__title {
  margin: 0 0 2px;
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--color--gray-5);
}

.install-prompt__text {
  margin: 0;
  font-size: 0.8rem;
  color: var(--color--gray-45);
  line-height: 1.4;
}

.install-prompt__share-icon {
  display: inline-block;
  vertical-align: middle;
  margin: -2px 1px 0;
  color: var(--color--terracotta);
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-100%);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
