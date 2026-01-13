# Promptual App - Implementation Plan

## Overview

This plan outlines the steps to implement the improvements identified in the specification. Work is organized into phases to allow incremental delivery and validation.

## Phase 1: Critical Fixes (Week 1)

### 1.1 Fix Broken E2E Test
**File**: `tests/e2e/specs/test.cy.ts`

**Tasks**:
- Update test to expect actual content ("Promptual Gallery" instead of "Tab 1 page")
- Add tests for each tab (Gallery, Tags, Random)
- Add test for article detail navigation
- Add test for search functionality

**Acceptance Criteria**:
- All E2E tests pass locally
- Tests run in CI environment

**Estimated Time**: 2 hours

### 1.2 Implement True Infinite Scroll
**Files**: `src/services/promptualApi.ts`, `src/composables/usePromptualData.ts`

**Tasks**:
- Modify `loadAllArticles()` to accept page parameters
- Create `loadArticlesPage(page, limit)` function
- Update `usePromptualData` to support incremental loading
- Track total pages and current page
- Remove initial "load all" behavior
- Update Tab1Page to trigger next page load on scroll

**Acceptance Criteria**:
- Only 30 articles load initially
- More articles load as user scrolls
- Loading indicator appears during fetch
- Works correctly with 600+ articles

**Estimated Time**: 4 hours

### 1.3 Update Capacitor Configuration
**File**: `capacitor.config.ts`

**Tasks**:
- Change `appId` from `io.ionic.starter` to `nl.puntuale.promptual`
- Update `appName` if needed
- Update config version number

**Acceptance Criteria**:
- Config file updated with unique app ID
- Documentation updated with new app ID

**Estimated Time**: 0.5 hours

### 1.4 Implement Environment Variables
**Files**: `.env.example`, `.env`, `src/services/promptualApi.ts`

**Tasks**:
- Create `.env.example` with all config variables
- Create `.env` for local development
- Update `promptualApi.ts` to read from `import.meta.env`
- Add types for environment variables
- Update vite.config.ts to load env vars
- Add to .gitignore

**Variables**:
```
VITE_API_BASE_URL=https://promptual.puntuale.nl/jsonapi
VITE_SITE_BASE_URL=https://promptual.puntuale.nl
VITE_CACHE_TTL_MS=1800000
VITE_ARTICLE_PAGE_LIMIT=30
VITE_TAG_PAGE_LIMIT=100
VITE_MAX_ARTICLES=600
```

**Acceptance Criteria**:
- Config loaded from environment
- `.env` not committed to repo
- Different configs work for dev/prod

**Estimated Time**: 2 hours

**Phase 1 Total**: 8.5 hours

---

## Phase 2: Architecture Refactoring (Week 2-3)

### 2.1 Implement Pinia Store
**Files**: `src/stores/articles.ts`, `src/stores/tags.ts`, `src/stores/ui.ts`

**Tasks**:
- Install Pinia: `npm install pinia`
- Create articles store with state, getters, actions
- Create tags store
- Create UI store (loading states, errors, modals)
- Replace `usePromptualData` composable with stores
- Update all components to use stores
- Remove module-level refs from composables

**Store Structure**:
```typescript
// src/stores/articles.ts
interface ArticlesState {
  items: Article[];
  page: number;
  hasMore: boolean;
  favorites: Set<string>;
}

// src/stores/tags.ts
interface TagsState {
  items: Tag[];
  loaded: boolean;
}

// src/stores/ui.ts
interface UIState {
  loading: boolean;
  error: string | null;
  offline: boolean;
}
```

**Acceptance Criteria**:
- Pinia store set up and working
- All components use stores
- Module-level refs removed
- State management is reactive and predictable

**Estimated Time**: 8 hours

### 2.2 Separate API Layer
**Files**: 
- `src/api/adapter.ts` (new)
- `src/api/cache.ts` (new)
- `src/api/normalizer.ts` (new)
- `src/api/articles.ts` (new)
- `src/api/tags.ts` (new)
- `src/services/promptualApi.ts` (refactor/remove)

**Tasks**:
- Create HTTP adapter with error handling and retry logic
- Create cache module with read/write/validate methods
- Extract normalization functions
- Create articles API module
- Create tags API module
- Update stores to use new API modules
- Remove old `promptualApi.ts`

**Acceptance Criteria**:
- Clear separation of concerns
- Each module has single responsibility
- Tests written for each module
- All existing functionality preserved

**Estimated Time**: 10 hours

### 2.3 Extract Reusable Components
**Files**:
- `src/components/ArticleGrid.vue` (new)
- `src/components/ArticleCard.vue` (new - refactor ImageCard)
- `src/components/SearchBar.vue` (new)
- `src/components/TagFilter.vue` (new)
- `src/components/LoadingSkeleton.vue` (new)
- `src/components/ErrorState.vue` (new)
- Update tab pages to use new components

**Tasks**:
- Create `ArticleGrid` with infinite scroll logic
- Refactor `ImageCard` to `ArticleCard` with more props
- Extract search bar logic from Tab2Page
- Extract tag filter logic from Tab2Page
- Create consistent skeleton loader component
- Create error state component with retry button
- Update Tab1Page, Tab2Page, Tab3Page

**Acceptance Criteria**:
- No code duplication for grids, cards, loaders
- Components are reusable and well-documented
- Props and events are clearly defined
- All tab pages work correctly

**Estimated Time**: 8 hours

**Phase 2 Total**: 26 hours

---

## Phase 3: Performance Optimization (Week 3-4)

### 3.1 Implement Image Lazy Loading
**Files**: `src/components/ArticleCard.vue`, `src/views/ArticleDetailPage.vue`

**Tasks**:
- Add `loading="lazy"` attribute to ion-img elements
- Use Ionic's ion-img built-in lazy loading
- Add placeholder/skeleton while loading
- Handle image load errors
- Add blur-up effect (optional)

**Acceptance Criteria**:
- Images load only when near viewport
- Skeleton/placeholder visible during load
- Error state shown for failed images
- Performance improvement measurable

**Estimated Time**: 3 hours

### 3.2 Enhance Cache Strategy
**Files**: `src/api/cache.ts`

**Tasks**:
- Implement stale-while-revalidate pattern
- Add background refresh for stale data
- Add IndexedDB support for larger storage
- Implement cache metadata (version, etag)
- Add cache invalidation on force refresh
- Add cache size limits and LRU eviction

**Acceptance Criteria**:
- Stale data shown immediately, refreshed in background
- Cache works offline for viewed content
- Cache doesn't grow unbounded
- Cache can be cleared programmatically

**Estimated Time**: 6 hours

### 3.3 Implement Virtual Scrolling (Optional)
**Files**: `src/components/ArticleGrid.vue`

**Tasks**:
- Evaluate if virtual scrolling is needed (benchmark performance)
- If needed, implement virtual grid with Vue Virtual Scroller or similar
- Test with 600+ items
- Ensure scroll position is preserved on back navigation

**Acceptance Criteria**:
- List renders smoothly with 600+ items
- Memory usage stable
- Scroll performance is 60fps

**Estimated Time**: 8 hours (if implemented)

**Phase 3 Total**: 17-25 hours

---

## Phase 4: UX & Testing (Week 4-5)

### 4.1 Implement Offline Support
**Files**: 
- `src/stores/ui.ts`
- `src/composables/useNetworkStatus.ts` (new)
- Update all views to show offline indicator

**Tasks**:
- Create network status composable
- Listen to online/offline events
- Show "Offline" indicator in header when offline
- Serve cached data when offline
- Queue failed requests and retry when online
- Add toast notification when status changes

**Acceptance Criteria**:
- App shows cached data when offline
- Clear offline indicator visible
- Requests queued when offline, retry when online
- User knows what's happening

**Estimated Time**: 6 hours

### 4.2 Enhance Error Handling
**Files**: `src/api/adapter.ts`, `src/components/ErrorState.vue`

**Tasks**:
- Implement exponential backoff retry (max 3 attempts)
- Create error type system (NetworkError, ParseError, ValidationError)
- Show user-friendly error messages
- Add retry buttons to error states
- Log errors with context
- Add error reporting (optional)

**Error Types**:
```typescript
type ApiError =
  | { type: 'network'; message: string; retryable: true }
  | { type: 'parse'; message: string; retryable: false }
  | { type: 'validation'; message: string; retryable: false }
  | { type: 'timeout'; message: string; retryable: true };
```

**Acceptance Criteria**:
- All errors are caught and handled
- Users see helpful messages
- Retry works where applicable
- Errors logged for debugging

**Estimated Time**: 4 hours

### 4.3 Improve Test Coverage
**Files**: All source files

**Tasks**:
- Write unit tests for:
  - All API modules
  - Pinia stores and actions
  - Utility functions
  - Normalizer functions
- Write component tests for:
  - ArticleCard
  - SearchBar
  - TagFilter
  - LoadingSkeleton
  - ErrorState
- Write integration tests for:
  - Search flow
  - Offline/online transitions
  - Favorite toggling
- Update E2E tests to cover:
  - All user flows
  - Error scenarios
  - Offline scenarios

**Target Coverage**:
- API layer: 90%+
- Store layer: 80%+
- Components: 70%+
- Overall: 70%+

**Acceptance Criteria**:
- Test coverage targets met
- All critical paths tested
- Tests run in CI
- No flaky tests

**Estimated Time**: 16 hours

### 4.4 Accessibility Audit and Fixes
**Files**: All component files

**Tasks**:
- Audit with axe DevTools or similar
- Fix all accessibility issues
- Add ARIA labels to all icons and buttons
- Implement skip-to-content link
- Add keyboard shortcuts (e.g., '/' for search)
- Ensure focus management for modals and dynamic content
- Verify color contrast (WCAG AA)
- Test with screen reader

**Acceptance Criteria**:
- No axe errors
- WCAG AA compliant
- Fully keyboard navigable
- Works with screen reader

**Estimated Time**: 6 hours

**Phase 4 Total**: 32 hours

---

## Phase 5: New Features (Week 5-6)

### 5.1 Implement Favorites System
**Files**: `src/stores/articles.ts`, `src/components/ArticleCard.vue`, `src/views/FavoritesPage.vue` (new)

**Tasks**:
- Add `favorites: Set<string>` to articles store
- Persist favorites to localStorage
- Add favorite button to ArticleCard
- Show favorite icon on favorited items
- Create Favorites tab or filter
- Add "Favorites" to tab bar (new tab)
- Sync favorites across devices (optional, future)

**Acceptance Criteria**:
- Users can favorite/unfavorite articles
- Favorites persist across sessions
- Favorites view displays favorited items
- Favorite count visible on cards

**Estimated Time**: 6 hours

### 5.2 Enhanced Image Viewing
**Files**: `src/views/ArticleDetailPage.vue`, `src/components/ImageViewer.vue` (new)

**Tasks**:
- Create fullscreen image viewer component
- Add pinch-to-zoom on mobile (use photo-swipe or similar)
- Add swipe navigation between articles
- Add download full-resolution image button
- Add zoom controls for desktop
- Add image metadata overlay

**Acceptance Criteria**:
- Images can be viewed fullscreen
- Zoom works on mobile and desktop
- Swipe between images
- Download works

**Estimated Time**: 8 hours

### 5.3 Search History and Persistence
**Files**: `src/stores/ui.ts`, `src/components/SearchBar.vue`

**Tasks**:
- Add `recentSearches: string[]` to UI store
- Persist recent searches to localStorage
- Show recent searches in search dropdown
- Add "Clear history" button
- Save search filters to URL query params
- Restore filters from URL on page load

**Acceptance Criteria**:
- Recent searches shown (max 5)
- Search can be shared via URL
- Filters persist across navigation
- History can be cleared

**Estimated Time**: 4 hours

### 5.4 Stricter TypeScript Rules
**Files**: `.eslintrc.cjs`, All source files

**Tasks**:
- Remove `@typescript-eslint/no-explicit-any: 'off'`
- Fix all type errors
- Use proper types for API responses
- Add discriminated unions for error types
- Add stricter compilation options

**Acceptance Criteria**:
- No TypeScript errors
- No use of `any` type
- Type coverage > 95%

**Estimated Time**: 8 hours

**Phase 5 Total**: 26 hours

---

## Phase 6: Documentation & Polish (Week 6-7)

### 6.1 Update Documentation
**Files**: `README.md`, `AGENTS.md`, `CONTRIBUTING.md` (new)

**Tasks**:
- Update README with current features
- Document environment variables
- Document API contracts
- Update AGENTS.md with new conventions
- Create CONTRIBUTING.md with setup instructions
- Document component usage with examples
- Add inline code comments for complex logic

**Acceptance Criteria**:
- All documented features match actual code
- New developers can onboard quickly
- Examples are clear and accurate

**Estimated Time**: 6 hours

### 6.2 Performance Benchmarking
**Files**: Performance test suite (new)

**Tasks**:
- Set up Lighthouse CI
- Benchmark initial load, navigation, search
- Measure memory usage with large datasets
- Optimize based on findings
- Document performance metrics

**Target Metrics**:
- Lighthouse score > 90
- Initial load < 2s
- Navigation < 300ms
- Search < 500ms

**Acceptance Criteria**:
- All performance targets met
- Benchmarks automated in CI
- Performance documented

**Estimated Time**: 4 hours

### 6.3 Security Review
**Files**: All source files

**Tasks**:
- Audit for XSS vulnerabilities
- Review localStorage usage
- Validate all API responses
- Review CORS configuration
- Test input sanitization
- Document security measures

**Acceptance Criteria**:
- No security vulnerabilities found
- All inputs validated
- No sensitive data in localStorage

**Estimated Time**: 4 hours

### 6.4 Final Testing & Bug Fixes
**Files**: All source files

**Tasks**:
- Run full test suite
- Manual testing on all platforms
- Fix any bugs found
- User acceptance testing (optional)
- Polish animations and transitions

**Acceptance Criteria**:
- All tests pass
- No critical bugs
- Smooth user experience

**Estimated Time**: 8 hours

**Phase 6 Total**: 22 hours

---

## Summary

**Total Estimated Time**: 131.5 - 139.5 hours (16-18 working days)

### Timeline
- **Week 1**: Phase 1 - Critical Fixes
- **Week 2-3**: Phase 2 - Architecture Refactoring
- **Week 3-4**: Phase 3 - Performance Optimization
- **Week 4-5**: Phase 4 - UX & Testing
- **Week 5-6**: Phase 5 - New Features
- **Week 6-7**: Phase 6 - Documentation & Polish

### Dependencies
- Phase 2 depends on Phase 1 (env vars needed)
- Phase 3 depends on Phase 2 (Pinia store needed)
- Phase 4 can start after Phase 2
- Phase 5 can start after Phase 2
- Phase 6 requires all other phases

### Parallelization Opportunities
- Within Phase 2: API layer and component extraction can be done in parallel
- Phase 4 tasks can be done in parallel
- Phase 5 features can be developed in parallel

### Risk Mitigation
- **Risk**: Pinia migration breaks existing functionality
  - **Mitigation**: Run tests after each migration step, keep old code until fully working
  
- **Risk**: Performance optimization introduces bugs
  - **Mitigation**: Benchmark before and after, extensive testing
  
- **Risk**: Offline support complex to implement
  - **Mitigation**: Implement incrementally, test thoroughly
  
- **Risk**: Test coverage target not met
  - **Mitigation**: Write tests alongside features, not as afterthought

### Success Metrics
- All E2E tests passing
- Lighthouse score > 90
- Test coverage > 70%
- No critical bugs in production
- Performance targets met
- Accessibility audit passed

### Next Steps
1. Review and approve this plan
2. Set up CI/CD with test automation
3. Begin Phase 1 implementation
4. Regular reviews at end of each phase
5. Adjust plan as needed based on findings
