# Data layer (interface adapters)

Implementations of the application ports: API gateways, DTOs, and mappers that
translate external shapes (WordPress REST, podcast RSS, SQLite later) into domain
entities. Populated in the Library slice (the `all-resources` repository) and beyond.

**Dependency rule:** may import `domain` and `application`. Never `presentation` or `app`.
