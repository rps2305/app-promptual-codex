# Promptual App - Constitution

## Core Principles

### Simplicity Over Complexity
- Prefer straightforward solutions that are easy to understand and maintain
- Each component, composable, and utility should have a single, clear responsibility
- Avoid over-engineering; solve the actual problem at hand

### Test-First Development
- Write tests before implementing features when feasible
- Maintain test coverage for critical paths and user-facing functionality
- Tests should serve as living documentation for expected behavior

### Performance as a Requirement
- Startup time should be under 2 seconds
- Interactive actions (search, navigation) should feel instantaneous
- Image loading should not block the main thread
- Memory usage should remain stable with large datasets

### User Experience Consistency
- Maintain consistent interaction patterns across all views
- Provide clear feedback for all user actions (loading states, success, errors)
- Support offline scenarios gracefully
- Ensure accessibility standards are met for all features

### Code Quality Standards
- Follow existing code style and conventions (2-space indentation, TypeScript)
- Maintain type safety; avoid `any` types unless absolutely necessary
- Keep functions small and focused
- Document complex logic with inline comments

## Quality Bar

### Before Shipping
- All new features must have tests (unit and/or integration)
- No linting errors
- TypeScript compilation succeeds
- Manual testing on target platforms (mobile web, iOS, Android)

### Performance Thresholds
- Initial page load: < 2s
- Time to interactive: < 3s
- First contentful paint: < 1s
- Search response: < 500ms
- Navigation between views: < 300ms

### Accessibility Requirements
- All interactive elements must be keyboard accessible
- All icons must have aria-labels or aria-describedby
- Focus management must be handled for modals and dynamic content
- Color contrast must meet WCAG AA standards (4.5:1 for text)

## Architecture Principles

### Modularity
- Features should be self-contained modules with clear interfaces
- Shared utilities should live in dedicated directories
- Avoid circular dependencies

### Data Flow
- Unidirectional data flow preferred
- State changes should be predictable and traceable
- API layer should be separate from UI components

### Caching Strategy
- Cache API responses to minimize network requests
- Respect cache TTL (currently 30 minutes)
- Provide mechanisms to invalidate cache when needed

## Deployment Standards

### Environment Management
- Use environment variables for configuration
- Never commit secrets or API keys
- Maintain separate configurations for dev, staging, and production

### Build Process
- Production builds must be optimized and minified
- Source maps should be available for debugging
- Assets should be properly versioned for cache busting

## Maintenance Guidelines

### Dependency Management
- Keep dependencies up to date
- Review security advisories regularly
- Remove unused dependencies

### Documentation
- README should reflect current state and setup instructions
- AGENTS.md should be updated when conventions change
- Complex algorithms or business logic should be documented

### Error Handling
- Errors should be caught and presented to users clearly
- Technical errors should be logged for debugging
- Provide recovery options when possible

## Commitment

This constitution serves as the guiding framework for all development decisions. When in doubt, refer to these principles. Any deviation should be intentional and documented with reasoning.
