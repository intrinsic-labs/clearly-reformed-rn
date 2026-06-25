# Presentation layer

The React/UI side: theme, components, support hooks, and TanStack Query hooks that
call use cases. Consumes the domain and application layers; receives concrete
repositories through a DI context wired by the composition root in `app/`.

**Dependency rule:** may import `domain`, `application`, and UI libraries — but NOT `data`.
