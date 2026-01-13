# Promptual App - Specification

## Overview

Promptual is a mobile web application that displays AI-generated imagery from https://promptual.puntuale.nl. The app allows users to browse a gallery, search by title/prompt/tags, and view random selections.

## Current State

### Functionality
- **Gallery Tab**: Displays all articles in a grid with infinite scroll (currently loads all, then reveals)
- **Tags Tab**: Search functionality with tag filtering
- **Random Tab**: Shows 8 randomly selected articles with refresh capability
- **Article Detail**: Full image, prompt, metadata, share/save functionality

### Technical Stack
- Vue 3 with Composition API
- Ionic Framework 8
- Capacitor for native mobile support
- TypeScript
- Vitest for unit testing
- Cypress for E2E testing
- Vite for building

### Data Layer
- REST API via JSON:API from promptual.puntuale.nl
- LocalStorage cache with 30-minute TTL
- Fetches up to 600 articles and all tags
- Module-level composable for state management

## Problems to Solve

### High Priority
1. **E2E Test is Broken**: Test expects "Tab 1 page" but actual content is "Promptual Gallery"
2. **Infinite Scroll is False**: Currently fetches all articles upfront, just reveals incrementally
3. **Capacitor Config**: Uses generic `io.ionic.starter` app ID instead of unique identifier
4. **Hardcoded Configuration**: API URLs hardcoded, no environment variables

### Architecture Issues
5. **State Management**: Module-level refs in `usePromptualData` could cause issues as app grows
6. **Code Duplication**: Skeleton loaders, headers, search logic repeated across views
7. **API Service Layer Mixes Concerns**: Fetching, caching, and normalization in one file

### Performance Concerns
8. **No Image Lazy Loading**: All images load immediately
9. **Limited Caching**: Only 30-min TTL, no background refresh or stale-while-revalidate
10. **No Virtual Scrolling**: Could impact performance with 600+ items on large screens

### Testing Gaps
11. **Minimal Test Coverage**: No tests for composables, components, or integration
12. **No Mock Data**: Tests rely on live endpoint or no data at all

### User Experience
13. **No Loading States for Images**: Images appear abruptly
14. **Limited Error Recovery**: Only shows error message, no retry mechanism
15. **No Offline Support**: App completely breaks without network
16. **Search Limitations**: No search history, recent searches, or persistent filters

### Accessibility
17. **Missing ARIA Labels**: Icons lack proper labels for screen readers
18. **No Focus Management**: No focus trap or restoration for dynamic content
19. **Keyboard Navigation**: No keyboard shortcuts or clear focus indicators

### Type Safety
20. **Lax TypeScript Rules**: `@typescript-eslint/no-explicit-any` disabled in ESLint

## Requirements

### Functional Requirements

#### FR1: Gallery with True Infinite Scroll
- Fetch articles in pages (30 per page)
- Load next page when user scrolls near bottom
- Show loading indicator during fetch
- Cache each page individually

#### FR2: Enhanced Search Experience
- Debounce search input (300ms current, maintain)
- Search across title, prompt, and tags
- Support multiple tag filters with AND/OR logic
- Persist search filters in query params
- Show recent searches (max 5)
- Clear all filters button

#### FR3: Offline Support
- Detect network status
- Show cached data when offline
- Display "Offline" indicator in header
- Queue failed requests and retry when online
- Sync data when connection restored

#### FR4: Image Loading Optimization
- Lazy load images (use `loading="lazy"` or ion-img lazy)
- Show skeleton/placeholder while loading
- Preload next batch of images
- Handle image load errors gracefully

#### FR5: Improved Error Handling
- Retry failed API calls (exponential backoff, max 3 attempts)
- Show user-friendly error messages
- Provide retry buttons for failed operations
- Log errors to console for debugging
- Distinguish between network, parsing, and validation errors

#### FR6: Favorites/Bookmarks
- Allow users to favorite articles
- Store favorites in localStorage
- Show favorites count on article cards
- Add "Favorites" tab or filter
- Persist favorites across sessions

#### FR7: Enhanced Image Viewing
- Fullscreen image view in detail page
- Pinch-to-zoom on mobile
- Swipe navigation between articles
- Download full-resolution image

#### FR8: Accessibility Compliance
- WCAG AA compliance (contrast, keyboard navigation, screen readers)
- ARIA labels on all interactive elements
- Focus management for modals and dynamic content
- Skip to main content link
- Keyboard shortcuts (e.g., '/' to focus search)

### Non-Functional Requirements

#### NFR1: Performance
- Initial load: < 2s
- Time to interactive: < 3s
- Search response: < 500ms
- Navigation: < 300ms
- Memory stable with 600+ items

#### NFR2: Scalability
- Support 1000+ articles
- Handle 50+ tags efficiently
- Quick search across large dataset

#### NFR3: Reliability
- 99% uptime for critical features
- Graceful degradation on errors
- Data consistency across offline/online states

#### NFR4: Maintainability
- Test coverage > 80% for critical paths
- Clear code structure with minimal duplication
- Comprehensive documentation for complex logic

#### NFR5: Security
- No sensitive data in localStorage
- Validate all API responses
- Sanitize user inputs
- HTTPS only in production

### Technical Requirements

#### TR1: Configuration Management
- Use `.env` files for environment variables
- Support dev, staging, production configs
- API base URL configurable
- Cache TTL configurable
- Feature flags for experimental features

#### TR2: State Management
- Migrate from module-level refs to Pinia store
- Clear state boundaries and ownership
- Reactive state with computed getters
- Actions for mutations

#### TR3: API Layer Separation
- Separate concerns into modules:
  - `api/adapter.ts`: HTTP client, error handling
  - `api/cache.ts`: Cache operations
  - `api/normalizer.ts`: Data transformation
  - `api/articles.ts`: Article-specific operations
  - `api/tags.ts`: Tag-specific operations

#### TR4: Component Architecture
- Extract reusable components:
  - `ArticleGrid`: Grid layout with virtual scroll
  - `ArticleCard`: Individual article display
  - `SearchBar`: Search input with history
  - `TagFilter`: Tag selection interface
  - `LoadingSkeleton`: Consistent loading states
  - `ErrorState`: Error display with retry

#### TR5: Testing Strategy
- Unit tests for:
  - API functions and normalizers
  - Pinia stores/actions
  - Utility functions
- Component tests for:
  - All components
  - User interactions
  - Event handling
- E2E tests for:
  - Critical user flows
  - Offline scenarios
  - Search functionality

#### TR6: Type Safety
- Enable stricter TypeScript rules
- Remove `@typescript-eslint/no-explicit-any` where possible
- Use discriminated unions for error types
- Proper typing for API responses

## Data Models

### Article
```typescript
interface Article {
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
```

### Tag
```typescript
interface Tag {
  id: string;
  name: string;
  description: string | null;
}
```

### Search State
```typescript
interface SearchState {
  query: string;
  selectedTags: string[];
  recentSearches: string[];
  results: Article[];
  isLoading: boolean;
  error: string | null;
}
```

### Cache Entry
```typescript
interface CacheEntry<T> {
  timestamp: number;
  data: T;
  metadata?: {
    page?: number;
    totalPages?: number;
  };
}
```

## API Contracts

### GET /jsonapi/node/article
- Query params:
  - `include`: field_image,field_tags,field_model
  - `sort`: -created
  - `page[limit]`: 30
  - `page[offset]`: number
- Returns: JSON:API response with Article objects

### GET /jsonapi/taxonomy_term/tags
- Query params:
  - `sort`: name
  - `page[limit]`: 100
  - `page[offset]`: number
- Returns: JSON:API response with Tag objects

## Success Criteria

### Phase 1: Critical Fixes
- [ ] E2E tests pass
- [ ] Infinite scroll works correctly (paginated fetching)
- [ ] Capacitor app ID updated
- [ ] Environment variables implemented

### Phase 2: Architecture
- [ ] Pinia store implemented and used
- [ ] API layer separated into modules
- [ ] Shared components extracted
- [ ] Code duplication reduced by 50%

### Phase 3: Performance
- [ ] Image lazy loading implemented
- [ ] Virtual scrolling for large lists (optional)
- [ ] Cache strategy enhanced (stale-while-revalidate)
- [ ] Performance benchmarks met

### Phase 4: UX & Testing
- [ ] Offline support implemented
- [ ] Enhanced error handling with retry
- [ ] Test coverage > 70%
- [ ] Accessibility audit passed

### Phase 5: Features
- [ ] Favorites system implemented
- [ ] Enhanced image viewing (fullscreen, zoom)
- [ ] Search history implemented
- [ ] All features tested and documented

## Out of Scope

- User accounts and authentication
- User-generated content
- Real-time updates (WebSocket, etc.)
- Push notifications
- Social features beyond sharing
- Image editing or manipulation
- Payment processing
- Multi-language support

## Future Considerations

- PWA capabilities (service worker, install prompt)
- Advanced search (fuzzy matching, tags autocomplete)
- Collections/albums for organizing favorites
- Export/import of favorites
- Analytics integration
- A/B testing framework
