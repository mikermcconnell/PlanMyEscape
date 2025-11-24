# PlanMyEscape - Claude AI Development Guide

## 🎯 LEVEL 1: IMMEDIATE CONTEXT (What Claude needs first)
```
PROJECT: React/TypeScript camping trip planner with Supabase backend
DATA SERVICE: Always use hybridDataService.ts - never direct Supabase calls
DATA PERSISTENCE: ALL new features with user input MUST save to Supabase
CHECKPOINT: Run `checkpoint.bat create "description"` before major changes
COMMANDS: npm start | npm test | npm run type-check | npm run lint
ANDROID BUILDS: ALWAYS increment versionCode in android/app/build.gradle before building AAB
```

## 🚀 LEVEL 2: HOW DO I...
| Need to... | File Location | Key Pattern |
|------------|---------------|-------------|
| **Toggle item status** | `src/pages/PackingList.tsx:527` | `toggleOwned(itemId)` with immediate save |
| **Add packing item** | `src/hooks/usePackingItems.ts:25` | `hybridDataService.savePackingItems(tripId, items)` |
| **Assign meal to group** | `src/pages/MealPlanner.tsx:183` | Radio buttons with `assignedGroupId` |
| **Handle authentication** | `src/contexts/AuthContext.tsx` | `const { user } = useAuth()` |
| **Create modal** | `src/components/CostSplitter.tsx` | `isOpen` + `onClose` props pattern |
| **Save with debouncing** | `src/pages/PackingList.tsx:166` | `updateItems()` with `immediate=false` |
| **Save immediately** | `src/pages/PackingList.tsx:166` | `updateItems()` with `immediate=true` |

## 🧠 TASK THINK WORKFLOW (Explore-Plan-Code-Commit Pattern)
```
WHEN TO USE: Complex development tasks requiring context analysis and planning
TRIGGER: User says "Task Think" or tasks involve multiple files/components
BENEFITS: Prevents hasty coding, ensures proper context, reduces errors
```

### The Four-Phase Pattern
| Phase | Action | Tools/Keywords |
|-------|--------|----------------|
| **🔍 Explore** | Read relevant files, understand codebase context | `Read`, `Glob`, `Grep` |
| **🧠 Plan** | Think through solution with appropriate depth | `think` → `think hard` → `think harder` → `ultrathink` |
| **⚡ Implement** | Code the planned solution based on analysis | `Edit`, `Write`, `MultiEdit` |
| **🔗 Integration** | Commit changes, create PRs, verify functionality | `Bash (git)`, tests, linting |

### Usage Pattern
```typescript
// When user requests "Task Think":
1. Use TodoWrite to track the multi-phase approach
2. Exploration Phase: Read/analyze relevant files without coding
3. Planning Phase: Use sequential thinking to reason through solution
4. Implementation Phase: Execute planned changes systematically
5. Integration Phase: Commit, test, and verify implementation
```

### Benefits
- **Context Awareness**: Full understanding before coding
- **Reduced Errors**: Planning prevents implementation mistakes  
- **Better Solutions**: Considers edge cases and implications
- **Systematic Progress**: TodoWrite tracks multi-step progress

## 🧪 TEST-DRIVEN DEVELOPMENT (Write-Fail-Pass-Refactor Pattern)
```
WHEN TO USE: User says "Test-Driven Development" or "TDD" for any feature/task
TRIGGER: "Test-Driven Development: [feature description]"
BENEFITS: Higher quality code, better test coverage, fewer bugs, living documentation
```

## 🎯 RECOMMENDED APPROACH (Automatic Methodology Selection)
```
WHEN TO USE: User says "Use the recommended approach" for any task
TRIGGER: "Use the recommended approach: [task description]"
BENEFITS: Optimal methodology selection, best practices applied automatically
```

### Automatic Approach Selection
When you say "use the recommended approach", Claude will analyze your task and select:

| Task Type | Selected Approach | Why |
|-----------|------------------|-----|
| **New features** | Test-Driven Development | Ensures quality and clear requirements |
| **Complex refactoring** | Task Think | Requires deep analysis and planning |
| **Bug fixes** | Test-Driven Development | Prevents regression, verifies fix |
| **Multi-file changes** | Task Think | Needs context awareness across files |
| **Unknown scope** | Task Router Agent | Optimal agent selection for ambiguous tasks |
| **Performance issues** | Task Think + Performance Agent | Analysis + specialized optimization |
| **Security concerns** | TDD + Security Specialist | Quality assurance + vulnerability prevention |
| **UI/UX changes** | Task Think + UI Engineer | Planning + specialized frontend expertise |
| **Data migrations** | Task Think + TDD | Careful planning + verification |

### Command Pattern
```bash
# Let Claude choose the best approach
"Use the recommended approach: Add user profile editing with avatar upload"
→ Claude analyzes and selects TDD for new feature

"Use the recommended approach: Refactor authentication to support OAuth"  
→ Claude analyzes and selects Task Think for complex refactoring

"Use the recommended approach: Fix shopping list not saving"
→ Claude analyzes and selects TDD for bug fix
```

### The Five-Phase TDD Pattern
| Phase | Action | Tools/Agents |
|-------|--------|--------------|
| **🧪 Test Design** | Write comprehensive tests BEFORE implementation | `test-engineer`, `Write`, test files |
| **🔴 Verify Failures** | Confirm all tests fail (red state) | `npm test`, verify red state |
| **✅ Implement** | Write minimal code to make tests pass | `backend-implementer`, `ui-engineer` |
| **🔄 Iterate** | Code iteratively until all tests green | Keep coding until green |
| **🔍 Verify Quality** | Review implementation and test coverage | `code-reviewer`, refactor safely |

### TDD Agent Workflow
```typescript
// When user requests "Test-Driven Development: [feature]":
1. Use TodoWrite to track TDD phases
2. Test Design Phase: test-engineer creates comprehensive test suite
3. Failure Verification: Run tests, confirm they fail appropriately  
4. Implementation Phase: Implement minimal passing code
5. Iteration: Continue until all tests pass (green state)
6. Quality Review: code-reviewer verifies implementation quality
```

### TDD Command Patterns
```bash
# Phase 1: Test Design (ALWAYS FIRST)
"Test-Driven Development: Add trip notes with autosave and group sharing"
→ test-engineer writes comprehensive tests in src/__tests__/

# Phase 2: Verify Failures
"Run tests to confirm red state"
→ npm test shows expected failures

# Phase 3-4: Implementation & Iteration  
"Implement minimal code to make tests pass"
→ backend-implementer/ui-engineer writes passing code

# Phase 5: Quality Review
"Review TDD implementation for quality and coverage"
→ code-reviewer verifies and suggests improvements
```

### TDD Integration with PlanMyEscape Patterns
- **Data Service**: Tests must verify hybridDataService usage
- **Authentication**: Tests include user auth state scenarios
- **Supabase Integration**: Mock Supabase calls, test RLS compliance
- **Component Props**: Test isOpen/onClose patterns, prop interfaces
- **Debounced Saves**: Test timing behavior (e.g., 500ms autosave)
- **Group Assignment**: Test group filtering and assignment logic

### TDD Benefits
- **Requirements Clarity**: Tests define exact behavior before coding
- **Regression Prevention**: New features can't break existing functionality  
- **Design Quality**: TDD forces better component interfaces
- **Confidence**: Green tests mean features work as expected
- **Living Documentation**: Tests serve as behavioral documentation

## 🎯 DECISION TREES
```
WHEN TO SAVE:
├── Status change (owned/packed) → immediate=true
├── Text editing → debounced (150ms)
├── Template operations → immediate=true
└── Item deletion → immediate=true

WHICH DATA SERVICE:
├── Authenticated user → hybridDataService (Supabase + local backup)
├── Anonymous user → hybridDataService (local only)
├── NEVER use supabaseDataService directly
└── NEW FEATURES → MUST save to Supabase via hybridDataService

COMPONENT STATE:
├── Trip data → useOutletContext from TripContainer
├── Authentication → useAuth() hook
├── Local data fetching → useState + useEffect
└── Global state → React Context (AuthContext only)
```

## 🚨 COMMON ERROR PATTERNS
```
TypeScript Errors:
├── "Cannot find module" → Check import paths, run npm install
├── "Property does not exist" → Check type definitions in src/types/
├── "Object is possibly null" → Add null checks or optional chaining
└── "Type X is not assignable to type Y" → Check hybridDataService return types

Build Errors:
├── "Module not found" → Check file paths, case sensitivity
├── "Cannot resolve dependency" → npm install missing packages
├── "TypeScript compilation failed" → npm run type-check for details
└── "Out of memory" → Restart dev server

Runtime Errors:
├── "Cannot read property of undefined" → Add loading states
├── "Network request failed" → Check Supabase connection
├── "User is not authenticated" → Check useAuth() hook
└── "RLS policy violation" → Verify user_id in queries
```

## 🏥 HEALTH CHECK COMMANDS
```bash
# Quick system health check (run these in order)
npm run type-check     # TypeScript errors?
npm run lint          # Code quality issues?
npm test             # Tests passing?
git status           # Uncommitted changes?
```

## 📍 CONTEXT REFRESH (When Claude gets lost)
```bash
# Re-orient commands
npm start            # Is server running?
git log --oneline -5 # What changed recently?
ls src/pages/        # What pages exist?
ls src/components/   # What components exist?
```

## 🗺️ FILE IMPACT MAP (Change Dependencies)
```
If you modify... → Also check...
├── ⚠️ IMPORTANT: PackingListRefactored.tsx is ACTIVE (NOT PackingList.tsx)
├── src/pages/PackingListRefactored.tsx → src/components/packing/PackingItemRow.tsx, PackingCategory.tsx
├── src/components/packing/PackingItemRow.tsx → Individual item rendering
├── src/components/packing/PackingCategory.tsx → Category sections
├── src/services/hybridDataService.ts → All pages, all hooks
├── src/contexts/AuthContext.tsx → src/components/ProtectedRoute.tsx, all pages
├── src/types/index.ts → All TypeScript files
├── supabase/migrations/ → src/services/supabaseDataService.ts
├── src/pages/MealPlanner.tsx → src/pages/ShoppingListPage.tsx (ingredients)
└── src/components/TripContainer.tsx → All page components (context)
```

## 📊 DEVELOPMENT STATE INDICATORS
```
System is healthy when:
✅ npm start runs without errors
✅ npm run type-check shows no errors  
✅ npm test passes
✅ git status shows no unexpected changes
✅ Supabase connection working (check Network tab)

Red flags:
🚨 TypeScript errors in console
🚨 Network requests failing (check Supabase keys)
🚨 Tests failing after changes
🚨 Uncommitted changes accumulating
🚨 Build warnings about unused imports
```

---

## 📖 FULL REFERENCE (Detailed Documentation)

> **Quick Start**: This is your primary reference when working with Claude on PlanMyEscape.
> For app philosophy, see [DEVELOPMENT_CONTEXT.md](./DEVELOPMENT_CONTEXT.md)
> For troubleshooting, see [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

### Table of Contents
- [⚡ Essential Commands](#-essential-commands) 
- [🗂️ Common Tasks](#️-common-tasks)
- [🔄 Automatic Checkpoint System](#-automatic-checkpoint-system)
- [🏗️ Project Architecture](#️-project-architecture)
- [🔐 Security & Authentication](#-security--authentication)
- [📦 Component Reference](#-component-reference)
- [🔧 Development Patterns](#-development-patterns)
- [🧪 Testing Guidelines](#-testing-guidelines)
- [⚙️ Configuration & Deployment](#️-configuration--deployment)
- [📋 Architecture Guidelines](#-architecture-guidelines)

## 🚀 Quick Start
**Get running in 3 commands:**
```bash
npm start          # Start development server (port 3000)  
npm test           # Run test suite
npm run build      # Build for production
```

## ⚡ Essential Commands
```bash
# Development (Essential ⭐)
npm start                    # Start dev server (port 3000)
npm run lint                # Run ESLint 
npm run type-check          # TypeScript checking
npm test                    # Run tests

# Database (Essential ⭐)
supabase db push           # Push migrations
supabase login             # Authenticate

# Checkpoints (Essential ⭐) - USE ./ PREFIX ON WINDOWS
./checkpoint.bat create "Description"  # Create checkpoint (Windows - use ./ prefix!)
./checkpoint.bat list                  # List checkpoints
```

## 🗂️ Common Tasks
| Task | Location | Pattern |
|------|----------|---------|
| **Add new component** | `src/components/` | → [Component Patterns](#component-interaction-patterns) |
| **Update packing logic** | `src/pages/PackingListRefactored.tsx` | → [PackingList Patterns](#packinlist-implementation-patterns) |
| **Modify data service** | `src/services/hybridDataService.ts` | → [Data Operations](#data-operations) |
| **Handle authentication** | `src/contexts/AuthContext.tsx` | → [Authentication Flow](#authentication-flow) |
| **Add database table** | `supabase/migrations/` | → [Database Schema](#database-schema-supabase) |
| **Create modal dialog** | Follow Modal Pattern | → [Modal Patterns](#modal-and-dialog-patterns) |

---

## 🔄 Automatic Checkpoint System
Claude will automatically create Git checkpoints before any significant changes:

### When Checkpoints Are Created
- **Before Component Changes**: Modifying any React component
- **Before Service Updates**: Changes to data services or API integrations  
- **Before Database Migrations**: Any Supabase schema changes
- **Before Major Refactoring**: Restructuring code or file organization
- **Before Feature Implementation**: Adding new functionality
- **Before Deletion**: Removing files or significant code blocks
- **Before Package Updates**: npm install/update operations
- **Before Configuration Changes**: Modifying env vars, build configs, etc.

### Checkpoint Commands
```bash
# Windows
checkpoint.bat create "Description"  # Create checkpoint
checkpoint.bat list                  # List checkpoints
checkpoint.bat restore <name>        # Restore to checkpoint

# Unix/Mac
./checkpoint.sh create "Description"
./checkpoint.sh list
./checkpoint.sh restore <name>
```

### Automatic Checkpoint Naming Convention
- Format: `checkpoint-YYYYMMDD-HHMMSS`
- Example: `checkpoint-20250824-084456`
- Always includes descriptive commit message

---

## 🏗️ Project Architecture

### Project Overview
PlanMyEscape is a React/TypeScript camping and trip planning web application with Supabase backend. Users can plan trips, manage packing lists, coordinate meals, and collaborate with groups.

### Tech Stack
- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL with RLS)
- **Authentication**: Supabase Auth (Google, Facebook, Email/Password)
- **Testing**: Jest, React Testing Library
- **Deployment**: Vercel-ready
- **Build Tool**: Create React App

### Advanced Commands (Reference)
```bash
# Build & Testing
npm run build               # Build for production
npm run test:coverage       # Run tests with coverage

# Database Advanced
supabase link --project-ref <ref>  # Link to project
```

### Project Structure
```
src/
├── components/             # Reusable UI components
│   ├── layout/            # Layout components
│   ├── ActivitiesPlanner.tsx
│   ├── CostSplitter.tsx   # Cost splitting and expense management
│   ├── DataExport.tsx
│   ├── ErrorBoundary.tsx
│   ├── ExpenseSummary.tsx # Expense reporting and settlements
│   ├── ProtectedRoute.tsx
│   ├── ShoppingList.tsx   # Shopping list modal component
│   ├── SupaSignIn.tsx
│   ├── TripContainer.tsx
│   └── TripNavigation.tsx
├── pages/                 # Page components
│   ├── Dashboard.tsx
│   ├── TripSetup.tsx
│   ├── PackingList.tsx
│   ├── MealPlanner.tsx
│   ├── ShoppingListPage.tsx  # Main shopping list page
│   ├── TripOverview.tsx
│   ├── TripSchedule.tsx
│   ├── Notes.tsx
│   └── Privacy/Terms pages
├── utils/                 # Utility functions
│   ├── supabaseClient.ts  # Supabase client config
│   ├── supabaseTrips.ts   # Trip operations
│   ├── storage.ts         # Local storage utils
│   ├── authGuard.ts       # Authentication utilities
│   ├── validation.ts      # Input validation
│   └── securityLogger.ts  # Security event logging
├── types/                 # TypeScript definitions
├── data/                  # Static data/templates
├── hooks/                 # Custom React hooks
├── contexts/              # React contexts
├── services/              # Business logic services
│   ├── hybridDataService.ts    # Primary data service (local + Supabase)
│   └── supabaseDataService.ts  # Direct Supabase operations
├── schemas/               # Validation schemas
└── middleware/            # Express middleware
```

### Database Schema (Supabase)
```sql
-- Core tables with RLS enabled
trips (id, user_id, trip_name, trip_type, start_date, end_date, ...)
groups (id, trip_id, name, size, contact_name, contact_email, color)
packing_items (id, trip_id, name, category, quantity, is_checked, needs_to_buy, is_owned, is_packed, assigned_group_id, ...)
meals (id, trip_id, name, day, type, ingredients, assigned_group_id, is_custom)
shopping_items (id, trip_id, name, quantity, category, is_checked, cost, paid_by_group_id, splits, assigned_group_id, ...)
gear_items (id, user_id, name, category, weight, notes)
todo_items (id, trip_id, name, is_completed, assigned_group_id)
security_logs (id, user_id, event_type, timestamp, details)

-- Template tables (added 2025-08-26)
packing_templates (id, user_id, name, trip_type, items, created_at)
meal_templates (id, user_id, name, trip_type, trip_duration, meals, created_at)
```

---

## 🔐 Security & Authentication

### Authentication Flow
1. **SupaSignIn** component handles login/signup
2. **AuthContext** provides auth state throughout app with automatic data migration
3. **ProtectedRoute** wraps authenticated pages
4. **useRequireAuth** hook for auth requirements
5. RLS policies ensure data isolation per user
6. **Data Migration**: Upon sign-in, local data is automatically migrated to Supabase with retry logic

### Security Features
- **Row Level Security (RLS)**: Each user can only access their own data
- **Security Logging**: Login attempts, data access logged to security_logs table
- **Rate Limiting**: Express middleware for login attempts (5 per 15 min)
- **Input Validation**: Zod schemas for data validation
- **Security Headers**: CSP, X-Frame-Options, etc. in public/_headers

---

## 📦 Component Reference

### Trip Management
- **TripContainer**: Main trip wrapper with navigation
- **TripSetup**: Create/edit trip form
- **TripOverview**: Trip summary and details
- **TripNavigation**: Tab navigation between trip sections

### Feature Components
- **PackingList**: Simplified packing list with streamlined status management
  - **Three-Status System**: Items have three key status icons positioned on the left:
    - 🛒 **Need to Buy** (orange): Items that need to be purchased
    - ✅ **Owned** (green): Items the user already owns
    - ✓ **Packed** (blue/gray): Items that have been packed
  - **Two-Section Layout**: 
    - **Personal Items**: Individual gear (clothes, toiletries, personal equipment)
    - **Group Items**: Shared equipment (tents, cooking gear, tools)
  - **Template System**: Load default templates based on trip type (car camping, canoe camping, etc.)
  - **Auto-Shopping Integration**: Items marked "need to buy" automatically appear in shopping list
  - **Smart Status Logic**: Marking as "owned" removes from shopping list; "need to buy" sets owned=false
  - **Group Filtering**: Filter view by specific groups when trip is coordinated
  - **Categories**: Items organized by category (Shelter, Kitchen, Clothing, Personal, Tools, etc.)
  - **Pack Status Tracking**: Separate packed/unpacked sections for easy packing verification
- **MealPlanner**: Plan meals with recipe suggestions and custom meal creation  
  - **Simplified Group Assignment**: Radio button interface for meal responsibility:
    - "Shared" - All groups together
    - Individual group options (e.g., "Mic", "Dad") with member counts
  - **Auto-Shopping Integration**: Meal ingredients automatically appear in shopping list with group assignments
  - **Template System**: Save/load meal plan templates
  - **Smart Ingredient Management**: Ingredients from assigned meals inherit the group assignment
- **ShoppingListPage**: Main shopping list with cost tracking and expense splitting
  - Auto-populates from packing items (needsToBuy) and meal ingredients
  - Group-based item organization and filtering
  - Automatic group assignment from source items (meals/packing)
- **ActivitiesPlanner**: Activity planning and equipment recommendations

### Data Components
- **DataExport**: Export trip data to PDF/JSON
- **WeatherCard**: Weather integration
- **ErrorBoundary**: Error handling wrapper
- **CostSplitter**: Cost splitting modal for expense management
- **ExpenseSummary**: Expense reporting and settlement calculations
- **ShoppingList**: Reusable shopping list modal component

---

## 🔧 Development Patterns

### Data Flow & Architecture (Essential ⭐)

### Hybrid Storage Architecture
The app uses a sophisticated hybrid storage approach that seamlessly integrates local storage with Supabase:

1. **hybridDataService.ts**: Primary data service that handles all data operations
   - Automatically chooses between Supabase and local storage based on auth state
   - Provides fallback to local storage if Supabase operations fail
   - Handles data migration from local to Supabase upon user sign-in

2. **supabaseDataService.ts**: Direct Supabase operations with RLS
   - Handles all database CRUD operations
   - Implements Row Level Security policies
   - Includes deterministic UUID conversion for legacy data

3. **storage.ts**: Local storage utilities for offline functionality
   - Provides localStorage-based data persistence
   - Used as fallback when user is offline or Supabase fails

### Data Synchronization Strategy
- **Signed-in users**: Data saved to both Supabase (primary) and localStorage (backup)
- **Anonymous users**: Data stored only in localStorage
- **Migration on sign-in**: Existing local data automatically migrated to Supabase
- **Conflict resolution**: Supabase data takes precedence over local data

### Expense Management & Cost Splitting (Advanced)

### Cost Splitting Features
The app includes comprehensive expense management for group trips:

#### CostSplitter Component
- **Purpose**: Modal component for splitting costs among group members
- **Features**: 
  - Split costs equally or by custom amounts
  - Assign payments to specific group members
  - Track who paid and who owes what
  - Handle complex multi-group scenarios

#### ExpenseSummary Component  
- **Purpose**: Displays expense summaries and settlement calculations
- **Features**:
  - Total expense breakdowns by group
  - Individual member balances (who owes/is owed)
  - Settlement recommendations to minimize transactions
  - Export settlement reports

#### Shopping List Integration
- **Cost Tracking**: Each shopping item can have a cost and be assigned to a group member
- **Automatic Splitting**: Costs can be split among selected group members
- **Payment Tracking**: Track who actually paid for each item
- **Settlement Calculation**: Automatic calculation of who owes whom

### Usage Patterns
```typescript
// Adding cost to shopping item
const updateItemCost = async (itemId: string, cost: number, paidByGroupId: string) => {
  const updatedItem = {
    ...item,
    cost,
    paidByGroupId,
    splits: selectedGroups.map(g => ({ groupId: g.id, amount: cost / selectedGroups.length }))
  };
  await hybridDataService.saveShoppingItems(tripId, updatedItems);
};

// Settlement calculation
const calculateSettlements = (expenses: ShoppingItem[], groups: Group[]) => {
  // Returns array of { from: groupId, to: groupId, amount: number }
};
```

### Environment Variables (Reference)
```env
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key (optional)
NEXT_PUBLIC_GA_TRACKING_ID=G-XXXXXXXXXX (optional)
```

---

## 🧪 Testing Guidelines

### Testing Structure & Patterns (Essential ⭐)

### Testing Framework
- **Unit Tests**: `src/__tests__/` using Jest
- **Component Tests**: React Testing Library for UI components
- **Integration Tests**: Trip storage operations and data flow
- **E2E Tests**: Playwright (planned)

### Component Testing Patterns
```typescript
// Component testing with React Testing Library
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthContext } from '../contexts/AuthContext';
import PackingList from '../pages/PackingList';
import { hybridDataService } from '../services/hybridDataService';

// Mock hybrid data service
jest.mock('../services/hybridDataService');
const mockHybridDataService = hybridDataService as jest.Mocked<typeof hybridDataService>;

describe('PackingList Component', () => {
  const mockTrip = {
    id: 'test-trip-id',
    tripName: 'Test Trip',
    tripType: 'car camping',
    groups: [{ id: 'group1', name: 'Group 1', size: 2 }]
  };

  beforeEach(() => {
    mockHybridDataService.getPackingItems.mockResolvedValue([]);
  });

  test('renders packing list with items', async () => {
    render(
      <AuthContext.Provider value={{ user: { id: 'user1' }, isLoading: false }}>
        <PackingList trip={mockTrip} />
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('Packing List')).toBeInTheDocument();
    });
  });

  test('toggles item status', async () => {
    const mockItems = [{ id: '1', name: 'Tent', isOwned: false }];
    mockHybridDataService.getPackingItems.mockResolvedValue(mockItems);

    render(<PackingList trip={mockTrip} />);
    
    const ownedButton = await screen.findByTitle('Mark as owned');
    fireEvent.click(ownedButton);

    expect(mockHybridDataService.savePackingItems).toHaveBeenCalledWith(
      mockTrip.id,
      expect.arrayContaining([expect.objectContaining({ isOwned: true })])
    );
  });
});
```

### Service Testing Patterns
```typescript
// Service testing with mocked Supabase
import { hybridDataService } from '../services/hybridDataService';
import { supabase } from '../supabaseClient';

jest.mock('../supabaseClient');
const mockSupabase = supabase as jest.Mocked<typeof supabase>;

describe('HybridDataService', () => {
  beforeEach(() => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user1' } },
      error: null
    });
  });

  test('saves meals to Supabase when signed in', async () => {
    const testMeals = [{ id: '1', name: 'Breakfast', ingredients: ['eggs'] }];
    
    await hybridDataService.saveMeals('trip1', testMeals);
    
    expect(mockSupabase.from).toHaveBeenCalledWith('meals');
  });
});
```

### Component Interaction Patterns (Essential ⭐)

### Parent-Child Communication
```typescript
// src/components/TripContainer.tsx:45 - Parent component passing data and callbacks to child
const TripContainer: React.FC = () => {
  const [trip, setTrip] = useState<Trip>();
  const [selectedGroupId, setSelectedGroupId] = useState<string>('all');

  return (
    <div>
      <TripNavigation trip={trip} onGroupSelect={setSelectedGroupId} />
      <Outlet context={{ trip, setTrip, selectedGroupId }} />
    </div>
  );
};

// src/pages/PackingList.tsx:95 - Child component receiving context via useOutletContext
const PackingList: React.FC = () => {
  const { trip, setTrip, selectedGroupId } = useOutletContext<TripContextType>();
  
  const updateTrip = (updatedTrip: Trip) => {
    setTrip(updatedTrip);
  };

  return <div>Packing list for {trip.tripName}</div>;
};
```

### State Management Patterns
```typescript
// Context for global state
interface AuthContextType {
  user: User | null;
  signIn: (credentials: SignInCredentials) => Promise<void>;
  signOut: () => Promise<void>;
  isLoading: boolean;
}

// Custom hook for data fetching with loading states
const usePackingItems = (tripId: string) => {
  const [items, setItems] = useState<PackingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadItems = async () => {
      try {
        setLoading(true);
        const data = await hybridDataService.getPackingItems(tripId);
        setItems(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load items');
      } finally {
        setLoading(false);
      }
    };

    loadItems();
  }, [tripId]);

  return { items, setItems, loading, error };
};
```

### Modal and Dialog Patterns
```typescript
// Modal component with controlled visibility
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <button onClick={onClose} className="float-right">×</button>
        {children}
      </div>
    </div>
  );
};

// Usage in parent component
const ParentComponent = () => {
  const [showCostSplitter, setShowCostSplitter] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ShoppingItem | null>(null);

  return (
    <>
      <button onClick={() => setShowCostSplitter(true)}>Split Cost</button>
      
      <CostSplitter
        isOpen={showCostSplitter}
        item={selectedItem}
        onClose={() => setShowCostSplitter(false)}
        onSave={handleCostSave}
      />
    </>
  );
};
```

### Common Patterns (Essential ⭐)

### Error Handling
```typescript
try {
  const { data, error } = await supabase.from('trips').select();
  if (error) throw error;
  return data;
} catch (error) {
  console.error('Error:', error);
  throw new Error('User-friendly message');
}
```

### Authentication Check
```typescript
const { user } = useAuth();
if (!user) return <Navigate to="/signin" />;
```

### Data Fetching with Hybrid Service
```typescript
// src/hooks/usePackingItems.ts:15 - Standard data loading pattern
const [data, setData] = useState<PackingItem[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  const loadData = async () => {
    try {
      setLoading(true);
      // Always use hybridDataService for data operations
      const items = await hybridDataService.getPackingItems(tripId);
      setData(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  loadData();
}, [tripId]);

// Saving data with immediate state update and async persistence
const updateItem = async (itemId: string, updates: Partial<PackingItem>) => {
  // Optimistic update
  setData(prev => prev.map(item => 
    item.id === itemId ? { ...item, ...updates } : item
  ));
  
  try {
    // Persist to storage
    const updatedItems = data.map(item => 
      item.id === itemId ? { ...item, ...updates } : item
    );
    await hybridDataService.savePackingItems(tripId, updatedItems);
  } catch (error) {
    // Revert on error
    setData(prev => prev.map(item => 
      item.id === itemId ? { ...item } : item
    ));
    setError('Failed to save changes');
  }
};
```

### PackingList Implementation Patterns

#### Status Management System
The PackingList uses a simplified three-status approach with immediate saving:

```typescript
// src/pages/PackingList.tsx:527 - Status toggle functions with optimistic updates
const toggleOwned = async (itemId: string) => {
  const updatedItems = items.map(item => {
    if (item.id === itemId) {
      return {
        ...item,
        isOwned: !item.isOwned,
        needsToBuy: !item.isOwned ? false : item.needsToBuy // Smart logic
      };
    }
    return item;
  });
  updateItems(updatedItems, true); // immediate=true for status changes
};

const toggleNeedsToBuy = async (itemId: string) => {
  const updatedItems = items.map(item => {
    if (item.id === itemId) {
      return {
        ...item,
        needsToBuy: !item.needsToBuy,
        isOwned: !item.needsToBuy ? false : item.isOwned // Smart logic
      };
    }
    return item;
  });
  updateItems(updatedItems, true); // Immediate save for critical changes
};
```

#### Debounced vs Immediate Saving
```typescript
// src/pages/PackingList.tsx:166 - Two save strategies based on operation type
const updateItems = useCallback((newItems: PackingItem[], immediate = false) => {
  setItems(newItems);
  if (immediate) {
    // For critical operations like status toggles, save immediately
    immediateSave(tripId, newItems);
  } else {
    // For typing/editing, use debounced save (150ms)
    debouncedSave(tripId, newItems);
  }
}, [tripId, debouncedSave, immediateSave]);
```

#### Item Organization & Filtering
```typescript
// Separate items by personal/group and packed/unpacked status
const unpackedPersonalItems = useMemo(() => 
  displayedItems.filter(item => !item.isPacked && item.isPersonal), 
  [displayedItems]
);

const unpackedGroupItems = useMemo(() => 
  displayedItems.filter(item => !item.isPacked && !item.isPersonal), 
  [displayedItems]
);

// Group items by category for organized display
const groupedItems = useMemo(() =>
  categories.reduce((acc, category) => {
    acc[category] = items.filter(item => item.category === category);
    return acc;
  }, {} as Record<string, PackingItem[]>)
, [items, categories]);
```

### Shopping List Auto-Population (Advanced)
```typescript
// Shopping list automatically populates from packing items and meals
const useShoppingListSync = (tripId: string) => {
  useEffect(() => {
    const syncShoppingList = async () => {
      // hybridDataService automatically handles:
      // 1. Adding packing items marked as "needsToBuy"
      // 2. Adding ingredients from meal plans
      // 3. Removing orphaned items when meals/packing items change
      const shoppingItems = await hybridDataService.getShoppingItems(tripId);
      setShoppingItems(shoppingItems);
    };

    syncShoppingList();
  }, [tripId, packingItems, meals]); // Syncs when dependencies change
};
```

### Development Workflow (Essential ⭐)
1. **Start dev server**: `npm start`
2. **Make changes** to components/pages
3. **Run tests**: `npm test`
4. **Type check**: `npm run type-check`
5. **Lint code**: `npm run lint`
6. **Build**: `npm run build`

### Common Issues & Solutions (Essential ⭐)
- **Authentication**: Check supabaseClient.ts config
- **RLS Errors**: Verify user_id is included in queries
- **Build Errors**: Run type-check and lint
- **Database**: Check migration files in supabase/migrations/

---

## ⚙️ Configuration & Deployment

### File Extensions (Reference)
- `.tsx`: React components
- `.ts`: TypeScript utilities/services
- `.test.ts`: Test files
- `.d.ts`: Type definitions

### Deployment (Essential ⭐)
- **Vercel**: Configured for automatic deployment
- **Environment**: Set vars in Vercel dashboard
- **Database**: Supabase hosted PostgreSQL
- **Static Assets**: Served from public/ directory

### Migration Files (Reference)
- `202507072030_rls_security.sql`: Enables RLS and adds user_id columns
- `202507072041_security_logs_table.sql`: Creates security logging table

---

## 📋 Architecture Guidelines

### Important Notes & Best Practices (Essential ⭐)

### Data Operations
- **Always use hybridDataService**: Never directly call supabaseDataService or storage functions
- **RLS Requirements**: All database operations automatically include user_id for Row Level Security
- **UUID Generation**: Use `crypto.randomUUID()` for new items to ensure proper database compatibility
- **Optimistic Updates**: Update UI immediately, then save to storage for responsive UX
- **MANDATORY SUPABASE PERSISTENCE**: ALL new features with user input MUST be configured to save to Supabase
  - Every new form, input field, or user interaction that creates/modifies data MUST use hybridDataService
  - All new data types MUST have corresponding Supabase tables with RLS policies
  - Never create local-only features - all data must sync to Supabase when user is authenticated
  - Example: If adding a new "trip notes" feature, it MUST save to a `trip_notes` table in Supabase

### PackingList Status Management Best Practices
- **Status Icons Position**: Always position status icons on the left side of items for consistency
- **Three-Status System**: Maintain the simplified owned/needsToBuy/packed status approach
- **Smart Status Logic**: 
  - When marking as "owned" → automatically set needsToBuy=false and remove from shopping list
  - When marking as "needsToBuy" → automatically set isOwned=false
  - When marking as "packed" → no automatic status changes
- **Immediate vs Debounced Saves**: Use immediate saves for status changes, debounced saves for text editing
- **Section Organization**: Keep Personal Items and Group Items as separate sections
- **Category Grouping**: Items within sections should be grouped by category (Shelter, Kitchen, etc.)

### MealPlanner Group Assignment Best Practices
- **Radio Button Interface**: Use radio buttons instead of dropdowns for group meal assignment:
  ```typescript
  <input
    type="radio"
    name="mealGroup"
    value={group.id}
    checked={selectedGroupId === group.id}
    onChange={() => setSelectedGroupId(group.id)}
    className="h-4 w-4 text-blue-600 focus:ring-blue-500"
  />
  ```
- **Group Assignment Storage**: Store group assignments as `assignedGroupId: string | undefined` in the meal object
- **Shopping List Integration**: When saving meals with group assignments, ingredients automatically inherit the group assignment
- **Clear Labels**: Show group names with member counts: "Mic (2 people)", "Dad (1 person)", "Shared - All groups together"

### Component Architecture
- **Context Usage**: Use `useOutletContext` for trip data sharing between route components
- **State Management**: Prefer local state with custom hooks over global state unless truly global
- **Error Boundaries**: Wrap feature components in ErrorBoundary for graceful error handling
- **Modal Patterns**: Use controlled visibility props (`isOpen`, `onClose`) for modal components

### Data Synchronization
- **Shopping List**: Automatically syncs with packing items (`needsToBuy: true`) and meal ingredients
- **Real-time Updates**: Components listen to state changes and re-render automatically
- **Conflict Resolution**: Supabase data takes precedence over local storage
- **Migration Strategy**: Local data migrates to Supabase on user sign-in with retry logic

### Security & Validation
- **Input Validation**: Use Zod schemas from `schemas/index.ts` for all user input
- **Security Logging**: Important events logged via `securityLogger.ts`
- **Authentication**: Check user state with `useAuth()` hook before sensitive operations
- **Rate Limiting**: Configured in middleware but requires backend implementation

### Performance Considerations
- **Debounced Saves**: Use debounced saving for typing inputs (150ms delay)
- **Immediate Saves**: Use immediate saves for critical status changes (owned, packed, etc.)
- **Component Memoization**: Use `useMemo` and `useCallback` for expensive computations
- **Bundle Optimization**: Components are code-split by route for optimal loading

### Recent Changes (2025-08-26) (Reference)

### TypeScript & Build Fixes
- **TypeScript Version**: Downgraded from 5.x to 4.9.5 for react-scripts compatibility
- **Import Fixes**: Fixed MealTemplate type imports with explicit type imports
- **Method Binding**: Fixed `this` context binding in SupabaseDataService mapper methods
- **Strict Mode**: Fixed TypeScript strict mode compliance issues

### Feature Enhancements
- **Packing List Templates**: 
  - Now displays both default template name and loaded saved template name
  - Example: "Current List: Default Car Camping List (Loaded: Summer 2024 Trip)"
  - Clear distinction between base template and user-saved templates
  
- **Group Assignment**:
  - Packing items now have group assignment dropdowns (visible when trip is coordinated)
  - Automatic group assignment propagation to shopping list
  - Visual group indicators with colored borders
  
- **Shopping List Improvements**:
  - Automatic ingredient grouping from meals
  - Group-based filtering and organization
  - Preservation of group assignments from source items
  
- **Template Management**:
  - User-specific packing and meal templates
  - Save current lists as reusable templates
  - Load previously saved templates
  - Templates stored in Supabase with RLS

### Database Updates
- Added `packing_templates` table for saving packing list templates
- Added `meal_templates` table for saving meal plan templates
- Both tables include RLS policies for user data isolation

### Bug Fixes
- Fixed orphaned meal ingredients removal in shopping list
- Fixed template loading to preserve existing item statuses
- Fixed context binding issues in data service mappers
- Resolved Vercel deployment TypeScript compilation errors