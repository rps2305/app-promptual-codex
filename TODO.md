# TODO

## High Priority
- [x] Fix Tab2Page - add infinite scroll pagination for filtered articles
- [x] Fix onInfinite in Tab1Page - cap at filteredArticles.length (not articles.length)
- [x] Add empty state when filters match zero articles (Tab1 & Tab2)
- [x] Fix race condition in usePromptualData - atomic loading guard (check `loading.value` too)

## Medium Priority
- [x] Bump cache key version to v2 for invalidation
- [x] Add retry button on error state (Tab1, Tab2, Tab3)
- [x] Add NSFW filter to Random tab (Tab3)
- [x] Add 'Show less' button to collapse tags on Tab2Page

## Low Priority / Nice-to-haves
- [x] Fix logo filename if needed (already correct at public/promptual-logo.png)
- [ ] Dark mode no manual toggle — currently system-only
- [ ] No service worker — no offline support if you ever go PWA
- [ ] `index.html` likely lacks Open Graph / social meta tags — important if shared as a web app
- [ ] Add empty state to Random tab (Tab3)
