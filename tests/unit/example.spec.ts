import { mount } from '@vue/test-utils'
import Tab1Page from '@/views/Tab1Page.vue'
import { describe, expect, test } from 'vitest'

describe('Tab1Page.vue', () => {
  test('renders gallery header copy', () => {
    const wrapper = mount(Tab1Page)
    expect(wrapper.text()).toMatch('Promptual Gallery')
  })
})
