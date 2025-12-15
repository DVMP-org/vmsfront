# VMSCORE Plugin System

A comprehensive guide to creating and managing plugins in the VMSCORE frontend application.

## Table of Contents

- [Overview](#overview)
- [Plugin Architecture](#plugin-architecture)
- [Creating a Plugin](#creating-a-plugin)
- [Plugin Structure](#plugin-structure)
- [Routes](#routes)
- [Component Mounting](#component-mounting)
- [Menu Integration](#menu-integration)
- [Manifest Configuration](#manifest-configuration)
- [Backend Integration](#backend-integration)
- [Examples](#examples)
- [Best Practices](#best-practices)

## Overview

The VMSCORE plugin system allows you to extend the application with custom features that integrate seamlessly into both admin and resident interfaces. Plugins are isolated, reusable modules that can be enabled/disabled and maintain their own routes, components, and menu items.

### Key Features

- **Dual Interface Support**: Plugins can provide separate routes for admin and resident users
- **Automatic Menu Integration**: Plugin menus automatically appear in the sidebar
- **Dynamic Loading**: Components are dynamically imported for optimal performance
- **Error Isolation**: Each plugin is wrapped in an error boundary
- **Backend Sync**: Plugins must be enabled in the backend to appear in the frontend
- **Caching**: Plugin metadata is cached for faster load times

## Plugin Architecture

### High-Level Flow

```
User visits /plugins/electricity/admin/meters
    ↓
Plugin Loader checks cache → Backend API (if needed)
    ↓
Frontend plugins registered → Backend enabled plugins
    ↓
Match by name → Load plugin routes
    ↓
Determine route type (admin/resident) → Render component
```

### File Structure

```
src/plugins/
├── electricity/              # Example plugin
│   ├── index.js             # Plugin entry point
│   ├── manifest.json        # Plugin metadata
│   ├── routes.js            # Route definitions
│   ├── pages/               # React components
│   │   ├── admin/          # Admin-only pages
│   │   └── resident/       # Resident-only pages
│   ├── services/            # API services
│   │   └── electricity-service.ts
│   └── types/               # TypeScript types
│       └── index.ts
└── README.md
```

## Creating a Plugin

### Step 1: Create Plugin Directory

Create a new directory under `src/plugins/`:

```bash
mkdir -p src/plugins/my-plugin/{pages/{admin,resident},services,types}
```

### Step 2: Create Manifest

Create `manifest.json`:

```json
{
  "name": "my-plugin",
  "title": "My Plugin",
  "version": "1.0.0",
  "icon": "zap",
  "frontend": {
    "basePath": "/my-plugin"
  },
  "details": {
    "useCases": ["What your plugin does"],
    "requirements": ["Any requirements"],
    "configOptions": []
  }
}
```

**Required Fields:**
- `name`: Unique plugin identifier (must match backend plugin name)
- `title`: Display name shown in UI
- `frontend.basePath`: URL path segment (e.g., "/my-plugin")

**Optional Fields:**
- `version`: Plugin version
- `icon`: FontAwesome icon name (without "fa-" prefix)
- `details`: Metadata for admin UI

### Step 3: Create Routes

Create `routes.js`:

```javascript
import dynamic from "next/dynamic";

// Admin components
const AdminDashboard = dynamic(() => import("./pages/admin/Dashboard"));
const AdminSettings = dynamic(() => import("./pages/admin/Settings"));

// Resident components
const ResidentDashboard = dynamic(() => import("./pages/resident/Dashboard"));

// Legacy routes (optional - for backward compatibility)
const routes = [];

// Admin-specific routes
const adminRoutes = [
  {
    path: "/admin",
    component: AdminDashboard,
    title: "Dashboard",
    icon: "home"
  },
  {
    path: "/admin/settings",
    component: AdminSettings,
    title: "Settings",
    icon: "cog"
  }
];

// Resident-specific routes
const residentRoutes = [
  {
    path: "/",
    component: ResidentDashboard,
    title: "Dashboard",
    icon: "home"
  }
];

export default {
  routes,        // Legacy (optional)
  adminRoutes,   // Admin routes
  residentRoutes // Resident routes
};
```

**Route Properties:**
- `path`: Route path relative to plugin basePath (e.g., "/admin" becomes "/plugins/my-plugin/admin")
- `component`: React component to render
- `title`: Display name in sidebar menu
- `icon`: FontAwesome icon name (optional)

### Step 4: Create Entry Point

Create `index.js`:

```javascript
import manifest from "./manifest.json";
import routes from "./routes";

export default {
  manifest,
  routes: routes.routes,        // Legacy (optional)
  adminRoutes: routes.adminRoutes,
  residentRoutes: routes.residentRoutes
};
```

### Step 5: Register Plugin

Add to `src/lib/plugin_loader.ts`:

```typescript
import myPlugin from "@/plugins/my-plugin";

const FRONTEND_PLUGINS = [electricity, myPlugin];
```

### Step 6: Enable in Backend

Ensure your plugin is enabled in the backend API. The plugin name in `manifest.json` must match the backend plugin name.

## Plugin Structure

### Required Files

1. **index.js**: Plugin entry point that exports manifest and routes
2. **manifest.json**: Plugin metadata and configuration
3. **routes.js**: Route definitions for admin and/or resident

### Optional Directories

- **pages/**: React component pages
  - `admin/`: Admin-only components
  - `resident/`: Resident-only components
- **services/**: API service modules
- **types/**: TypeScript type definitions
- **components/**: Reusable plugin components
- **hooks/**: Custom React hooks

## Routes

### Route Types

Plugins can define three types of routes:

1. **Admin Routes** (`adminRoutes`): Only visible to admin users
2. **Resident Routes** (`residentRoutes`): Only visible to resident users
3. **Legacy Routes** (`routes`): Visible to both (backward compatibility)

### Route Paths

Routes are automatically prefixed with `/plugins/{basePath}`:

```javascript
// Route definition
{ path: "/admin/meters", ... }

// Actual URL
/plugins/electricity/admin/meters
```

### Root Routes

Use `"/"` or `""` for the plugin's root route:

```javascript
{
  path: "/",  // or ""
  component: Dashboard,
  title: "Dashboard"
}
// Maps to: /plugins/my-plugin
```

### Nested Routes

Routes can be nested arbitrarily:

```javascript
{
  path: "/admin/reports/monthly",
  component: MonthlyReport,
  title: "Monthly Report"
}
// Maps to: /plugins/my-plugin/admin/reports/monthly
```

## Component Mounting

### Automatic Mounting

Components are automatically mounted when users navigate to plugin routes. The system:

1. Matches the URL path to a plugin route
2. Determines if it's an admin or resident route
3. Wraps the component in `DashboardLayout` with the correct type
4. Wraps in `PluginErrorBoundary` for error isolation
5. Uses Next.js `dynamic` import for code splitting

### Layout Type Detection

The system automatically determines the layout type:

- Routes containing `/admin` → Admin layout
- All other routes → Resident layout

### Error Handling

Each plugin component is wrapped in `PluginErrorBoundary`:

```jsx
<PluginErrorBoundary pluginName={plugin.manifest.title}>
  <Component />
</PluginErrorBoundary>
```

If a plugin crashes, only that plugin shows an error, not the entire application.

### Component Examples

**Admin Component** (`pages/admin/Dashboard.tsx`):

```tsx
"use client";

export default function AdminDashboard() {
  return (
    <div>
      <h1>Admin Dashboard</h1>
      {/* Admin-specific content */}
    </div>
  );
}
```

**Resident Component** (`pages/resident/Dashboard.tsx`):

```tsx
"use client";

export default function ResidentDashboard() {
  return (
    <div>
      <h1>Resident Dashboard</h1>
      {/* Resident-specific content */}
    </div>
  );
}
```

## Menu Integration

### Automatic Sidebar Integration

Plugins automatically appear in the sidebar menu:

1. Plugin name appears as a collapsible menu item
2. Routes appear as sub-items when expanded
3. Active routes are highlighted
4. Icons from route definitions are displayed

### Menu Structure

```
Sidebar
├── Standard Links (Dashboard, Passes, etc.)
└── Plugins
    ├── Electricity Purchase ▼
    │   ├── Dashboard
    │   ├── Meters (admin only)
    │   └── Purchase (resident only)
    └── My Plugin ▼
        └── Settings
```

### Menu Filtering

- **Admin sidebar**: Shows only plugins with `adminRoutes`
- **Resident sidebar**: Shows only plugins with `residentRoutes`
- Plugins without routes for the current user type are hidden

### Icon Usage

Icons use FontAwesome classes:

```javascript
{
  icon: "zap"  // Becomes "fa fa-zap"
}
```

Available icons: https://fontawesome.com/icons

## Manifest Configuration

### Basic Manifest

```json
{
  "name": "plugin-name",
  "title": "Plugin Title",
  "version": "1.0.0",
  "icon": "icon-name",
  "frontend": {
    "basePath": "/plugin-name"
  }
}
```

### Advanced Manifest

```json
{
  "name": "plugin-name",
  "title": "Plugin Title",
  "version": "1.0.0",
  "icon": "zap",
  "frontend": {
    "basePath": "/plugin-name",
    "menu": {
      "label": "Custom Menu Label",
      "icon": "custom-icon"
    }
  },
  "details": {
    "useCases": [
      "Primary use case 1",
      "Primary use case 2"
    ],
    "setupSteps": [
      "Step 1: Configure API",
      "Step 2: Set up permissions"
    ],
    "requirements": [
      "API access",
      "Minimum version 2.0"
    ],
    "configOptions": [
      {
        "key": "apiKey",
        "label": "API Key",
        "type": "text",
        "description": "Your API key",
        "defaultValue": ""
      }
    ]
  }
}
```

### Manifest Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Unique plugin identifier |
| `title` | string | Yes | Display name |
| `version` | string | No | Plugin version |
| `icon` | string | No | FontAwesome icon name |
| `frontend.basePath` | string | Yes | URL path segment |
| `details.useCases` | string[] | No | Use case descriptions |
| `details.setupSteps` | string[] | No | Setup instructions |
| `details.requirements` | string[] | No | Requirements list |
| `details.configOptions` | object[] | No | Configuration options |

## Backend Integration

### Plugin Matching

Plugins are matched between frontend and backend by name:

1. Frontend registers plugins in `plugin_loader.ts`
2. Backend API provides list of enabled plugins
3. System matches by `manifest.name`
4. Only enabled plugins are loaded

### Backend Requirements

1. Plugin must exist in backend with same `name`
2. Plugin must be `enabled: true`
3. Backend API endpoint: `GET /admin/plugins`

### Caching

Plugin metadata is cached for 5 minutes:

- Reduces API calls
- Faster page loads
- Background refresh on stale cache
- Falls back to cache if API fails

To clear cache programmatically:

```typescript
import { clearPluginsCache } from "@/lib/plugin_loader";

clearPluginsCache();
```

## Examples

### Complete Example: Todo Plugin

**Structure:**
```
src/plugins/todo/
├── index.js
├── manifest.json
├── routes.js
├── pages/
│   ├── admin/
│   │   └── TodoAdmin.tsx
│   └── resident/
│       └── TodoList.tsx
└── services/
    └── todo-service.ts
```

**manifest.json:**
```json
{
  "name": "todo",
  "title": "Todo Manager",
  "version": "1.0.0",
  "icon": "check-square",
  "frontend": {
    "basePath": "/todo"
  }
}
```

**routes.js:**
```javascript
import dynamic from "next/dynamic";

const TodoAdmin = dynamic(() => import("./pages/admin/TodoAdmin"));
const TodoList = dynamic(() => import("./pages/resident/TodoList"));

export default {
  adminRoutes: [
    {
      path: "/admin",
      component: TodoAdmin,
      title: "Todo Admin",
      icon: "list"
    }
  ],
  residentRoutes: [
    {
      path: "/",
      component: TodoList,
      title: "My Todos",
      icon: "check"
    }
  ]
};
```

**index.js:**
```javascript
import manifest from "./manifest.json";
import routes from "./routes";

export default {
  manifest,
  adminRoutes: routes.adminRoutes,
  residentRoutes: routes.residentRoutes
};
```

**Register in plugin_loader.ts:**
```typescript
import todo from "@/plugins/todo";
const FRONTEND_PLUGINS = [electricity, todo];
```

## Best Practices

### 1. Component Organization

- Keep admin and resident components separate
- Use shared components/services for common logic
- Use TypeScript for type safety

### 2. Route Design

- Use clear, descriptive paths
- Keep routes shallow when possible
- Use RESTful conventions where applicable

### 3. Error Handling

- Handle errors gracefully in components
- Provide user-friendly error messages
- Use loading states for async operations

### 4. Performance

- Use `dynamic` imports for code splitting
- Lazy load heavy components
- Optimize images and assets

### 5. Naming Conventions

- Plugin name: kebab-case (e.g., "my-plugin")
- Component files: PascalCase (e.g., "Dashboard.tsx")
- Route paths: kebab-case (e.g., "/admin/user-settings")

### 6. TypeScript

- Define types in `types/index.ts`
- Use proper types for API responses
- Export types for reuse

### 7. API Services

- Create service modules in `services/`
- Use consistent error handling
- Cache API responses when appropriate

### 8. Testing

- Test components in isolation
- Mock API calls in tests
- Test error scenarios

## Troubleshooting

### Plugin Not Appearing

1. Check plugin is registered in `plugin_loader.ts`
2. Verify plugin is enabled in backend
3. Ensure `manifest.name` matches backend name
4. Check browser console for errors

### Routes Not Working

1. Verify route path is correct
2. Check component is properly exported
3. Ensure route is in correct array (admin/resident)
4. Check URL matches expected pattern

### Menu Not Showing

1. Verify plugin has routes for current user type
2. Check `manifest.icon` is valid FontAwesome icon
3. Ensure routes have `title` and `icon` properties

### Component Not Loading

1. Check `PluginErrorBoundary` for errors
2. Verify component is default export
3. Ensure dynamic import path is correct
4. Check component has `"use client"` directive if needed

## API Reference

### Plugin Loader Functions

```typescript
// Load all plugins
loadPlugins(useCache?: boolean): Promise<LoadedPlugin[]>

// Clear plugin cache
clearPluginsCache(): void

// Find plugin by path
findPluginByPath(path: string): Promise<LoadedPlugin | undefined>

// Get plugin by name
getPluginByName(name: string): Promise<LoadedPlugin | undefined>

// Get routes for user type
getPluginRoutesForUserType(
  plugin: LoadedPlugin,
  userType: "admin" | "resident"
): PluginRoute[]
```

### Plugin Utilities

```typescript
// Build plugin path
buildPluginPath(basePath: string, routePath: string): string

// Extract route path
extractRoutePath(fullPath: string, basePath: string): string

// Check if path belongs to plugin
isPluginPath(path: string, basePath: string): boolean

// Normalize paths
normalizePath(path: string): string
normalizeRoutePath(path: string): string
```

## Additional Resources

- [Plugin Example: Electricity](./electricity/)
- [Plugin Loader Source](../lib/plugin_loader.ts)
- [Plugin Utils Source](../lib/plugin-utils.ts)
- [Plugin Types](../types/plugin.ts)

---

**Note**: Plugins must be enabled in the backend to appear in the frontend. The plugin name in `manifest.json` must exactly match the backend plugin name.

