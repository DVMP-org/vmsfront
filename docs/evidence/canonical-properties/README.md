# Canonical Properties acceptance

The route `/admin/properties` implements the canonical Places API as a Properties and spaces workflow: search, type/status/top-level filters, pagination, root/child creation, detail, ancestor breadcrumbs and child navigation, editing, moving to a parent or top level, and confirmed archive/activation.

## API alignment

All mutations use `/admin/places`; labels map the API's `site` kind to **Property**, retaining Building / Unit / Room / Space for other kinds. IDs are internal to API calls and never required as user input. Parent choices use the shared allowlisted `/facets/places` provider with search, bounded pagination, selected-value rehydration and active-only options. The current property is disabled as a move destination; the server rejects cycles and cross-tenant records atomically.

Grants are the canonical `places.list`, `places.show`, `places.create`, `places.update`, `places.move` and `places.toggle_active`. The UI retrieves a fresh profile per tenant/user context and clears selected details and drafts on context changes. The API rechecks every permission and mutation invariant.

Shared facet UI code was inherited from vmsfront #57, now merged. Backend facets are merged vmscore #161. Backend safety fixes for concurrent topology mutations and active hospitality room guards are in vmscore #163; deploy that API before releasing this UI.

## Validation

Full `pnpm verify` passed on Node 22: lint, app/workspace typechecks, **43 tests**, the root production build and all four workspace builds. Focused Properties regressions cover permission hiding, hierarchy navigation, status confirmation, blocked archive, retained edits on name conflict, child creation, null-parent moves, child-to-root form reset and tenant/user invalidation. Shared facet tests remain green.

The real browser journey ran the production frontend against an isolated migrated PostgreSQL API combining the merged canonical contracts and the #163 safety fix. At 1440px and 390px it:

1. Created a top-level property, edited its address, then created a child building using the selected parent.
2. Navigated the parent/child hierarchy and demonstrated cycle rejection and blocked archive while an active child exists.
3. Moved the building to the top level and back through the shared parent picker.
4. Archived the building and property, demonstrated rejected child activation under an archived parent, then activated parent and child.
5. Searched for the created building and confirmed no horizontal mobile overflow.

`desktop-create`, `desktop-child-create`, `desktop-child-detail`, `desktop-cycle-rejected`, `desktop-archive-blocked` and the mobile lifecycle images show real persisted API changes. Names and addresses are synthetic. The existing shared shell's resident-workspace request returned the expected no-workspace response for the synthetic admin; property requests behaved as asserted.

Supplemental controlled-response screenshots cover loading, empty results, service failure/retry, read-only controls and dark desktop/mobile layout. These state fixtures are distinct from the real mutation journey. Screenshots were inspected for overlap and control visibility.

## Scope

This completes the route-preserving canonical Properties list/detail/action workflow in UR-04. The admin-app migration, exception command center, remaining OS context shell and ARCH6 cross-product acceptance remain separate plan work. Server errors preserve the relevant editor or confirmation so operators can correct input or resolve blockers; archive retains history and is not deletion.
