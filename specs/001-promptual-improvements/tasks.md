# Tasks - Promptual App Improvements

**Feature Branch**: `001-promptual-improvements`
**Generated**: 2025-01-13
**Status**: Ready for implementation

## User Stories & Phases

This document organizes all implementation tasks by user story and phase. Tasks are ordered to enable independent delivery and testing.

---

## US1: Browse Gallery with Infinite Scroll (Priority: P1)

### Phase 1: Setup & Infrastructure (Blocking for all stories)

- [X] [T001] [P1] [US1] Create project structure and add Pinia dependency - src/stores/index.ts
  - File path: `src/stores/index.ts`
  - Description: Initialize Pinia with createPinia() and install plugin for persistence
  - Dependencies: pinia, @pinia/plugin-persistedstate, idb (for IndexedDB support)
  - Acceptance Criteria: Running `npm install` and importing Pinia works without errors

- [X] [T002] [P1] [US1] Add TypeScript environment configuration - .env.example, .env
  - File path: `src/.env.example`, `src/.env`
  - Description: Create environment variable template with all VITE_* variables defined in spec (API_BASE_URL, CACHE_TTL_MS, ARTICLE_PAGE_LIMIT, TAG_PAGE_LIMIT, MAX_ARTICLES)
- - Dependencies: vite
  - Acceptance Criteria: .env.example file exists with all required variables, .env can be created from template

- [X] [T003] [P1] [US1] Create API adapter module - src/api/adapter.ts
  - File path: `src/api/adapter.ts`
  - Description: Implement HTTP client using fetch/CapacitorHttp, error handling, and retry logic with exponential backoff (1s, 2s, 4s intervals, max 3 attempts)
  - Dependencies: CapacitorHttp
  - Implementation Notes: Custom `retryWithBackoff` function with configurable delays
- - Acceptance Criteria: Function handles timeout and server errors, retries 3 times with increasing delays

- [X] [T004] [P1] [US1] Create cache module - src/api/cache.ts
  - File path: `src/api/cache.ts`
  - Description: Implement caching with IndexedDB for articles/tags, localStorage fallback for small data. Includes read, write, validate, clear, and stale-while-revalidate strategy
  - Dependencies: idb (to be added: npm install idb)
  - Acceptance Criteria: Cache works in localStorage and IndexedDB, can clear entries by pattern

- [X] [T005] [P1] [US1] Create data normalizer module - src/api/normalizer.ts
  - File path: `src/api/normalizer.ts`
  - Description: Extract normalization functions from existing promptualApi.ts into separate module. Includes normalizeArticle, normalizeTag with all validation
- - Dependencies: None
  - Acceptance Criteria: Normalization functions extracted with same behavior

- [X] [T006] [P1] [US1] Create articles API module - src/api/articles.ts
  - File path: `src/api/articles.ts`
  - Description: Implement article-related API operations: getArticles(page, limit), getArticleById(id), searchArticles(options), hasMore(currentPage, loadedCount)
- - Dependencies: adapter.ts, cache.ts, normalizer.ts
- Acceptance Criteria: Uses cache, handles pagination, implements search filtering, returns paginated results

### Phase 2: Foundation Components (Blocking for US1, US2, US3, US4, US5, US6)

- [X] [T007] [P1] [US1] Create ArticleGrid component - src/components/ArticleGrid.vue
  - File path: `src/components/ArticleGrid.vue`
  - Description: Grid layout with ion-infinite-scroll, displays articles, handles load more and end states
  - Dependencies: @ionic/vue, usePromptualData store
  - Implementation Notes: Use ion-infinite-scroll component with 80% threshold

- [X] [T008] [P1] [US1] Create ArticleCard component - src/components/ArticleCard.vue
  - File path: `src/components/ArticleCard.vue`
  - Description: Refactor existing ImageCard.vue with improved props, add favorite button, show favorite count, handle image placeholder on error
- - Dependencies: @ionic/vue
  - Implementation Notes: Replaces ImageCard.vue, adds favoriting functionality

- [X] [T009] [P1] [US1] Create SearchBar component - src/components/SearchBar.vue
  - File path: `src/components/SearchBar.vue`
  - Description: Search input with history dropdown (max 5), debounced input (300ms), clear history support
- - Dependencies: @ionic/vue
  - Implementation Notes: Search input with ion-searchbar, maintains search state locally

- [X] [T010] [P1] [US2] Create TagFilter component - src/components/TagFilter.vue
  - File path: `src/components/TagFilter.vue`
  - Description: Tag selection interface with ion-chip components, clear all button, supports multiple tag selection (AND logic)
- Dependencies: @ionic/vue
  - Implementation Notes: Reusable tag filter with selected state management

- [X] [T011] [P1] [US1] Create LoadingSkeleton component - src/components/LoadingSkeleton.vue
  - File path: `src/components/LoadingSkeleton.vue`
  - Description: Consistent loading state skeleton for article cards and detail views
- - Dependencies: @ionic/vue
  - Implementation Notes: Uses ion-skeleton-text for placeholder loading states

- [X] [T012] [P1] [US1] [US4] Create ErrorState component - src/components/ErrorState.vue
  - File path: `src/components/ErrorState.vue`
  - Description: Error display with retry button, user-friendly messages for different error scenarios
- Dependencies: @ionic/vue
  - Implementation Notes: Handles API errors, network errors, cache errors, quota exceeded

### Phase 3: Feature Implementation (Per story)

#### US1: Browse Gallery with Infinite Scroll

- [X] [T013] [P1] [US1] Implement paginated article loading in store - src/stores/articles.ts
  - File path: `src/stores/articles.ts`
  - Description: Add state for articles (items array, currentPage, hasMore, totalPages), actions for loadNextPage and resetPagination
- Dependencies: api/articles.ts
- Implementation Notes: Uses cache, handles pagination logic with 30 items per page

- [X] [T014] [P1] [US1] Update Tab1Page to use ArticleGrid and store - src/views/Tab1Page.vue
  - File path: `src/views/Tab1Page.vue`
  - Description: Replace hardcoded grid with ArticleGrid, use store for articles loading
- Dependencies: ArticleGrid.vue, stores/articles.ts
- Implementation Notes: Remove old loading logic, use reactive store

- [X] [T015] [P1] [US1] Add scroll position preservation - src/views/Tab1Page.vue
- - File path: `src/views/Tab1.vue`
  - Description: Store scroll position on scroll events, restore on mount
- Dependencies: stores/articles.ts
- Implementation Notes: Use window.scrollY for state persistence

- [X] [T016] [P1] [US1] Implement "You've seen all articles" message - src/views/Tab1Page.vue
  - File path: `src/views/Tab1Page.vue`
  - Description: Add display at bottom of grid when all content loaded, optional "Back to top" button
- Dependencies: ArticleGrid.vue or custom component
- Implementation Notes: Appears when hasMore returns false

- [X] [T017] [P1] [US1] Update ArticleGrid to handle end of scroll - src/components/ArticleGrid.vue
  - File path: `src/components/ArticleGrid.vue`
  - Description: Add logic to show "You've seen all articles" message when hasMore is false, disable infinite scroll
- Dependencies: stores/articles.ts
- Implementation Notes: Check hasMore after loading next page, show end state

#### US2: Search and Filter Artwork

- [X] [T018] [P2] [US2] Implement search state in store - src/stores/ui.ts
- File path: `src/stores/ui.ts`
  - Description: Add search state (query string, selectedTagIds string[], recentSearches string[], filteredArticles Article[], isLoading boolean, error string | null)
- Dependencies: localStorage (for search history persistence)
- Implementation Notes: Persist search history to localStorage, limit to 5 most recent

- [ ] [T019] [P2] [US2] Create SearchBar component - src/components/SearchBar.vue (already created in Phase 2)

- [ ] [T020] [P2] [US2] Implement TagFilter component - src/components/TagFilter.vue (already created in Phase 2)

- [X] [T021] [P2] [US2] Update Tab2Page to use SearchBar and TagFilter - src/views/Tab2Page.vue
- File path: `src/views/Tab2Page.vue`
  - Description: Replace inline search and tag UI with reusable components
- Dependencies: SearchBar.vue, TagFilter.vue, stores/ui.ts
- Implementation Notes: Remove duplicated code, connect to search state

- [X] [T022] [P2] [US2] Implement search persistence to URL params - src/stores/ui.ts
- File path: `src/stores/ui.ts`
  - Description: Persist search filters (query and selected tags) to URL query params on route update
- Dependencies: vue-router
- Implementation Notes: Watch route, update state on mount, sync from URL params

#### US3: Discover Random Artwork

- [X] [T023] [P2] [US3] Update Tab3Page to use ArticleGrid and store - src/views/Tab3Page.vue
- File path: `src/views/Tab3Page.vue`
  Description: Replace hardcoded grid with ArticleGrid, use store for articles loading
- Dependencies: ArticleGrid.vue, stores/articles.ts
- Implementation Notes: Similar to Tab1Page update

- [X] [T024] [P2] [US3] Implement refresh functionality - src/views/Tab3Page.vue
- File path: `src/views/Tab3Page.vue`
- - Description: Add "Refresh" button that calls refreshRandom() action
- Dependencies: stores/articles.ts
- Implementation Notes: Uses store action to load new random selection

#### US4: View Article Details

- [X] [T025] [P1] [US4] Create fullscreen image viewer component - src/components/ImageViewer.vue
- File path: `src/components/ImageViewer.vue`
  - Description: Modal/overlay with pinch-to-zoom, double-tap to reset zoom, zoom in/out buttons for desktop
- Dependencies: @ionic/vue
- Implementation Notes: Touch event handling, CSS transform-based zoom, keyboard navigation

- [X] [T026] [P1] [US4] Integrate ImageViewer into ArticleDetailPage - src/views/ArticleDetailPage.vue
- File path: `src/views/ArticleDetailPage.vue`
  Description: Add fullscreen button to open ImageViewer, wire up zoom events
- Dependencies: ImageViewer.vue, stores/articles.ts
- Implementation Notes: Button visible on detail page, opens modal with article image

- [ ] [T027] [P1] [US4] Enhance share functionality in adapter - src/api/adapter.ts
- File path: `src/api/adapter.ts`
  - Description: Add file download capability to fetch for native share (Capacitor Share plugin)
- Dependencies: @capacitor/share
- Implementation Notes: When image fetched for sharing, save to device before sharing

- [ ] [T028] [P1] [US4] Enhance save functionality in adapter - src/api/adapter.ts
- File path: `src/api/adapter.ts`
- Description: Add Media plugin usage for Android image saving to "Promptual" album
- Dependencies: @capacitor-community/media
- Implementation Notes: On Android: create/reuse album, save to that album; on iOS: save to camera roll

- [ ] [T029] [P1] [US4] Update ArticleCard to show favorite button - src/components/ArticleCard.vue
- File path: `src/components/ArticleCard.vue`
- - Description: Add favorite icon button, wire to store toggle action, show filled state
- Dependencies: stores/articles.ts
- Implementation Notes: Use new favorite prop passed from store or local computed

- [ ] [T030] [P1] [US4] Update ArticleDetailPage to show favorite button - src/views/ArticleDetailPage.vue
  File path: ` `src/views/ArticleDetailPage.vue`
  Description: Add favorite icon button, sync with ArticleCard state
- Dependencies: stores/articles.ts, ArticleCard.vue
- Implementation Notes: Shows same favorite functionality

#### US5: Favorite and Organize Artwork

- [X] [T031] [P2] [US5] Add Favorites tab to router - src/router/index.ts
- File path: `src/router/index.ts`
  Description: Add /tabs/favorites route to Tab1Page with favorites query param
- Dependencies: stores/articles.ts
- Implementation Notes: New route displays favorited articles

- [X] [T032] [P2] [US5] Create FavoritesPage component - src/views/FavoritesPage.vue
- File path: `src/views/FavoritesPage.vue`
- Description: Create page to display all favorited articles in grid layout using ArticleGrid
- Dependencies: ArticleGrid.vue, stores/articles.ts
- Implementation Notes: Reuses ArticleGrid, filters by favorites only

- [ ] [T033] [P2] [US5] Add favorite badge to ArticleCard - src/components/ArticleCard.vue
- File path: `src/components/ArticleCard.vue`
- Description: Show favorite count badge on cards in favorites view
- Dependencies: stores/articles.ts, ArticleCard.vue
- Implementation Notes: Count computed from store based on favorites Set

- [ ] [T034] [P2] [US5] Add favorite toggle to Tab1Page - src/views/Tab1Page.vue
- File path: `src/views/Tab1Page.vue`
- File path: `src/views/Tab1Page.vue`
- Description: Add favorite button to cards in gallery view
- Dependencies: stores/articles.ts, ArticleCard.vue
- Implementation Notes: Syncs with ArticleCard favorite state

#### US6: Use App Offline

- [ ] [T035] [P2] [US6] Create network status composable - src/composables/useNetworkStatus.ts
- File path: `src/composables/useNetworkStatus.ts`
- Description: Detect online/offline events using navigator.onLine and window events
- Dependencies: None
- Implementation Notes: Returns reactive isOnline boolean

- [ ] [T036] [P2] [US6] Add offline indicator to all page headers - src/views/Tab1Page.vue, src/views/Tab2Page.vue, src/views/Tab3Page.vue, src/views/ArticleDetailPage.vue
- File path: All page headers
- Description: Add "Offline" badge that appears when disconnected, positioned in header slot
- Dependencies: useNetworkStatus.ts
  Implementation Notes: Uses reactive isOnline from composable

- [ ] [T037] [P2] [US6] Implement request queue in UI store - src/stores/ui.ts
- File path: `src/stores/ui.ts`
- Description: Add offline request queue array state, methods to add request, clear all, retry when online
- Dependencies: localStorage
- Implementation Notes: Queue persists to localStorage, retry logic in adapter.ts

- [ ] [T038] [P2] [US6] Implement offline request retry logic in adapter - src/api/adapter.ts
- File path: `src/api/adapter.ts`
- Description: Queue requests when offline, automatically retry when online using exponential backoff
- Dependencies: stores/ui.ts (for queue management)
- Implementation Notes: Calls retryWithBackoff, uses queue from store

- [ ] [T039] [P2] [US6] Implement cached content serving - src/views/Tab1Page.vue, src/views/Tab2Page.vue, src/views/Tab3Page.vue, src/views/ArticleDetailPage.vue
- File path: All pages
- Description: When offline, serve from cache instead of showing error
- Dependencies: cache.ts, stores/articles.ts
  Implementation Notes: Check network status before displaying, show cached articles with toast if queueing

### Phase 4: Polish & Cross-Cutting Concerns

- [ ] [T040] [P1] [US4] Add image lazy loading - src/components/ArticleCard.vue
- File path: `src/components/ArticleCard.vue`
- Description: Add `loading="lazy"` attribute to ion-img, handle load/error with placeholder
- Dependencies: @ionic/vue
  - Acceptance Criteria: Images load only when near viewport

- [ ] [T041] [P1] [US1] Add ARIA labels - All components
- File path: All components
- Description: Add aria-label to all interactive elements without labels (icons, buttons, search bar, favorite buttons)
- Dependencies: None
- Acceptance Criteria: WCAG AA compliance met for 100% of interactive elements

- [ ] [T042] [P1] [US4] Add keyboard shortcuts - src/views/Tab1Page.vue
- File path: `src/views/Tab1Page.vue`
- Description: Add "/" shortcut to focus search bar when not in search tab
- Dependencies: stores/ui.ts (for search focus state)
- Implementation Notes: Keyboard handler calls focus() on search bar

- [ ] [T043] [P2] [US6] Update Capacitor app ID - capacitor.config.ts
- File path: `capacitor.config.ts`
- Description: Change appId from `io.ionic.starter` to `nl.puntuale.promptual`
- Dependencies: None
- Acceptance Criteria: App ID updated for production builds

- [ ] [T044] [P1] [P2] [US5] Update E2E tests - tests/e2e/specs/gallery.cy.ts
- File path: `tests/e2e/specs/gallery.cy.ts`
- Description: Fix broken E2E test expecting "Tab 1 page", add tests for infinite scroll, search, favorites
- Dependencies: None
- Acceptance Criteria: All E2E tests pass

- [ ] [T045] [P1] [P1] [US2] Write component tests - tests/unit/components/*.spec.ts
- File paths: `tests/unit/components/`
- Description: Add unit tests for all new components (ArticleGrid, ArticleCard, SearchBar, TagFilter, LoadingSkeleton, ErrorState)
- Dependencies: @vue/test-utils, vitest, jsdom
- Acceptance Criteria: >70% coverage for critical components

- [ ] [T046] [P1] [P2] [US6] Write store tests - tests/unit/stores/*.spec.ts
- File paths: `tests/unit/stores/`
- Description: Add unit tests for all stores (articles, tags, ui)
- Dependencies: pinia, vitest
- Acceptance Criteria: >70% coverage for store logic

- [ ] [T047] [P2] [US6] Write API tests - tests/unit/api/*.spec.ts
- File paths: `tests/unit/api/`
- Description: Add unit tests for API modules (adapter, cache, normalizer, articles, tags)
- Dependencies: vitest, msw, fetch-mock (adapter)
- Acceptance Criteria: >70% coverage for API layer

- [ ] [T048] [P2] [US6] Write integration tests - tests/e2e/specs/offline.cy.ts
- File path: `tests/e2e/specs/offline.cy.ts`
- Description: Add E2E tests for offline functionality (network detection, cached content serving, request queue retry)
- Dependencies: cypress, test data fixtures
- Acceptance Criteria: All offline scenarios covered

### Dependencies Graph

This section shows the recommended order for implementing user stories to maximize parallel execution while respecting dependencies.

```
[ ] **Legend**:
- `[US1]` = User Story 1, `[P2]` = User Story 2, etc.
- `[T]` = Task within story, numbered sequentially

**Story Completion Order**: US1 → US2 → US3 → US4 → US5 → US6 (dependencies between stories)

**Setup Phase** (Phase 1 - must complete before any user story implementation):
- T001, T002, T003, T004, T005, T006, T007, T008, T009
- T010 (dependencies for all user stories)

**Per-Story Phases**:
- US1: T001, T002, T013, T014, T015, T016, T017, T018, T019, T020, T021, T022
- US2: T018, T019, T020, T021, T022
- US3: T023, T024
- US4: T025, T026, T027, T028, T029, T030
- US5: T031, T032, T033, T034
- US6: T035, T036, T037

```