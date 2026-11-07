# Contextual pages browser evidence

Captured against the checkout-local CTX API with a mixed-use organization,
hospitality and commercial properties, routed charges, and canonical shared
facets.

The capture covers:

- Properties directory and property detail at 1440px.
- An explicit Harbour Hotel property context.
- Charge directory and definition detail.
- Organization settings with a locked use case and slug.
- Specialist navigation removed after switching to a commercial context.
- Properties and charges at 393px (the closest built-in mobile preset to 390px).

Run with:

```sh
VMS_CONTEXT_BASE=http://context-acceptance.localhost:3003 \
VMS_TEST_EMAIL=context-user@example.com \
VMS_TEST_PASSWORD='<local-test-password>' \
node docs/evidence/ctx-contextual-pages/capture.cjs
```
