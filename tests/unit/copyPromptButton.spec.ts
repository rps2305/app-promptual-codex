import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CopyPromptButton from '@/components/CopyPromptButton.vue';
import { copyText } from '@/utils/clipboard';

vi.mock('@/utils/clipboard', () => ({ copyText: vi.fn() }));
beforeEach(() => { vi.mocked(copyText).mockReset(); });

describe('CopyPromptButton', () => {
  it('copies exact text and announces success', async () => {
    vi.mocked(copyText).mockResolvedValue();
    const wrapper = mount(CopyPromptButton, { props: { text: 'Full\nprompt' } });
    await wrapper.get('button').trigger('click');
    await flushPromises();
    expect(copyText).toHaveBeenCalledWith('Full\nprompt', wrapper.element);
    expect(wrapper.get('[role="status"]').text()).toBe('Copied');
    await wrapper.setProps({ text: 'Another prompt' });
    expect(wrapper.get('[role="status"]').text()).toBe('');
  });

  it('shows a useful failure message and allows retry', async () => {
    vi.mocked(copyText).mockRejectedValue(new Error('Denied'));
    const wrapper = mount(CopyPromptButton, { props: { text: 'Prompt' } });
    await wrapper.get('button').trigger('click');
    await flushPromises();
    expect(wrapper.get('[role="status"]').text()).toContain('Could not copy');
    expect(wrapper.get('button').attributes('disabled')).toBeUndefined();
  });

  it('hides the action when there is no prompt', () => {
    expect(mount(CopyPromptButton, { props: { text: '' } }).find('button').exists()).toBe(false);
  });
});
