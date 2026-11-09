# Canonical Playwright E2E

This suite exercises the current VMS Core routes and workflows. It does not use
the retired Houses, Residents or Gate Events application model.

## Modes

### Fixture mode (default)

`E2E_MODE=fixture` installs a stateful canonical API adapter at the browser
boundary. Form submissions, redirects, permission checks, collection controls
and recovery states run through the real Next.js application without mutating a
shared tenant.

```bash
pnpm test:e2e
```

### Live mode

`E2E_MODE=live` skips the fixture adapter and points the app at
`API_BASE_URL`. Use it only against an isolated local/staging tenant with
disposable accounts.

```bash
E2E_MODE=live \
VMS_BASE_URL=http://localhost:3106 \
API_BASE_URL=http://localhost:8000 \
pnpm test:e2e
```

Live tests use the `@live` tag and must create uniquely tagged data and clean up
or deactivate it.

## Covered contracts

- login, organizations, organization creation, plan activation and standalone
  first-place onboarding
- current Place and organization workspace routing
- management, organization-only, occupant and guest authority boundaries
- Property create/edit/move/archive
- People relationship onboarding
- visitor approval/decline
- charges and schedules
- gates and checkpoints
- organization-wide Plugins and Integrations
- account, avatar, search and workspace shell
- collection search, filters, sorting, pagination, columns, density, selection,
  bulk actions, mobile summaries, empty/loading/stale/error states

## Browser projects

- desktop Chromium, 1440×1000
- mobile Chromium, 390×844
- desktop WebKit, 1440×1000
- mobile WebKit, 390×844

## Generated artifacts

Successful E2E runs do not commit screenshots. Failed runs retain traces,
screenshots and videos in ignored Playwright artifact directories. CI uploads
the HTML report and failure artifacts.

Playwright is intentionally not part of repository CI. Run the suite directly
when working on browser behavior; the application CI remains based on lint,
typecheck, unit tests and production build.

## Authoring rules

- Use Page Objects under `pages/` and the stateful adapter under `fixtures/`.
- Assert visible outcomes and recorded mutations; never use conditional-only
  assertions.
- Do not use `waitForTimeout` as synchronization.
- Add `data-testid` only when an accessible role, label or stable text cannot
  express the contract.
- Live persistence tests carry `@live`; deterministic contract tests carry
  `@canonical`.
