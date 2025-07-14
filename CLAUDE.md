# PlanMyEscape - Claude Reference Guide

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
│   ├── DataExport.tsx
│   ├── ErrorBoundary.tsx
│   ├── ProtectedRoute.tsx
│   ├── SupaSignIn.tsx
│   ├── TripContainer.tsx
│   └── TripNavigation.tsx
├── pages/                 # Page components
│   ├── Dashboard.tsx
│   ├── TripSetup.tsx
│   ├── PackingList.tsx
│   ├── MealPlanner.tsx
│   ├── GearLocker.tsx
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
├── schemas/               # Validation schemas
└── middleware/            # Express middleware
```

## Database Schema (Supabase)
```sql
-- Core tables with RLS enabled
trips (id, user_id, trip_name, trip_type, start_date, end_date, ...)
groups (id, trip_id, name, size, contact_name, contact_email, color)
packing_items (id, trip_id, name, category, quantity, is_checked, ...)
meals (id, trip_id, name, day, type, ingredients, assigned_group_id)
gear_items (id, user_id, name, category, weight, notes)
security_logs (id, user_id, event_type, timestamp, details)
```

## Authentication Flow
1. **SupaSignIn** component handles login/signup
2. **AuthContext** provides auth state throughout app
3. **ProtectedRoute** wraps authenticated pages
4. **useRequireAuth** hook for auth requirements
5. RLS policies ensure data isolation per user

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
- **PackingList**: Manage packing items with templates
- **MealPlanner**: Plan meals with recipe suggestions
- **GearLocker**: Personal gear management
- **ActivitiesPlanner**: Activity planning and equipment
- **ShoppingList**: Generated from meals and packing items

### Data Components
- **DataExport**: Export trip data to PDF/JSON
- **WeatherCard**: Weather integration
- **ErrorBoundary**: Error handling wrapper

## Data Flow
1. **supabaseClient.ts**: Configured Supabase client
2. **supabaseTrips.ts**: Trip CRUD operations
3. **tripStorage.ts**: Local storage fallback
4. **storageAdapter.ts**: Abstraction layer for storage
5. **tripService.ts**: Business logic for trip operations

## Environment Variables
```env
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key (optional)
NEXT_PUBLIC_GA_TRACKING_ID=G-XXXXXXXXXX (optional)
```

## Testing Structure
- **Unit Tests**: `src/__tests__/`
- **Component Tests**: React Testing Library
- **Integration Tests**: Trip storage operations
- **E2E Tests**: Playwright (planned)

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

### Data Fetching
```typescript
const [data, setData] = useState();
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
  fetchData().catch(setError).finally(() => setLoading(false));
}, []);
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

## Important Notes
- All database operations must include user_id for RLS
- Security events should be logged via securityLogger.ts
- Use validation schemas from schemas/index.ts
- Follow existing component patterns and naming conventions
- Error boundaries catch and handle component errors
- Rate limiting is configured but needs backend implementation

## Migration Files
- `202507072030_rls_security.sql`: Enables RLS and adds user_id columns
- `202507072041_security_logs_table.sql`: Creates security logging table

## Deployment
- **Vercel**: Configured for automatic deployment
- **Environment**: Set vars in Vercel dashboard
- **Database**: Supabase hosted PostgreSQL
- **Static Assets**: Served from public/ directory