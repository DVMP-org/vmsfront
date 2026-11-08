# OH-03 Properties register evidence

Captured on 2026-11-08 from the isolated `feat/oh03-properties-solo` worktree.
The run used the real Next.js route in Chromium with a controlled VMSCore API
fixture. It does not claim a production mutation journey.

## Fixture

- Organization: Harbour Operations, mixed use
- Property manager with full effective permissions for success, loading,
  empty, error/retry and stale states
- Read-only manager with `places.list` and `places.show` only
- Four active properties and one archived property

## Evidence

- `properties-1440.png`, `properties-1024.png`, `properties-768.png`,
  `properties-390.png`, `properties-320.png`: aligned PageHeader, toolbar,
  register and pagination at each required viewport.
- `properties-390-card.png`, `properties-320-card.png`: labelled mobile row
  summaries with a 44px row action and no duplicate row DOM.
- `properties-loading-1440.png`: stable loading geometry.
- `properties-empty-390.png`: first-use/no-results state.
- `properties-error-1440.png` and `properties-retry-success-1440.png`:
  recoverable service failure.
- `properties-stale-390.png`: failed filtered refresh retains the last
  successful rows with an explicit retry.
- `properties-read-only-1440.png`, `properties-read-only-390.png`: the create
  action is absent when `places.create` is not granted.

`capture-results.json` records the measured document/body widths and confirms
zero horizontal overflow. Every success-state run reported zero page or
console errors.

## Verification

```bash
pnpm vitest run src/app/admin/properties/page.test.tsx src/components/ui/DataTable.test.tsx
pnpm typecheck:app
pnpm lint
```

The route harness is `capture.cjs`. It intercepts only VMSCore HTTP responses
and runs against `http://oh03-audit.localhost:3103`. The organization/place
shell still shows the pre-OH-02 organization overview surface; shell
separation is owned by OH-02.
