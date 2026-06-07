import { Article, Tag } from '../types';

type RawTag = {
  id: string;
  name?: string;
  description?: { value: string } | null;
};

type RawArticle = {
  id: string;
  title?: string;
  body?: { value: string } | null;
  created?: string;
  field_nsfw?: boolean;
  field_width?: number | null;
  field_height?: number | null;
  field_steps?: number | null;
  field_guidance_scale?: number | null;
  field_seed?: string | null;
  field_negative_prompt?: string | null;
  field_image?: Array<{ uri?: { url?: string } }>;
  field_tags?: RawTag[];
  field_model?: RawTag;
  path?: { alias?: string };
};

const SITE_BASE = import.meta.env.VITE_SITE_BASE_URL || 'https://promptual.puntuale.nl';
const CANONICAL_BASE = import.meta.env.VITE_SITE_BASE_URL || 'https://promptual.puntuale.nl';

export function normalizeTag(tag: RawTag): Tag {
  return {
    id: tag.id,
    name: tag.name ?? 'Untitled',
    description: tag.description?.value ?? null,
  };
}

export function normalizeArticle(article: RawArticle): Article {
  const image = Array.isArray(article.field_image) ? article.field_image[0] : null;
  const imageUrl = image?.uri?.url ? `${SITE_BASE}${image.uri.url}` : null;
  const tagList = Array.isArray(article.field_tags) ? article.field_tags : [];
  const modelTag = article.field_model ? normalizeTag(article.field_model) : null;
  const modelTagList = article.field_model ? [article.field_model] : [];
  const rawTags = [...tagList, ...modelTagList];
  const tags = rawTags
    .filter(Boolean)
    .map(normalizeTag)
    .reduce<Tag[]>((unique, tag) => {
      if (!unique.find((item) => item.id === tag.id)) {
        unique.push(tag);
      }
      return unique;
    }, []);

  return {
    id: article.id,
    title: article.title ?? 'Untitled',
    prompt: article.body?.value ?? '',
    imageUrl,
    imageWidth: Number.isFinite(article.field_width) ? Number(article.field_width) : null,
    imageHeight: Number.isFinite(article.field_height) ? Number(article.field_height) : null,
    steps: Number.isFinite(article.field_steps) ? Number(article.field_steps) : null,
    guidanceScale: Number.isFinite(article.field_guidance_scale) ? Number(article.field_guidance_scale) : null,
    seed: article.field_seed ?? null,
    negativePrompt: article.field_negative_prompt ?? null,
    model: modelTag,
    tags,
    created: article.created ?? '',
    nsfw: Boolean(article.field_nsfw),
    path: article.path?.alias ? `${CANONICAL_BASE}${article.path.alias}` : null,
  };
}
