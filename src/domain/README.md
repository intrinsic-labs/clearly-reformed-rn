# Domain layer

Enterprise entities and value types — the app's core vocabulary (`Resource`, `ContentType`).

**Dependency rule:** depends on nothing. No `react`, `react-native`, `expo`, networking,
or persistence may be imported here (enforced by `eslint-plugin-boundaries`).
