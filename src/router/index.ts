import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import ArticleDetailPage from '@/views/ArticleDetailPage.vue';
import FavoritesPage from '@/views/FavoritesPage.vue';
import Tab1Page from '@/views/Tab1Page.vue';
import Tab2Page from '@/views/Tab2Page.vue';
import Tab3Page from '@/views/Tab3Page.vue';
import TabsPage from '../views/TabsPage.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/tabs/tab1'
  },
  {
    path: '/tabs/',
    component: TabsPage,
    children: [
      {
        path: '',
        redirect: '/tabs/tab1'
      },
      {
        path: 'tab1',
        component: Tab1Page
      },
      {
        path: 'tab1/:id',
        component: ArticleDetailPage
      },
      {
        path: 'tab2',
        component: Tab2Page
      },
      {
        path: 'tab3',
        component: Tab3Page
      },
      {
        path: 'favorites',
        component: FavoritesPage
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

const STALE_CHUNK_RELOAD_KEY = 'promptual:stale-chunk-reload';

function isStaleChunkError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return [
    'Importing a module script failed',
    'Failed to fetch dynamically imported module',
    'error loading dynamically imported module',
    'Loading chunk',
    'module script failed'
  ].some(fragment => message.includes(fragment));
}

router.onError((error, to) => {
  if (!isStaleChunkError(error) || typeof window === 'undefined') {
    return;
  }

  if (sessionStorage.getItem(STALE_CHUNK_RELOAD_KEY) === '1') {
    return;
  }

  sessionStorage.setItem(STALE_CHUNK_RELOAD_KEY, '1');
  window.location.assign(to.fullPath || window.location.pathname);
});

router.afterEach(() => {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(STALE_CHUNK_RELOAD_KEY);
  }
});

export default router
