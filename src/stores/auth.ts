import { defineStore } from 'pinia';
import { ref } from 'vue';
import * as auth from '../api/auth';

export const useAuthStore = defineStore('auth', () => {
  const isCurator = ref(auth.isLoggedIn());

  async function login(username: string, password: string) {
    await auth.login(username, password);
    isCurator.value = true;
  }

  function logout() {
    auth.logout();
    isCurator.value = false;
  }

  /** Call when a request shows the session is no longer valid. */
  function sessionExpired() {
    auth.logout();
    isCurator.value = false;
  }

  return { isCurator, login, logout, sessionExpired, isConfigured: auth.isOauthConfigured };
});
