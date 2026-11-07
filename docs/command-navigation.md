# Admin command navigation (UR-03 slice)

The admin header opens a page finder with the button or Control/Command + K. Search is limited to existing admin routes permitted by the freshly fetched current admin role. Nested routes retain their own permission requirements; duplicate destinations are removed. Failed or pending profile fetches expose only unconditional destinations.

The modal supports arrow selection, Enter, Escape, pointer selection, empty search results, focus containment and restoration. Changes to organization, user, route or role close the session. No organization or workspace selection is persisted by this component, and destination routes retain their existing guards.

This completes command navigation for the current admin shell. Organization → Property → Workspace switching, work queues, recent context, notification changes, plugin commands and the full shell migration remain separate UR-03 work. Existing route names are preserved until the canonical route cutover.

Verification: frozen dependency install, root `pnpm verify`, component tests, desktop and 390px browser journeys. Evidence under `docs/evidence/ur03-command-navigation/` uses a synthetic tenant with intercepted API fixtures; the browser visits a portless HTTPS tenant URL backed by an isolated local server. No customer data is used.

To reproduce the screenshots, run the built root app on port 3018 in an isolated process, then run `node docs/evidence/ur03-command-navigation/capture.cjs` from the repository root. The capture script intercepts application and API traffic inside its own browser context, including tenant host forwarding. It verifies selected-option scrolling, modal focus containment/restoration and Enter navigation at each viewport. Component tests cover permission filtering, stale context invalidation, and duplicate Header instances.
