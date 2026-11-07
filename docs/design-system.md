# Design system foundations

The `/design-system` gallery demonstrates scoped light and dark semantic tokens, density, keyboard focus, typography, actions, field help and status. It preserves existing application styling by applying the tokens only within a `data-vms-theme` container. Reduced-motion preferences remove token-driven transitions.

`@vms/ui` exports the brand kit validator and CSS variables generator. Inputs are six-digit colors only. Both palettes must pass text and primary-to-surface contrast checks before variables can be used. This foundation does not yet implement brand publication, marks, typography selection, or the complete component library.
