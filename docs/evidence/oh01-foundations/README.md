# OH-01 Operations Hub foundations evidence

Captured on 2026-11-08 from the isolated OH-01 branch.

## Coverage

- `2026-11-08-gallery-320.png`
- `2026-11-08-gallery-390.png`
- `2026-11-08-gallery-768.png`
- `2026-11-08-gallery-1024.png`
- `2026-11-08-gallery-1440.png`
- `2026-11-08-drawer-390.png`
- `2026-11-08-drawer-1440.png`
- `2026-11-08-report.json`

The capture script checks that each gallery viewport has no document-level
horizontal overflow or browser page errors. It also verifies that the drawer
opens with dialog semantics, receives focus, closes on Escape and restores the
page context.

## Reproduction

```sh
pnpm dev --port 3101
BASE_URL=http://localhost:3101 node scripts/capture-oh01-gallery.mjs
```

The component contract also has automated coverage for token contrast, button
refs/loading, linked field labels and errors, semantic badges, flat surfaces and
dialog/drawer focus containment.
