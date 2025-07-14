# AI Project Notes: PlanMyEscape

## Project Purpose
PlanMyEscape is a collaborative trip planning web app. It helps users (often group leaders) organize multi-person trips by managing:
- Group membership and roles
- Packing and shopping lists (with "need to buy" and "owned" status)
- Meal planning and ingredient aggregation
- Activity scheduling
- Secure authentication and data storage (Supabase)

## Main Features (Detailed)
### 1. Trip Management
- Create, edit, and delete trips
- Each trip has a name, type, start/end dates, and associated groups
- Trip data is stored in Supabase and locally

### 2. Group Management
- Add, edit, and remove groups per trip
- Each group: name, size, contact info, color (must be valid `GroupColor`)
- Color is a strict union type; always coerce on load/save
- Modal UI for group creation/editing

### 3. Packing List
- Auto-generated based on trip type, group size, and weather
- Items can be marked as "Need to Buy" or "Owned"
- Only items marked as "Need to Buy" appear in the shopping list
- Items can be edited, deleted, or added manually
- Uses status buttons for quick toggling

### 4. Meal Planner
- Plan meals for each day and meal type (breakfast, lunch, dinner, snack)
- Assign ingredients to meals; ingredients are aggregated into the shopping list
- Custom meals and ingredients supported
- Meals can be assigned to groups (if coordinated)

### 5. Shopping List
- Unified list of all items marked as "Need to Buy" (from meals and packing)
- Only shows items with `needsToBuy: true`
- Removing "Need to Buy" or marking as "Owned" removes from list
- Add, edit, and delete items manually
- Notification shown when item is added to shopping list

### 6. Activity Planner
- Add, edit, and remove activities for the trip
- Activities can be assigned to days and groups

### 7. Authentication & Storage
- Uses Supabase for user authentication and trip data storage
- Local storage used for offline support and caching
- Zod schemas for runtime validation of all loaded/saved data

## Key Data Models & Types
- `Trip`: { id, name, type, startDate, endDate, groups, ... }
- `Group`: { id, name, size, contact, color (GroupColor) }
- `GroupColor`: strict union of allowed color strings
- `PackingItem`, `ShoppingItem`, `Meal`, `Activity`: see `src/types/`
- Always coerce and validate data from storage (see `coerceToGroup`, `toGroupColor`)

## UI Patterns & Conventions
- **Navigation:** `TripNavigation` for per-trip tabs; `Layout` for global nav
- **Buttons:** Use Tailwind, green for add/create, consistent icon usage (lucide-react)
- **Modals:** For group/activity creation and editing
- **Status Toggles:** For "Need to Buy", "Owned", and "Checked" states
- **Notifications:** Use confirmation toasts for user feedback
- **Dark Mode:** Supported via Tailwind dark classes

## Integration Notes
- **Supabase:** Used for auth and trip data; see `src/supabaseClient.ts`
- **Zod:** All data loaded from storage is validated with Zod schemas (see `src/schemas/`)
- **TypeScript:** Strict typing throughout; pain points with data loaded from storage (see below)

## Known Pain Points & Troubleshooting
- **GroupColor Typing:** Data from storage may not match strict union; always coerce and assert type after mapping
- **TypeScript Errors:** Use runtime validation and type assertions after mapping/coercion
- **Shopping List Sync:** Only show items with `needsToBuy: true`; ensure toggling/removal updates state and storage
- **Unused Variables:** Remove or prefix with `_` to avoid lint errors
- **UI Consistency:** Always match button and modal styles for a cohesive UX

## Running AI Changelog
- [2024-07-08] Created this file; summarized project, features, and conventions
- [2024-07-08] Updated shopping list logic: only show items with `needsToBuy: true`, remove on uncheck/owned
- [2024-07-08] Improved group color handling: always coerce to valid `GroupColor` on load/save
- [2024-07-08] Synced button styles for "Add Activity" and "Create New Group"
- [2024-07-08] Added notification for "Added to shopping list!" when toggling need to buy

## Open Questions / TODOs
- Should group creation be allowed for all users or only coordinators?
- Should shopping list support categories beyond "food" and "camping"?
- Add more robust error handling for Supabase/network failures
- Consider adding tests for group color coercion and shopping list filtering

## Tips for Future AI Tasks
- Always check this file before making changes
- Update this file with every new insight, convention, or major change
- When in doubt, search for existing patterns in `src/pages/` and `src/components/`
- Use Zod schemas for all runtime data validation
- Keep UI/UX consistent with Tailwind and lucide-react icons

---
_Last updated: 2024-07-08 (AI assistant)_ 