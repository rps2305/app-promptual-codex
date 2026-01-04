# Promptual (Ionic + Vue)

Mobile web app for browsing AI-generated images from `https://promptual.puntuale.nl`.

## Quick start

```bash
npm ci
IONIC_CONFIG_DIRECTORY=.ionic ionic serve
```

If you prefer a shorter command:

```bash
alias ionic-local='IONIC_CONFIG_DIRECTORY=.ionic ionic'
ionic-local serve
```

## Scripts

```bash
npm run build
npm run preview
npm run test:unit
npm run test:e2e
npm run lint
```

## Mobile (Capacitor)

Platforms are checked in under `android/` and `ios/`.

```bash
npm run build
npx cap sync
npx cap open android
npx cap open ios
```

Notes:
- Android requires a Java runtime and Android Studio/SDK.
- iOS requires Xcode on macOS.
- Re-run `npm run build` and `npx cap sync` after web changes.

## Project structure

- `src/` Vue 3 + Ionic app code
- `src/components/` reusable components
- `src/views/` routed pages
- `src/router/` route configuration
- `src/theme/` global theme variables
- `public/` static assets
- `resources/` Ionic/Capacitor assets
- `tests/unit/` Vitest specs
- `tests/e2e/` Cypress specs

## Product behavior

- Browse a gallery of AI images
- Tags tab for search + tag filtering (search bar toggled from the header)
- Random section with refresh
- API responses for tags/articles are cached for reuse
- Detail view supports sharing; saving to Photos is Android-only (Promptual album)
