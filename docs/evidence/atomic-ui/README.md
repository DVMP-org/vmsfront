# Atomic forms, overlays and unit details

Date: 2026-11-11. Status: local implementation; browser visual acceptance pending.

## Changes

- Shared fields support optional decorative icons, clearer control boundaries,
  hover/focus treatment and text-plus-icon validation. Form sections support
  small heading icons without changing existing labels or input semantics.
- Modal and drawer headers share one component. Modal footers can remain fixed
  while the body scrolls. Drawers and slideovers share their implementation,
  preserve left/right placement and existing width overrides, and use dynamic
  viewport height and safe-area spacing.
- Overlays retain their portal and focus boundary during the exit animation.
  Transitions use transform/opacity and respect reduced motion. The top overlay
  owns Escape, background isolation and scroll locking. Closing an edit modal
  after its source drawer has dismissed restores the original record trigger.
- Unit detail includes address, description, resident profiles/roles/contact
  information, assignment dates, currency-separated charge balances, due dates,
  responsible Parties and recorded activity timestamps. Data comes from existing
  contracts; no property photos, measurements or financial history are invented.
- Unit creation/editing uses grouped, icon-assisted fields and a fixed action
  footer. Error-summary links target the actual controls. Closing/reopening a
  form resets its session without interrupting its exit animation.
- Dashboard files are unchanged. The pre-existing simplified building/site
  option labels are preserved.

## Verification

Verified with native Node 22 and the repository pnpm workspace:

- `pnpm typecheck:app`: passed.
- `pnpm lint`: passed with existing warnings outside the changed files.
- `pnpm check:boundaries`: passed.
- Shared UI and residential focused checks passed, including dismissal timing,
  nested overlays, drawer-to-modal focus handoff, reopening, reduced motion,
  unit editing/creation, validation links, restricted charges, retry and
  multi-currency isolation.
- A clean isolated production build passed. The initial working-directory build
  compiled and passed type validation, then failed to collect two unrelated
  routes; the isolated build avoided the shared output directory.
- Full suite: 368 passed, 5 failed. All five failures reproduce against the
  committed baseline: the Access
  configuration route assertion, residential Gates navigation assertion,
  Managers roster link label, Site configuration help copy, and personal
  dashboard announcement overlap. They are outside this change.
- `git diff --check`: passed.

## Visual acceptance still required

### Header switcher stacking

The desktop sidebar wrapper now uses layer 30, below the header's layer 40.
Previously its layer 50 covered the organization-switcher dropdown despite the
dropdown's own z-index. Mobile navigation keeps layer 50 so its modal/backdrop
behavior is preserved. Browser access is still unavailable; before/after visual
verification of the open switcher above the sidebar remains pending.

### Unit detail tabs

The unit drawer now includes Overview, Residents and Charges tabs below its
summary/actions. Overview contains unit information and recorded activity;
Residents contains household profiles; Charges contains permission-aware
balances, assignments and error/retry states. Tabs remain visible while the
body scrolls, support arrow keys/Home/End and reset to Overview on opening a
unit. The residential regression suite passed all 13 tests, including visible
tab panels, keyboard selection, profile links and charge retry/permissions.
Targeted lint and diff checks passed. Browser verification remains unavailable.

### Occupancies follow-up

The residents/households register now follows the Visitors page's right-hand
detail drawer at every viewport size. Opening a name, row action or mobile
summary preserves the full-width register. The selected row is highlighted;
contact details, household switching, profile links and permission-gated
relationship actions remain available. The record remains visible during
dismissal and focus returns to its trigger. Residential/overlay regression
checks cover opening, profile links, dismissal and reopening from the mobile
summary. The initial 19 tests, typecheck and targeted lint passed. Following
the mobile-summary/focus assertions, targeted lint passed again, but the test
rerun encountered missing `next/navigation` and then a missing Vitest executable;
the local `node_modules/.bin` directory disappeared during verification. The
pending isolated build was stopped rather than changing the dependency
installation. Final test/build verification for this follow-up remains pending.
Browser access was retried and is still unavailable.

The browser inventory request returned an unavailable browser access host.
No before/after screenshots or browser animation verification could be captured.
Automated DOM checks and the earlier generated proposals do not substitute for
browser acceptance.

When browser access returns, inspect Units at 320, 390, 768, 1024 and 1440 pixels.
Open populated/vacant unit details; review long names, addresses, residents and
charges; dismiss/reopen the drawer; edit/assign from detail; validate an empty
create form; verify footer access with the mobile keyboard; test Escape/Tab,
reduced motion, charge error/retry and read-only access. Capture before/after
overlay evidence and leave dashboards outside the redesign.
