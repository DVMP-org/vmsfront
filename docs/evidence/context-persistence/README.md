# Site context and query refresh verification

Local implementation, 2026-11-11. No deployment or visual acceptance claimed.

## Behavior

- Same-organization refresh preserves Site selection. Selection writes a Site
  hint and an organization binding; organization changes and logout clear both.
- Direct Site URLs take precedence over persisted selection. API header fallback
  accepts a Site cookie only for its bound tenant. Server workspace responses
  validate and restore the selected Site; access errors retain the selection
  and offer retry or workspace switching. Inherited management authority does
  not replace an explicitly selected child Site.
- Site query dimensions use an object with organization, Site and User IDs.
  Personal visitors and invitation actions share the same query-key family.
  Charge definition, Place and occupancy creation invalidate their directories.
  Approved legacy visit requests also refresh the gate-pass list.
- Default freshness is 30 seconds and window focus can refetch stale data.
  Table synchronization retains mandatory filters without an editable control.
- Header/account and organization greetings reserve loading space. Existing
  same-token identity preservation remains intact; another token clears it.
- Shared sidebar no longer reads Residency state, parses Residency URLs, fetches
  residency membership, exposes the legacy wallet, or grants organization
  settings through a residency super-user flag. Residential Site/Place features
  and plugin layout identifiers remain supported.

## Verification and compatibility follow-up

The starting checkout had six reproducible failures: missing residential Gates
navigation, stale manager/configuration copy expectations, premature archive
execution in the DataTable test, and an outdated announcement overlap value.
The Gates entry is restored. The tests now cover Site-scoped manager actions,
selected-Site module configuration, cancellation/confirmation before archive,
and announcement overlap without prescribing an arbitrary pixel value.

The pnpm lockfile is synchronized with the already-declared Next.js 15, Zod 4
and Playwright Faker versions. Dynamic server routes await `params` and
`searchParams`; the client plugin route reads `useParams`. The two domain
record schemas use Zod 4's explicit string keys.

Verification uses Node 22.17.1 (native architecture) and pnpm 10.33.2, matching
CI's Node 22 major and pinned package manager. Frozen installation succeeds.
The full unit suite passes: **99 suites, 396 tests**. Root production compilation
and route validation pass; lint (with existing warnings), package boundaries,
application typechecking and all 10 workspace typechecks pass. Final verification
also builds all four application scaffolds through `pnpm verify`.

Concurrent installation/build/test runs caused timeouts on this machine. The
final verification runs the repository's normal sequential `pnpm verify`
pipeline, without increased test timeouts or skipped checks.

## Review boundary

Repository: `DVMP-org/vmsfront`. Branch: `fix/site-context-and-verification`.
The review base `review/frontend-ui-base-d7e816e` preserves the starting commit
`d7e816e`, which contains earlier unmerged shared-UI/dependency work. This keeps
that prerequisite work out of this PR's diff. Integration into `master` requires
that prerequisite to be integrated first, followed by retargeting/rebasing this
branch. No merge or deployment is authorized or claimed here.

## Browser acceptance pending

Browser inventory was retried and still failed: browser access host unavailable
and native managed preferences could not synchronize. Screenshots, responsive
checks and live create/reload/back/Site-switch acceptance remain pending. Unit,
build and CI results do not replace those checks. Keep the review in draft until
visual acceptance is completed.
