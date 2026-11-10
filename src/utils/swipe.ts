export const SWIPE_MIN_DISTANCE = 50;
export const SWIPE_AXIS_RATIO = 1.5;
/** Ignore touches that start at the screen edge, where iOS uses its own back gesture. */
export const SWIPE_EDGE_GUARD = 24;

export type SwipeDirection = 'left' | 'right';

export function horizontalSwipe(dx: number, dy: number): SwipeDirection | null {
  if (Math.abs(dx) < SWIPE_MIN_DISTANCE || Math.abs(dx) < Math.abs(dy) * SWIPE_AXIS_RATIO) {
    return null;
  }
  return dx < 0 ? 'left' : 'right';
}

export function createSwipeTracker(onSwipe: (direction: SwipeDirection) => void) {
  let start: { x: number; y: number } | null = null;

  return {
    onTouchStart(event: TouchEvent) {
      if (event.touches.length !== 1) {
        start = null;
        return;
      }
      const touch = event.touches[0];
      const width = typeof window !== 'undefined' ? window.innerWidth : Infinity;
      if (touch.clientX < SWIPE_EDGE_GUARD || touch.clientX > width - SWIPE_EDGE_GUARD) {
        start = null;
        return;
      }
      start = { x: touch.clientX, y: touch.clientY };
    },
    onTouchEnd(event: TouchEvent): boolean {
      const origin = start;
      start = null;
      const touch = event.changedTouches[0];
      if (!origin || !touch) {
        return false;
      }
      const direction = horizontalSwipe(touch.clientX - origin.x, touch.clientY - origin.y);
      if (!direction) {
        return false;
      }
      onSwipe(direction);
      return true;
    },
    cancel() {
      start = null;
    },
  };
}
