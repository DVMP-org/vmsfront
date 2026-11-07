# Hospitality operations acceptance

This change delivers an admin workflow at `/admin/hospitality`: paginated status-filtered stays, primary and additional guests, reservation creation, detail and room history, rescheduling, room assignment/moves, check-in, checkout and cancellation. Actions use canonical `hospitality_stays.*` permissions; shared `parties` and `places` facets require their own list grants.

## Dependencies

- VMSCore #160: atomic rescheduling and room lifecycle behavior.
- VMSCore #161: canonical shared facet contract. The manifest in `src/contracts/facets.v1.json` is the exported contract for the typed client. This workflow requires that API deployment before release.

## Verification

`pnpm verify` passed on Node 22: lint, app and workspace typechecks, 33 tests, production build and all four workspace builds. Independent review corrected permission names, empty search handling, raw facet response handling and room-history labeling. No migration is included.

A production frontend and API combining the two backend changes ran against an isolated migrated PostgreSQL database. The browser used a synthetic tenant/operator, guests and rooms. The real API journey passed at 1440px and 390px:

1. Create a reservation with primary/additional guests and a room selected by facets.
2. Reschedule arrival/departure and verify updated room history.
3. Confirm check-in, move to another room and confirm checkout.
4. Create another reservation, assign a room and confirm cancellation.
5. Verify the selected reservation reaches each terminal state and mobile has no horizontal overflow.

Screenshots `desktop-create`, `desktop-rescheduled`, `desktop-checked-in-moved`, `desktop-checked-out`, `mobile-reserved`, `mobile-confirm-cancel` and `mobile-cancelled` show real persisted changes. All guest names and notes are synthetic. The existing shared shell also requested a resident workspace for this admin-only operator; that unrelated endpoint returned its expected no-workspace response.

Supplemental screenshots exercise loading, empty, service-error/retry and read-only states with controlled API responses. They are distinguished from the real API journey above. Component tests additionally verify conflicting updates retain entered form values, permission hiding, explicit confirmation, and facet search/pagination/selected-value hydration.

## Scope

This delivers the hospitality operations workflow within AR-09 and the route-preserving admin work of UR-04. It does not claim completion of the full OS shell, exception command center, all property workflows or ARCH6 cross-product acceptance. Room selectors list active rooms; availability is checked atomically by the server when saving, with conflicts surfaced in the form. Dates are explicitly shown in the device timezone and sent as UTC instants.
