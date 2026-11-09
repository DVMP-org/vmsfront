# Commercial operations evidence

Date: 2026-11-09

This feature slice adds the property-scoped commercial operations workspace:

- office, shop, retail, warehouse and conference inventory using canonical
  Places;
- business tenant and member relationships with explicit lease periods and
  expiry attention;
- shared rent and service-charge assignments filtered to the selected
  commercial property;
- employee and contractor access relationships plus the shared visitor
  invitation workflow;
- a typed commercial maintenance register that reports endpoint unavailability
  explicitly rather than displaying a false zero.

## Verification

- Focused commercial operation tests: 6 passed.
- TypeScript, ESLint and the Next.js production build pass.
- The full frontend test suite passes.
- Playwright and screenshot capture are intentionally excluded for this domain
  feature slice.

## Known backend dependency

`/admin/commercial/maintenance` remains to be implemented in VMSCore. The UI is
wired to this typed endpoint and exposes loading, empty, stale and unavailable
states; it does not persist local-only maintenance records.
