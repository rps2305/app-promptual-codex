import { describe, expect, it, vi } from 'vitest';
import { createSlideshowQueues, swipeDirection } from '@/composables/useSlideshow';
import type { Article } from '@/types';

function article(id: string, nsfw: boolean, imageUrl: string | null = `https://img/${id}.jpg`): Article {
  return {
    id, title: `Title ${id}`, prompt: '', imageUrl, imageWidth: null, imageHeight: null,
    steps: null, guidanceScale: null, seed: null, negativePrompt: null, model: null,
    tags: [], created: '', nsfw, path: null
  };
}

describe('createSlideshowQueues', () => {
  it('returns safe and nsfw images from the same batch', async () => {
    const fetchBatch = vi.fn().mockResolvedValue([article('a', false), article('b', true), article('c', false)]);
    const queues = createSlideshowQueues(fetchBatch);

    expect((await queues.next('safe'))?.id).toBe('a');
    expect((await queues.next('nsfw'))?.id).toBe('b');
    expect((await queues.next('safe'))?.id).toBe('c');
    expect(fetchBatch).toHaveBeenCalledTimes(1);
  });

  it('refills when a queue runs dry and skips images without a url', async () => {
    const fetchBatch = vi.fn()
      .mockResolvedValueOnce([article('a', false), article('x', true, null)])
      .mockResolvedValueOnce([article('b', true)]);
    const queues = createSlideshowQueues(fetchBatch);

    expect((await queues.next('safe'))?.id).toBe('a');
    expect((await queues.next('nsfw'))?.id).toBe('b');
    expect(fetchBatch).toHaveBeenCalledTimes(2);
  });

  it('does not repeat the image that was just shown', async () => {
    const fetchBatch = vi.fn()
      .mockResolvedValueOnce([article('a', false)])
      .mockResolvedValueOnce([article('a', false), article('b', false)]);
    const queues = createSlideshowQueues(fetchBatch);

    expect((await queues.next('safe'))?.id).toBe('a');
    expect((await queues.next('safe'))?.id).toBe('b');
  });

  it('gives up with null after the maximum number of attempts', async () => {
    const fetchBatch = vi.fn().mockResolvedValue([article('a', false)]);
    const queues = createSlideshowQueues(fetchBatch, 3);

    expect((await queues.next('nsfw'))).toBeNull();
    expect(fetchBatch).toHaveBeenCalledTimes(3);
  });
});

describe('swipeDirection', () => {
  it('maps a leftward swipe to safe and a rightward swipe to nsfw', () => {
    expect(swipeDirection(-80, 5)).toBe('safe');
    expect(swipeDirection(80, -5)).toBe('nsfw');
  });

  it('ignores short or mostly vertical gestures', () => {
    expect(swipeDirection(20, 0)).toBeNull();
    expect(swipeDirection(-60, 120)).toBeNull();
  });
});
