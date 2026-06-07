import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import Tab1Page from '@/views/Tab1Page.vue'
import { useArticlesStore } from '@/stores/articles'
import { describe, expect, test } from 'vitest'

describe('Tab1Page.vue', () => {
  test('renders gallery header copy', async () => {
    const pinia = createPinia()
    setActivePinia(pinia)

    const articlesStore = useArticlesStore()
    articlesStore.articles = [
      {
        id: 'test-article',
        title: 'Test image',
        prompt: 'A quiet gallery image',
        imageUrl: null,
        imageWidth: null,
        imageHeight: null,
        steps: null,
        guidanceScale: null,
        seed: null,
        negativePrompt: null,
        model: null,
        tags: [],
        created: '',
        nsfw: false,
        path: null,
      },
    ]

    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/tabs/tab1', component: Tab1Page },
        { path: '/tabs/tab1/:id', component: { template: '<div />' } },
        { path: '/tabs/tab2', component: { template: '<div />' } },
      ],
    })
    await router.push('/tabs/tab1')
    await router.isReady()

    const wrapper = mount(Tab1Page, {
      global: {
        plugins: [pinia, router],
      },
    })

    expect(wrapper.text()).toMatch('Promptual Gallery')
  })
})
