# Post-auth routing evidence

Browser tests used the Valet-proxied `https://vmsfront.to` host without a port. API traffic was routed to the local Docker API for the test run.

- `before-single-org-login.png`: after login, the user with one active organization remains on the organization list.
- `after-single-org-login.png`: the same login opens the only organization's tenant at `https://<slug>.vmsfront.to/select/`.
- `after-tenant-logout-login.png`: logout from a tenant remains on that tenant's login page.
- `after-new-account-clean-context.png`: registering a second account clears the previous tenant cookie and opens the base organization page with no stale organization context.
