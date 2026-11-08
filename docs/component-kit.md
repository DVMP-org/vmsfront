# VMS Core component kit

The kit follows the approved proposal boards in
`design-audit/screenshots/proposals/` and the contracts in
`design-audit/COMPONENT-SPECIFICATIONS.md`. Product primitives use semantic
tokens from `packages/ui/src/tokens.css`; tenant identity may change marks and
restrained brand accents, but never action, focus, data or status semantics.

## Foundations

| Foundation                           | Canonical location                                        | Contract                                                                                                  |
| ------------------------------------ | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Color, spacing, radius, type, motion | `packages/ui/src/tokens.css`                              | Light-only tokens with dark semantic text for accessible statuses and bright accents for fills/indicators |
| Product mark and wordmark            | `src/components/brand/VmsBrand.tsx`                       | Shield/check mark, compact wordmark, monochrome and light-surface variants                                |
| Code-native illustrations            | `src/components/illustrations/OperationsIllustration.tsx` | Property, access, finance, people, community and generic states                                           |
| Namespaced infrastructure            | `packages/ui/src/ProductModule.tsx`                       | CSS isolation for composed product modules                                                                |
| Tenant brand validation              | `packages/ui/src/brand.ts`                                | Contrast validation and semantic-variable generation                                                      |

## Atoms and controls

| Component            | Canonical export                            | Notes                                                                                                 |
| -------------------- | ------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Button / icon button | `Button`                                    | Primary, secondary, tertiary, ghost and destructive; 32/40/44px sizes; forwarded ref and loading text |
| Text field           | `Input`, `Field`                            | Persistent label, help, error, autofill and 16px mobile text                                          |
| Search               | `SearchField`                               | Compact 36–40px global/collection search, clear action and shortcut hint                              |
| Select               | native select, `SearchableSelect`           | Normal and searchable filter controls                                                                 |
| Checkbox             | `Checkbox`                                  | Native semantics and focus treatment                                                                  |
| Status               | `Badge`, `StatusBadge`                      | Neutral/info/success/warning/danger, always paired with text                                          |
| Identity             | `Avatar`                                    | Photo with initials/icon fallback, deterministic tone and decorative mode                             |
| Property media       | `PropertyImage`                             | Fixed ratio, optimized image path and code-native building fallback                                   |
| Alerts               | `InlineAlert`                               | Contextual info/success/warning/danger with optional action                                           |
| Loading              | `Skeleton`, `CardSkeleton`, `TableSkeleton` | Stable geometry and reduced-motion support                                                            |

## Navigation and chrome

| Component             | Canonical export          | Notes                                                                             |
| --------------------- | ------------------------- | --------------------------------------------------------------------------------- |
| Global header         | `Header`                  | Wordmark, organization switcher, compact search, notifications and account avatar |
| Command search        | `CommandNavigation`       | Keyboard-accessible command palette and workspace-aware search                    |
| Sidebar / nav groups  | `Sidebar`, `admin-routes` | Permission/module groups, active parent and mobile drawer                         |
| Organization switcher | `OrganizationSwitcher`    | Switches tenant/subdomain only                                                    |
| Workspace switcher    | `WorkspaceSwitcher`       | Place and relationship switching only                                             |
| Breadcrumbs           | `Breadcrumbs`             | Hierarchy and drill-down; collapses middle segments on mobile                     |
| Page header           | `PageHeader`              | One H1, context, metadata and responsive action group                             |

## Collections

| Component           | Canonical export                                                          | Notes                                                                                                                  |
| ------------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Collection register | `DataTable`                                                               | Search, server/client sort, filters, selection, bulk bar, column chooser, density, pagination and responsive summaries |
| Filter bar          | `FilterBar`                                                               | Shared wrapper for searchable/normal selects, dates and removable filters                                              |
| Table primitives    | `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell` | Labelled comparison region and sticky/row-ready semantics                                                              |
| Pagination          | `PaginationBar`, `DataTable`                                              | Exact range copy, page-size control and accessible navigation                                                          |

## Forms, overlays and feedback

| Component               | Canonical export                    | Notes                                                                  |
| ----------------------- | ----------------------------------- | ---------------------------------------------------------------------- |
| Form section            | `FormSection`                       | Grouped form content and legend                                        |
| Validation summary      | `FormErrorSummary`                  | Linked summary focused after failed submission                         |
| Dialog                  | `Modal`                             | Named, focus-trapped and restored                                      |
| Drawer                  | `SlideOver`                         | Context-preserving short workflows                                     |
| Empty / loading / error | `EmptyState`, `PanelState`          | Distinct first-use, filtered-empty, loading and recoverable-error copy |
| Stale data              | `StaleDataBanner`                   | Keeps last successful records visible with retry                       |
| Toasts                  | Sonner provider                     | Named success/failure result, never color-only                         |
| Workflow progress       | `WorkflowTimeline`, `SetupProgress` | Complete/current/pending/error states with accessible step semantics   |

## Dashboard and content composites

| Component             | Canonical export                                  | Notes                                                                        |
| --------------------- | ------------------------------------------------- | ---------------------------------------------------------------------------- |
| Action card           | `ActionCard`                                      | Proposal-aligned rail, icon tone, description, metadata and single action    |
| Metric strip          | `MetricStrip`                                     | Compact cells with icon, value, period and context; not fabricated occupancy |
| Report panel          | `ReportPanel`                                     | Titled data region with optional action and footer                           |
| Chart table alternate | `AccessTrendPanel`, report tables                 | Exact text/table representation accompanies charts                           |
| Card primitives       | `Card`, `CardHeader`, `CardContent`, `CardFooter` | Use for one cohesive object or decision                                      |

Import new reusable primitives from
`src/components/ui/index.ts`. Feature-specific composites remain in their
feature folder and must compose these atoms rather than duplicate their visual
language.
