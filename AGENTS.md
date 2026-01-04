# Repository Guidelines

## Principles & Quality Bar
- Prioritize simplicity, test-first development, and minimal dependencies.
- Favor code quality and maintainability over delivery speed.
- Keep architecture modular and well-documented with clear ownership boundaries.
- Maintain consistent user experience patterns across views and components.
- Treat performance as a requirement: fast startup, responsive navigation, and efficient rendering.

## Product Scope
- Mobile web app that displays AI-generated images from `https://promptual.puntuale.nl`.
- Users can browse the gallery, search by title, prompt, or tag, and view a random section.
- Random section includes a refresh action to load new images.
- Use the site JSON API to fetch tags and articles, and cache both for reuse.

## Project Structure & Module Organization
- `src/` holds the Vue 3 + Ionic app code, with `App.vue` as the entry layout.
- `src/components/` contains reusable Vue components; `src/views/` holds routed pages.
- `src/router/` defines route configuration; `src/theme/` holds Ionic theme variables.
- `public/` stores static assets served as-is; `resources/` contains Ionic/Capacitor assets.
- `tests/unit/` contains Vitest specs; `tests/e2e/` contains Cypress specs and fixtures.
- Root configs include `vite.config.ts`, `tsconfig*.json`, `cypress.config.ts`, and `capacitor.config.ts`.

## Build, Test, and Development Commands
- `ionic serve` starts the Ionic dev server for local development (preferred over npm scripts).
- `npm run build` runs type checks (`vue-tsc`) and creates a production build with Vite.
- `npm run preview` serves the production build locally for verification.
- `npm run test:unit` runs unit tests with Vitest.
- `npm run test:e2e` runs Cypress end-to-end tests.
- `npm run lint` checks lint rules with ESLint.

## Coding Style & Naming Conventions
- Use TypeScript and Vue SFCs (`.vue`) with 2-space indentation, matching `src/App.vue`.
- Name Vue components in PascalCase (for example, `App.vue`, `MyWidget.vue`).
- ESLint enforces `plugin:vue/vue3-essential` and `@vue/typescript/recommended`.
- No formatter is configured; keep style consistent with nearby code.

## Testing Guidelines
- Unit tests use Vitest; see `tests/unit/example.spec.ts` for patterns.
- E2E tests use Cypress; specs live in `tests/e2e/specs/*.cy.ts`.
- No explicit coverage thresholds are defined; add tests for new or changed behavior.
- Prefer writing tests before implementation, and update tests when behavior changes.

## Configuration & Environment
- Project-level settings live in `ionic.config.json` and `capacitor.config.ts`.
- Build tooling is configured in `vite.config.ts` and `tsconfig.json`.
- Keep environment-specific values out of source; prefer `.env` files if introduced later.
- In sandboxed environments, point Ionic CLI at a repo-local config directory:
  `IONIC_CONFIG_DIRECTORY=.ionic ionic serve`

## Local Dev Convenience
- Optional shell alias to avoid global config writes:
  `alias ionic-local='IONIC_CONFIG_DIRECTORY=.ionic ionic'`
- Example usage: `ionic-local serve`
- Run npm scripts from `ionic-codex/promptual`; if you are in `ionic-codex/`, use `./ionic-serve.sh`.

## CloudPanel Deployment (promptual-app.puntuale.nl)
- Create a new site in CloudPanel as a Node.js app.
- Set the domain to `promptual-app.puntuale.nl`.
- Set the app root to the repo root and the public root to `dist/` (Vite output).
- Set the Node.js version to match the project (LTS recommended).
- Build the app on the server:
  - `npm ci`
  - `npm run build`
- If using CloudPanel Git deployment hooks, run `npm ci` and `npm run build` in the deploy script so `dist/` stays current.
- Ensure HTTPS is enabled in CloudPanel for the domain.

## Performance & UX Requirements
- Avoid unnecessary re-renders and keep list rendering virtualized or paginated when needed.
- Cache API responses for tags and articles to minimize repeated fetches.
- Keep interaction patterns consistent across views (search, filters, and navigation).

## Assets & Styling
- Global Ionic theme variables live in `src/theme/`.
- Static assets belong in `public/` and can be referenced by absolute paths (for example, `/logo.svg`).
- Mobile icons and splash screens belong in `resources/`.

## Commit & Pull Request Guidelines
- Git history currently shows only `Initial commit`, so no formal convention exists.
- Use short, imperative commit messages (for example, "Add login flow").
- Pull requests should describe the change, note how it was tested, and include UI screenshots when relevant.
