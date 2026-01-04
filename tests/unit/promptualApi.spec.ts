import { describe, expect, it } from 'vitest';
import { normalizeArticle, normalizeTag } from '@/services/promptualApi';

describe('promptualApi normalization', () => {
  it('normalizes tags with description text', () => {
    const rawTag = {
      id: 'tag-1',
      name: 'Portrait',
      description: { value: 'Portrait work.' },
    };

    expect(normalizeTag(rawTag)).toEqual({
      id: 'tag-1',
      name: 'Portrait',
      description: 'Portrait work.',
    });
  });

  it('normalizes article image url and tags with model tag', () => {
    const rawArticle = {
      id: 'article-1',
      title: 'Forest Dream',
      body: { value: 'A calm forest prompt.' },
      created: '2025-01-01T00:00:00+00:00',
      field_nsfw: false,
      field_image: [
        {
          uri: {
            url: '/sites/default/files/2025-01/forest.png',
          },
        },
      ],
      field_tags: [
        {
          id: 'tag-1',
          name: 'Landscape',
          description: { value: null },
        },
      ],
      field_model: {
        id: 'tag-2',
        name: 'Flux',
        description: { value: 'Model tag' },
      },
    };

    const normalized = normalizeArticle(rawArticle);

    expect(normalized.imageUrl).toBe('/sites/default/files/2025-01/forest.png');
    expect(normalized.tags).toEqual([
      { id: 'tag-1', name: 'Landscape', description: null },
      { id: 'tag-2', name: 'Flux', description: 'Model tag' },
    ]);
    expect(normalized.imageWidth).toBeNull();
    expect(normalized.imageHeight).toBeNull();
    expect(normalized.model?.id).toBe('tag-2');
  });

  it('deduplicates tags by id', () => {
    const rawArticle = {
      id: 'article-2',
      title: 'Portrait Test',
      body: { value: 'Prompt' },
      created: '2025-01-01T00:00:00+00:00',
      field_nsfw: false,
      field_tags: [
        { id: 'tag-1', name: 'Portrait', description: { value: null } },
      ],
      field_model: { id: 'tag-1', name: 'Portrait', description: { value: null } },
    };

    const normalized = normalizeArticle(rawArticle);

    expect(normalized.tags).toHaveLength(1);
    expect(normalized.tags[0].id).toBe('tag-1');
  });
});
