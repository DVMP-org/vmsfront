# Workspace site-title evidence

The merged frontend was run against an isolated local backend containing the
workspace site-name API change. A real residential organization, site, unit,
resident relationship and two scheduled property charges were used.

The browser completed the occupant login and verified:

- the selector shows `Harbour Court - Apartment 4B`;
- the resident workspace header and charge card use the same qualified name;
- the personal charge list contains both scheduled balances and payment
  controls;
- desktop and 390px layouts render without losing the site context.

Evidence:

- `select-desktop.png`
- `workspace-desktop.png`
- `select-390px.png`
- `workspace-390px.png`
