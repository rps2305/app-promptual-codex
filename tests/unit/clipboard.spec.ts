import { afterEach, describe, expect, it, vi } from 'vitest';
import { copyText } from '@/utils/clipboard';

afterEach(() => vi.restoreAllMocks());

describe('copyText', () => {
  it('writes the complete prompt immediately through the clipboard API', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    const result = copyText('A prompt\nwith details');
    expect(writeText).toHaveBeenCalledWith('A prompt\nwith details');
    await result;
  });

  it.each([false, true])('falls back and cleans up when clipboard is %s', async (denied) => {
    const clipboard = denied ? { writeText: vi.fn().mockRejectedValue(new Error('Denied')) } : undefined;
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: clipboard });
    Object.defineProperty(document, 'execCommand', { configurable: true, value: vi.fn(() => {
      expect(document.querySelector('textarea')?.value).toBe('Full prompt');
      return true;
    }) });
    await copyText('Full prompt');
    expect(document.execCommand).toHaveBeenCalledWith('copy');
    expect(document.querySelector('textarea')).toBeNull();
  });

  it('reports failure instead of claiming success', async () => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined });
    Object.defineProperty(document, 'execCommand', { configurable: true, value: vi.fn(() => false) });
    await expect(copyText('Prompt')).rejects.toThrow('Copy failed');
    expect(document.querySelector('textarea')).toBeNull();
  });
});
