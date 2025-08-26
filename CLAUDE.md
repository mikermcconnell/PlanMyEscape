# PlanMyEscape - Claude Reference Guide

## AUTOMATIC CHECKPOINT SYSTEM
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

## Project Overview
PlanMyEscape is a React/TypeScript camping and trip planning web application with Supabase backend. Users can plan trips, manage packing lists, coordinate meals, and collaborate with groups.

## Tech Stack
- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL with RLS)
- **Authentication**: Supabase Auth (Google, Facebook, Email/Password)
- **Testing**: Jest, React Testing Library
- **Deployment**: Vercel-ready
- **Build Tool**: Create React App

## Key Commands
```bash
# Development
npm start                    # Start dev server (port 3000)
npm test                     # Run tests
npm run build               # Build for production
npm run lint                # Run ESLint
npm run type-check          # TypeScript type checking
npm run test:coverage       # Run tests with coverage

# Database
supabase db push            # Push migrations to Supabase
supabase login              # Authenticate with Supabase
supabase link --project-ref <ref>  # Link to project
```

## Project Structure
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

## Database Schema (Supabase)
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

## Authentication Flow
1. **SupaSignIn** component handles login/signup
2. **AuthContext** provides auth state throughout app with automatic data migration
3. **ProtectedRoute** wraps authenticated pages
4. **useRequireAuth** hook for auth requirements
5. RLS policies ensure data isolation per user
6. **Data Migration**: Upon sign-in, local data is automatically migrated to Supabase with retry logic

## Security Features
- **Row Level Security (RLS)**: Each user can only access their own data
- **Security Logging**: Login attempts, data access logged to security_logs table
- **Rate Limiting**: Express middleware for login attempts (5 per 15 min)
- **Input Validation**: Zod schemas for data validation
- **Security Headers**: CSP, X-Frame-Options, etc. in public/_headers

## Key Components

### Trip Management
- **TripContainer**: Main trip wrapper with navigation
- **TripSetup**: Create/edit trip form
- **TripOverview**: Trip summary and details
- **TripNavigation**: Tab navigation between trip sections

### Feature Components
- **PackingList**: Manage packing items with templates, status tracking, and group assignments
  - Shows both default template name and loaded saved template name
  - Group assignment dropdown for each item (when trip is coordinated)
  - Template save/load functionality with user-specific templates
- **MealPlanner**: Plan meals with recipe suggestions and custom meal creation
  - Template save/load functionality for meal plans
  - Automatic ingredient grouping for shopping list
  - Group assignment for meals
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

## Data Flow & Architecture

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

## Expense Management & Cost Splitting

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

## Environment Variables
```env
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key (optional)
NEXT_PUBLIC_GA_TRACKING_ID=G-XXXXXXXXXX (optional)
```

## Testing Structure & Patterns

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

## Component Interaction Patterns

### Parent-Child Communication
```typescript
// Parent component passing data and callbacks to child
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

// Child component receiving context via useOutletContext
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

## Common Patterns

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

### Shopping List Auto-Population
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

## Development Workflow
1. **Start dev server**: `npm start`
2. **Make changes** to components/pages
3. **Run tests**: `npm test`
4. **Type check**: `npm run type-check`
5. **Lint code**: `npm run lint`
6. **Build**: `npm run build`

## Common Issues & Solutions
- **Authentication**: Check supabaseClient.ts config
- **RLS Errors**: Verify user_id is included in queries
- **Build Errors**: Run type-check and lint
- **Database**: Check migration files in supabase/migrations/

## File Extensions
- `.tsx`: React components
- `.ts`: TypeScript utilities/services
- `.test.ts`: Test files
- `.d.ts`: Type definitions

## Important Notes & Architecture Guidelines

### Data Operations
- **Always use hybridDataService**: Never directly call supabaseDataService or storage functions
- **RLS Requirements**: All database operations automatically include user_id for Row Level Security
- **UUID Generation**: Use `crypto.randomUUID()` for new items to ensure proper database compatibility
- **Optimistic Updates**: Update UI immediately, then save to storage for responsive UX

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

## Migration Files
- `202507072030_rls_security.sql`: Enables RLS and adds user_id columns
- `202507072041_security_logs_table.sql`: Creates security logging table

## Deployment
- **Vercel**: Configured for automatic deployment
- **Environment**: Set vars in Vercel dashboard
- **Database**: Supabase hosted PostgreSQL
- **Static Assets**: Served from public/ directory

## Recent Changes (2025-08-26)

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