import type { Article } from '../types';

export type SlideKind = 'safe' | 'nsfw';

const SWIPE_MIN_DISTANCE = 50;
const SWIPE_AXIS_RATIO = 1.5;
const DEFAULT_MAX_ATTEMPTS = 4;

/** Left swipe shows a safe image, right swipe shows an NSFW image. */
export function swipeDirection(dx: number, dy: number): SlideKind | null {
  if (Math.abs(dx) < SWIPE_MIN_DISTANCE || Math.abs(dx) < Math.abs(dy) * SWIPE_AXIS_RATIO) {
    return null;
  }
  return dx < 0 ? 'safe' : 'nsfw';
}

export function createSlideshowQueues(
  fetchBatch: () => Promise<Article[]>,
  maxAttempts: number = DEFAULT_MAX_ATTEMPTS
) {
  const queues: Record<SlideKind, Article[]> = { safe: [], nsfw: [] };
  let lastShownId: string | null = null;

  function enqueue(articles: Article[]) {
    const queuedIds = new Set([...queues.safe, ...queues.nsfw].map(article => article.id));
    articles.forEach((article) => {
      if (!article.imageUrl || article.id === lastShownId || queuedIds.has(article.id)) {
        return;
      }
      queuedIds.add(article.id);
      queues[article.nsfw ? 'nsfw' : 'safe'].push(article);
    });
  }

  async function next(kind: SlideKind): Promise<Article | null> {
    for (let attempt = 0; attempt < maxAttempts && queues[kind].length === 0; attempt += 1) {
      enqueue(await fetchBatch());
    }
    const article = queues[kind].shift() ?? null;
    if (article) {
      lastShownId = article.id;
    }
    return article;
  }

  return { next };
}
