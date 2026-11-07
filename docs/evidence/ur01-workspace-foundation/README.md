# UR-01 workspace foundation evidence

Verified on 2026-11-07 against `https://vmsfront.to` with Valet proxying the
production build. User-facing routes do not include a port.

## Local verification

- `pnpm install --frozen-lockfile`: passed from a clean workspace install.
- `pnpm verify`: passed, covering lint, root and workspace typechecks, 13 unit
  tests, the root production build, and four workspace app builds.
- `docker build -t vmsfront-ur01:local .`: passed from the clean Docker context.
- The built image started successfully, served `/auth/login/` with HTTP 200,
  and reported `healthy` through the Docker healthcheck.
- The image uses Next standalone output and is **255.6 MB**, down from the
  earlier 2.12 GB image that copied the full development dependency graph.

## Route smoke checks

- `/` redirects a signed-out user to `/auth/login/`.
- `/organizations/` redirects a signed-out user to
  `/auth/login/?redirect_to=%2Forganizations%2F`.
- `/auth/login/` and `/auth/register/` load directly through the portless
  hostname with slash normalization.
- A clean browser session reported no console errors while loading the auth
  flow.

## Screenshots

- `desktop-login.png`: login surface at a 1440 x 1000 viewport.
- `desktop-register.png`: registration surface at a 1440 x 1000 viewport.
- `mobile-register-390.png`: full registration surface at a 390px viewport.

The mobile evidence verifies that the brand no longer overlaps the registration
heading. The desktop evidence verifies the corrected brand color on the white
logo panel after the local font-and-icon migration.
