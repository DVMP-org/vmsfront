# Final Operations Hub browser evidence

Captured against the integrated `vmsfront` master build with controlled
canonical API fixtures in Chromium.

The screenshot set covers organization selection, organization home,
workspaces, `/select` compatibility, dashboard, Properties, People,
invitations, Charges, Gates, Check-in / check-out, consolidated organization
settings, administration, roles, admin-owned Plugins and Integrations,
Community, Transactions, account Profile, plans, the design-system source of
truth, login and isolated first-place onboarding at 1440, 768, 390, and 320px.

The onboarding proof follows the authoritative sequence: authenticated login →
organization index → create organization → plan → standalone first place →
Workspaces. First-place setup is captured from the no-Place management guard
and must land at `/setup/first-place/` without rendering the admin shell.

The final bitmap set is explicitly allowlisted in `.gitignore` so it remains
available as review evidence. `results.json` records route, viewport, heading,
document overflow, page errors, console errors, and screenshot names.

Final assertions across 92 captures:

- zero document/body horizontal overflow at 320, 390, 768 and 1440px
- every captured route reached its expected redirect and exposed an H1
- no missing heading or failed expected-path navigation
- first-place mobile captures were repeated independently after the hydration
  fix and remained overflow-free at 390 and 320px

The JSON retains development-server WebSocket and transient HMR navigation
messages because it records the browser session verbatim. Production CI,
typecheck, Vitest and the controlled browser route content are the acceptance
gates; the design-system route is the source-of-truth render check for the kit.
