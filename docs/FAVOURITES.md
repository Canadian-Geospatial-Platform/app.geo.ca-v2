# Favourites Feature Architecture

## Overview

The favourites feature allows signed-in users to save and manage datasets and custom map configurations. Guest users can save favourites temporarily in a cookie, which are merged into their profile upon sign-in.

## Directory Structure

```
packages/web-app/src/
├── lib/
│   ├── components/favourites/        # UI components for favourites feature
│   │   ├── favourites-datasets.svelte      # Dataset list & management
│   │   ├── favourites-maps.svelte          # Map config list & management
│   │   ├── favourites-view.svelte          # Map viewer for selected items
│   │   └── favourites.svelte               # Landing page (hub)
│   ├── db/
│   │   ├── db-types.ts                     # Type definitions (UserData, MapConfigFavourite)
│   │   ├── user.ts                         # DynamoDB user operations (getUserData, putUserData)
│   │   └── favourites.ts                   # mergeGuestFavourites (guest -> signed-in profile merge)
│   └── utils/
│       ├── favourites/
│       │   └── page-load.server.ts         # Shared server-side loader
│       ├── favourites-storage.ts           # Local-storage favourites read/normalize helpers
│       ├── guest-favourites.ts             # Guest favourites cookie encode/decode (client + server)
│       └── map-config-sanitizer.ts         # Removes large style data for storage
└── routes/
    └── [lang]/
        ├── favourites/                      # Landing page (hub)
        ├── favourites/datasets/             # Dataset list route
        ├── favourites/maps/                 # Map config list route
        ├── favourites/view/                 # Map viewer route
        └── api/favourites/+server.ts        # RESTful API (CRUD operations)
```

## Data Model

### UserData (DynamoDB)

```typescript
interface UserData {
  uuid: string | null; // User ID from auth token (null before first write)
  favourites: string[]; // Array of saved dataset record IDs
  mapConfigs?: MapConfigFavourite[]; // Array of saved map configurations
  authRevokedAt?: number | null; // Back-channel logout marker
}

interface MapConfigFavourite {
  id: string; // UUID for the saved map
  name: string; // User-provided name
  config: Record<string, unknown>; // Sanitized, serialized map state
  createdAt: string; // ISO 8601 timestamp
}
```

### Size Constraints

- **Map configs limit**: 25 saved maps per user
- **Item size limit**: 300 KB (conservative margin below DynamoDB 400 KB limit)
- **Sanitization**: `map-config-sanitizer.ts` removes large style/layer data to fit within limits

### Guest Favourites

- Stored in `guest_favourites` cookie (temporary)
- Merged into `UserData.favourites` after sign-in
- Cookie is cleared after successful persistence

## Routes & Components

### `[lang]/favourites` (Landing Page)

- **Component**: `favourites.svelte`
- **Data**: User lookup via `page-load.server.ts`
- **Purpose**: Dashboard for signed-in users; displays cards to navigate to datasets and maps sections
- **Conditional**: Only visible when user is signed in

### `[lang]/favourites/datasets`

- **Component**: `favourites-datasets.svelte`
- **Data**: Fetches saved dataset records from GeoCore API
- **Features**: Display list, delete individual items, delete all, open selected items on map
- **Storage**: Removes deleted IDs from `UserData.favourites`

### `[lang]/favourites/maps`

- **Component**: `favourites-maps.svelte`
- **Data**: Retrieves saved map configs from `UserData.mapConfigs`
- **Features**: Upload JSON configs, download configs, delete configs, view on map
- **Upload**: Validates max-item limit (25) and auto-renames duplicates
- **Storage**: PATCH endpoint creates/deletes map configs

### `[lang]/favourites/view`

- **Component**: `favourites-view.svelte`
- **Parameters**: Accepts either:
  - `ids` query param: Array of dataset record IDs to view together
  - `mapId` query param: Single saved map config ID to view
- **Purpose**: Shared map viewer for displaying selected items
- **Features**: Save as new map config, return to dataset/maps list

## API Endpoints

### `/[lang]/api/favourites` (RESTful)

**POST**: Add dataset ID to favourites

```json
{ "id": "<record-id>" }
```

**DELETE**: Remove dataset ID from favourites

```json
{ "id": "<record-id>" }
```

**PUT**: Clear all dataset favourites

```json
{}
```

**PATCH**: Create or delete map configs

```json
// Create
{ "action": "createMapConfig", "name": "<name>", "config": {...} }

// Delete
{ "action": "deleteMapConfig", "id": "<uuid>" }
```

## Data Flow

### Save a Dataset

1. User views dataset on map
2. Click "Add to favourites" button
3. POST `/[lang]/api/favourites` with record ID
4. Server adds ID to `UserData.favourites` in DynamoDB
5. Confirmed ID appears in datasets list

### Save a Map Configuration

1. User arranges map (layers, zoom, pan, style)
2. Click "Save map" on view page
3. PATCH `/[lang]/api/favourites` with map config + name
4. Server:
   - Sanitizes config (removes large style data)
   - Checks size constraints (max 25 configs, item < 300 KB)
   - Auto-renames if duplicate name exists
   - Stores in `UserData.mapConfigs`
5. Confirmed config appears in maps list

### Guest → Sign-In Merge

1. Guest clicks "Add to favourites"; the id is stored in local storage and, on sign-in click, encoded into the `guest_favourites` cookie (`lib/utils/guest-favourites.ts`)
2. Guest completes sign-in flow
3. `/sign-in/receive` route verifies the ID token, then calls `mergeGuestFavourites()` (`lib/db/favourites.ts`), which:
   - Decodes and normalizes the `guest_favourites` cookie
   - Merges it into `UserData.favourites` (deduped)
   - Persists merged data to DynamoDB
   - Clears the cookie only after successful persistence

## Key Utilities

### `page-load.server.ts`

Shared server-side loader for all favourites routes:

- Looks up user via cookies
- Fetches full GeoCore records for saved dataset IDs (for display)
- Sanitizes records (removes sensitive fields)
- Returns typed `FavouritesLoadOutput`

### `map-config-sanitizer.ts`

Reduces map config size by removing style/layer data before storage:

- Strips large style objects from layers
- Keeps essential state (zoom, center, visible layers)
- Runs during save and re-sizing checks

### `favourites-storage.ts`

Local storage utilities:

- Reads/normalizes favourites from browser local storage (trim, dedupe, drop empties)
- Resolves initial favourites source on page load (server vs. local storage fallback)

### `guest-favourites.ts`

Shared guest favourites cookie contract used by both the client and server:

- `encodeGuestFavouritesCookieValue()` / `decodeGuestFavouritesCookieValue()`
- Used by the sign-in component (client) when caching favourites before redirect, and by `mergeGuestFavourites()` (server) when merging after sign-in

## Development Notes

### Running Tests

Test favourites API behavior:

```bash
npm run test -- src/lib/tests/favourites-api.test.ts
```

### Adding a New Favourites Feature

1. Add route under `routes/[lang]/favourites/<new-feature>/+page.ts`
2. Create component at `lib/components/favourites/<name>.svelte`
3. Add server-side logic to `lib/utils/favourites/` if needed
4. Update API endpoints in `routes/[lang]/api/favourites/+server.ts`
5. Add JSDoc documentation to all functions
6. Run `npm run check` to validate types and Svelte syntax
7. Run `npm run lint` to check formatting and ESLint rules

### Known Constraints

- No index on favourites table for faster lookups (single user key query)
- Map config size tightly managed; large custom layer styles may not fit
- Duplicate map names auto-renamed (appends `(2)`, `(3)`, etc.)
- Max 25 saved maps per user enforced at API level
- Guest favourites merged one-time at sign-in (no continuous sync)

## Related Documentation

- [README.md](../README.md) - Setup, deployment, and general architecture
- [CONTRIBUTING.md](../CONTRIBUTING.md) - Development workflow (if it exists)
- Inline JSDoc in source files for function-level documentation
