# Contextual pages browser evidence

Captured against the checkout-local CTX API with a mixed-use organization,
hospitality and commercial properties, routed charges, and canonical shared
facets. Earlier captures preserve the editorial/ledger design for before-and-after
comparison.

The capture covers:

- Workspace switcher cards grouped by property, with management and personal
  access kept in separate lanes. The final green-led palette is captured at
  1440px and two 393px mobile states.
- Property name, address, hierarchy, operating context, and actual roles,
  including a commercial unit with management plus tenant access and a hotel
  room with guest-only access.
- Canonical operating dashboard with property, people, visit and checkpoint
  metrics.
- Before-and-after Charges views replacing the editorial layout with a modern
  admin SaaS surface.
- Properties directory and property detail at 1440px.
- An explicit Harbour Hotel property context.
- Charge directory and definition detail.
- Organization settings with a locked use case and slug.
- Specialist navigation removed after switching to a commercial context.
- Properties and charges at 393px (the closest built-in mobile preset to 390px).
- Service-worker navigation is network-first, with immutable Next.js chunks kept
  in a versioned cache so rebuilt deployments do not request missing assets.

The final workspace captures were exercised in a real browser session:

- `workspaces-saas-desktop.png`
- `workspaces-saas-mobile.png`
- `workspaces-saas-mobile-cards.png`

The same session verified opening the selected property's management console,
opening a tenancy workspace, and confirming that a hotel guest receives no
booking, room-assignment, or management controls.

Run with:

```sh
VMS_CONTEXT_BASE=http://context-acceptance.localhost:3003 \
VMS_TEST_EMAIL=ctx-ui-acceptance@example.com \
VMS_TEST_PASSWORD='<local-test-password>' \
node docs/evidence/ctx-contextual-pages/capture.cjs
```
