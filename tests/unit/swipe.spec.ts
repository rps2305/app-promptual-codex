import { describe, expect, it } from 'vitest';
import { horizontalSwipe } from '@/utils/swipe';

describe('horizontalSwipe', () => {
  it('detects left and right swipes', () => {
    expect(horizontalSwipe(-80, 5)).toBe('left');
    expect(horizontalSwipe(80, -5)).toBe('right');
  });

  it('ignores short or mostly vertical gestures', () => {
    expect(horizontalSwipe(20, 0)).toBeNull();
    expect(horizontalSwipe(60, 80)).toBeNull();
  });
});
