export interface Article {
  id: string;
  title: string;
  prompt: string;
  imageUrl: string | null;
  imageWidth: number | null;
  imageHeight: number | null;
  steps: number | null;
  guidanceScale: number | null;
  seed: string | null;
  negativePrompt: string | null;
  model: Tag | null;
  tags: Tag[];
  created: string;
  nsfw: boolean;
  path: string | null;
  isFavorite?: boolean;
}

export interface Tag {
  id: string;
  name: string;
  description: string | null;
}

export interface CacheEntry<T> {
  timestamp: number;
  data: T;
  page?: number;
  totalPages?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

export interface SearchOptions {
  query?: string;
  tagIds?: string[];
  nsfwFilter?: 'all' | 'safe' | 'nsfw';
  page?: number;
  limit?: number;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public endpoint?: string,
    public cause?: Error
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class CacheError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = 'CacheError';
  }
}
