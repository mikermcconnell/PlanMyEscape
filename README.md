# PlanMyEscape

PlanMyEscape is a modern, full-stack camping and trip planning web application built with React, TypeScript, and Supabase. It allows users to plan trips, manage packing lists, coordinate meals, and collaborate with groups.

---

## 🚀 Features

- **Authentication**: Google, Facebook, and Email/Password via Supabase Auth
- **Secure Data Storage**: Per-user trip storage with Row Level Security (RLS)
- **Trip Management**: Create, view, edit, and delete trips with full CRUD operations
- **Packing Lists**: Smart templates and customizable packing items
- **Meal Planning**: Recipe suggestions and shopping list generation
- **Group Coordination**: Multi-group trip planning with contact management
- **Responsive Design**: Modern UI with Tailwind CSS, works on all devices
- **Real-time Updates**: Live data synchronization across devices

---

## 📋 Prerequisites

- **Node.js**: 18.0.0 or higher
- **npm**: 9.0.0 or higher
- **Git**: For version control
- **Supabase Account**: For authentication and database
- **Modern Browser**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

---

## 🛠️ Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/mikermcconnell/PlanMyEscape.git
cd PlanMyEscape
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup

Create environment files for different environments:

**Development** (`.env.development.local`):
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Optional: Analytics
NEXT_PUBLIC_GA_TRACKING_ID=your-ga-tracking-id
```

**Production** (`.env.production.local`):
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Production Analytics
NEXT_PUBLIC_GA_TRACKING_ID=your-ga-tracking-id
```

**Example** (`.env.example`):
```env
# Copy this file to .env.development.local and fill in your values
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
NEXT_PUBLIC_GA_TRACKING_ID=G-XXXXXXXXXX
```

### 4. Supabase Setup

#### Database Schema

Run these SQL commands in your Supabase SQL editor:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Trips table
CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  trip_name TEXT NOT NULL,
  trip_type TEXT NOT NULL CHECK (trip_type IN ('car camping', 'canoe camping', 'hike camping', 'cottage')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  description TEXT,
  location TEXT,
  is_coordinated BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Groups table
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  size INTEGER NOT NULL CHECK (size > 0),
  contact_name TEXT,
  contact_email TEXT,
  color TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Packing items table
CREATE TABLE packing_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  is_checked BOOLEAN DEFAULT false,
  weight DECIMAL(5,2),
  is_owned BOOLEAN DEFAULT false,
  needs_to_buy BOOLEAN DEFAULT false,
  is_packed BOOLEAN DEFAULT false,
  required BOOLEAN DEFAULT true,
  assigned_group_id UUID REFERENCES groups(id) ON DELETE SET NULL,
  is_personal BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Meals table
CREATE TABLE meals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  day INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  ingredients JSONB NOT NULL DEFAULT '[]',
  is_custom BOOLEAN DEFAULT false,
  assigned_group_id UUID REFERENCES groups(id) ON DELETE SET NULL,
  shared_servings BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Gear items table
CREATE TABLE gear_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  weight DECIMAL(5,2),
  notes TEXT,
  assigned_trips JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable Row Level Security
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE packing_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE gear_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can access their own trips" ON trips
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can access groups for their trips" ON groups
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM trips 
      WHERE trips.id = groups.trip_id 
      AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can access packing items for their trips" ON packing_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM trips 
      WHERE trips.id = packing_items.trip_id 
      AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can access meals for their trips" ON meals
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM trips 
      WHERE trips.id = meals.trip_id 
      AND trips.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can access their own gear" ON gear_items
  FOR ALL USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_trips_user_id ON trips(user_id);
CREATE INDEX idx_trips_created_at ON trips(created_at);
CREATE INDEX idx_groups_trip_id ON groups(trip_id);
CREATE INDEX idx_packing_items_trip_id ON packing_items(trip_id);
CREATE INDEX idx_meals_trip_id ON meals(trip_id);
CREATE INDEX idx_gear_items_user_id ON gear_items(user_id);
```

#### Authentication Setup

1. **Enable Auth Providers** in Supabase Dashboard:
   - Go to Authentication > Providers
   - Enable Google, Facebook, and Email providers
   - Configure OAuth settings for each provider

2. **Configure Redirect URLs**:
   - Add `http://localhost:3000/auth/callback` for development
   - Add your production domain for production

### 5. Run the Development Server
```bash
npm start
```

The app will be available at http://localhost:3000

---

## 🏗️ Project Structure

```
PlanMyEscape/
├── public/                    # Static assets
│   ├── index.html
│   ├── favicon.ico
│   └── sitemap.xml
├── src/                       # Source code
│   ├── components/            # Reusable UI components
│   │   ├── layout/
│   │   │   └── Layout.tsx
│   │   ├── TripContainer.tsx
│   │   ├── TripNavigation.tsx
│   │   └── WeatherCard.tsx
│   ├── pages/                 # Page components
│   │   ├── Dashboard.tsx
│   │   ├── TripSetup.tsx
│   │   ├── TripDetail.tsx
│   │   ├── PackingList.tsx
│   │   ├── MealPlanner.tsx
│   │   └── GearLocker.tsx
│   ├── utils/                 # Utility functions
│   │   ├── supabaseClient.ts  # Supabase client configuration
│   │   ├── supabaseTrips.ts   # Trip-related Supabase operations
│   │   └── storage.ts         # Local storage utilities
│   ├── types/                 # TypeScript type definitions
│   │   └── index.ts
│   ├── data/                  # Static data and templates
│   │   ├── packingTemplates.ts
│   │   ├── mealTemplates.ts
│   │   └── activityEquipment.ts
│   ├── App.tsx               # Main app component
│   └── index.tsx             # App entry point
├── .env.development.local    # Development environment variables
├── .env.example              # Environment variables template
├── package.json              # Dependencies and scripts
├── tsconfig.json             # TypeScript configuration
├── tailwind.config.js        # Tailwind CSS configuration
└── README.md                 # This file
```

---

## 🧪 Testing

### Unit and Integration Tests

We use Jest and React Testing Library for comprehensive testing:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

#### Test Examples

**Trip Storage Tests**:
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { saveTrip, getTrips } from '../utils/supabaseTrips';
import { setupTestUser, createTestTrip } from '../utils/testHelpers';

describe('Trip Storage', () => {
  beforeEach(async () => {
    await setupTestUser();
  });

  it('should save and fetch a trip', async () => {
    const trip = createTestTrip({
      tripName: 'Test Camping Trip',
      tripType: 'car camping',
      startDate: '2024-07-01',
      endDate: '2024-07-05'
    });

    const savedTrip = await saveTrip(trip);
    expect(savedTrip.id).toBeDefined();

    const trips = await getTrips();
    expect(trips).toContainEqual(
      expect.objectContaining({
        tripName: 'Test Camping Trip',
        tripType: 'car camping'
      })
    );
  });

  it('should handle save errors gracefully', async () => {
    const invalidTrip = createTestTrip({
      tripName: '', // Invalid: empty name
      tripType: 'invalid-type' as any
    });

    await expect(saveTrip(invalidTrip)).rejects.toThrow();
  });
});
```

**Component Tests**:
```typescript
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import TripSetup from '../pages/TripSetup';

describe('TripSetup Component', () => {
  const renderWithRouter = (component: React.ReactElement) => {
    return render(
      <BrowserRouter>
        {component}
      </BrowserRouter>
    );
  };

  it('should render trip setup form', () => {
    renderWithRouter(<TripSetup />);
    
    expect(screen.getByLabelText(/trip name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/trip type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/start date/i)).toBeInTheDocument();
  });

  it('should validate required fields', async () => {
    renderWithRouter(<TripSetup />);
    
    const submitButton = screen.getByRole('button', { name: /create trip/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/trip name is required/i)).toBeInTheDocument();
    });
  });
});
```

### End-to-End Tests

We use Playwright for E2E testing:

```bash
# Install Playwright
npm install -D @playwright/test

# Run E2E tests
npx playwright test

# Run E2E tests in headed mode
npx playwright test --headed
```

**E2E Test Example**:
```typescript
import { test, expect } from '@playwright/test';

test.describe('Trip Creation Flow', () => {
  test('should create a new trip successfully', async ({ page }) => {
    // Navigate to trip setup
    await page.goto('/trip-setup');
    
    // Fill out the form
    await page.fill('[data-testid="trip-name"]', 'Mountain Adventure');
    await page.selectOption('[data-testid="trip-type"]', 'hike camping');
    await page.fill('[data-testid="start-date"]', '2024-07-01');
    await page.fill('[data-testid="end-date"]', '2024-07-05');
    
    // Submit the form
    await page.click('[data-testid="create-trip-button"]');
    
    // Verify redirect to trip detail
    await expect(page).toHaveURL(/\/trip\/[a-f0-9-]+$/);
    await expect(page.locator('h1')).toContainText('Mountain Adventure');
  });
});
```

### Manual Testing Checklist

- [ ] **Authentication Flow**:
  - [ ] Sign up with email/password
  - [ ] Sign in with Google
  - [ ] Sign in with Facebook
  - [ ] Password reset functionality
  - [ ] Sign out functionality

- [ ] **Trip Management**:
  - [ ] Create new trip with all required fields
  - [ ] Edit existing trip details
  - [ ] Delete trip with confirmation
  - [ ] View trip list with proper filtering
  - [ ] Trip search functionality

- [ ] **Data Security**:
  - [ ] Users can only see their own trips
  - [ ] Unauthenticated users are redirected to login
  - [ ] API calls include proper authentication headers
  - [ ] Sensitive data is not exposed in client-side code

- [ ] **Error Handling**:
  - [ ] Network errors display user-friendly messages
  - [ ] Form validation shows clear error messages
  - [ ] Loading states are properly displayed
  - [ ] Graceful degradation when services are unavailable

- [ ] **Responsive Design**:
  - [ ] App works on mobile devices (320px+)
  - [ ] App works on tablets (768px+)
  - [ ] App works on desktop (1024px+)
  - [ ] Touch interactions work properly on mobile

---

## 🔒 Security Considerations

### Row Level Security (RLS)

All database tables use RLS policies to ensure users can only access their own data:

```sql
-- Example: Users can only access their own trips
CREATE POLICY "Users can access their own trips" ON trips
  FOR ALL USING (auth.uid() = user_id);
```

### Authentication Best Practices

1. **Never store sensitive data in localStorage**
2. **Use Supabase Auth for all authentication**
3. **Validate user permissions on both client and server**
4. **Implement proper session management**

### API Security

1. **All API calls include authentication headers**
2. **Validate input data on both client and server**
3. **Use parameterized queries to prevent SQL injection**
4. **Implement rate limiting for API endpoints**

### Environment Variables

- **Never commit `.env` files to version control**
- **Use different API keys for development and production**
- **Rotate API keys regularly**
- **Monitor API usage for suspicious activity**

---

## 🚨 Error Handling

### Client-Side Error Handling

```typescript
// Example: Trip operations with proper error handling
export const saveTrip = async (trip: Trip): Promise<Trip> => {
  try {
    const { data, error } = await supabase
      .from('trips')
      .upsert(trip)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to save trip: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Trip save error:', error);
    throw new Error(
      error instanceof Error 
        ? error.message 
        : 'An unexpected error occurred while saving the trip'
    );
  }
};
```

### Common Error Scenarios

1. **Network Errors**: Display user-friendly retry messages
2. **Authentication Errors**: Redirect to login page
3. **Validation Errors**: Show specific field error messages
4. **Permission Errors**: Display access denied messages
5. **Server Errors**: Show generic error with support contact

### Error Boundaries

```typescript
import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Send to error reporting service
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>Something went wrong</h2>
          <p>Please refresh the page or contact support.</p>
        </div>
      );
    }

    return this.props.children;
  }
}
```

---

## 🚀 Deployment

### Vercel Deployment

1. **Connect your GitHub repository to Vercel**
2. **Set environment variables in Vercel dashboard**
3. **Deploy automatically on push to main branch**

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy to Vercel
vercel --prod
```

### Environment Variables for Production

Set these in your Vercel dashboard:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
NEXT_PUBLIC_GA_TRACKING_ID=G-XXXXXXXXXX
```

### Performance Optimization

1. **Code Splitting**: Routes are automatically code-split
2. **Image Optimization**: Use Next.js Image component
3. **Caching**: Implement proper cache headers
4. **Bundle Analysis**: Monitor bundle size with `npm run build`

---

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** with proper tests
4. **Run the test suite**: `npm test`
5. **Commit your changes**: `git commit -m 'Add amazing feature'`
6. **Push to the branch**: `git push origin feature/amazing-feature`
7. **Open a Pull Request** with a clear description

### Development Guidelines

- **Follow TypeScript best practices**
- **Write tests for new features**
- **Update documentation for API changes**
- **Use conventional commit messages**
- **Ensure all tests pass before submitting PR**

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🆘 Support

- **Documentation**: Check this README and inline code comments
- **Issues**: Report bugs via GitHub Issues
- **Discussions**: Use GitHub Discussions for questions
- **Security**: Report security issues privately to maintainers

---

## 📊 Project Status

- ✅ **Core Features**: Trip management, authentication, basic CRUD
- ✅ **Security**: RLS policies, proper authentication
- ✅ **Testing**: Unit tests, integration tests, E2E tests
- 🔄 **In Progress**: Advanced meal planning, group coordination
- 📋 **Planned**: Offline support, mobile app, API documentation 