# Application layer

Use cases (application-specific business rules) and the **ports** (interfaces) they
depend on. Use cases orchestrate the domain; ports define the boundaries the data
layer implements and the composition root wires up.

**Dependency rule:** may import `domain` only. Framework-agnostic — no `react`/`expo`/etc.
