-- Complete schema setup for PlanMyEscape application
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create trips table
CREATE TABLE IF NOT EXISTS public.trips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  trip_name TEXT NOT NULL,
  trip_type TEXT,
  start_date DATE,
  end_date DATE,
  location TEXT,
  description TEXT,
  data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Create groups table
CREATE TABLE IF NOT EXISTS public.groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  size INTEGER DEFAULT 1,
  contact_name TEXT,
  contact_email TEXT,
  color TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Create packing_items table with comprehensive fields
CREATE TABLE IF NOT EXISTS public.packing_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  is_checked BOOLEAN DEFAULT FALSE,
  weight INTEGER, -- in grams
  is_owned BOOLEAN DEFAULT FALSE,
  needs_to_buy BOOLEAN DEFAULT FALSE,
  is_packed BOOLEAN DEFAULT FALSE,
  required BOOLEAN DEFAULT FALSE,
  assigned_group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL,
  is_personal BOOLEAN DEFAULT FALSE,
  packed_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  last_modified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  last_modified_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create meals table with comprehensive fields
CREATE TABLE IF NOT EXISTS public.meals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  day INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  ingredients JSONB DEFAULT '[]'::jsonb,
  is_custom BOOLEAN DEFAULT FALSE,
  assigned_group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL,
  shared_servings BOOLEAN DEFAULT TRUE,
  servings INTEGER DEFAULT 1,
  last_modified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  last_modified_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create shopping_items table (replaces shopping_lists)
CREATE TABLE IF NOT EXISTS public.shopping_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  category TEXT NOT NULL CHECK (category IN ('food', 'camping')),
  is_checked BOOLEAN DEFAULT FALSE,
  is_owned BOOLEAN DEFAULT FALSE,
  needs_to_buy BOOLEAN DEFAULT FALSE,
  source_item_id UUID, -- Reference to packing item if generated from packing list
  assigned_group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL,
  cost DECIMAL(10,2),
  paid_by_group_id UUID REFERENCES public.groups(id) ON DELETE SET NULL,
  paid_by_user_name TEXT,
  splits JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create gear_items table (user-level, not trip-specific)
CREATE TABLE IF NOT EXISTS public.gear_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  weight INTEGER, -- in grams
  notes TEXT,
  assigned_trips JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Create todo_items table for trip-specific todo lists
CREATE TABLE IF NOT EXISTS public.todo_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Create security_logs table for security monitoring
CREATE TABLE IF NOT EXISTS public.security_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. Create deleted_ingredients table (for tracking manually deleted meal ingredients)
CREATE TABLE IF NOT EXISTS public.deleted_ingredients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ingredient_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(trip_id, user_id, ingredient_name)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_trips_user_id ON public.trips(user_id);
CREATE INDEX IF NOT EXISTS idx_groups_trip_id ON public.groups(trip_id);
CREATE INDEX IF NOT EXISTS idx_packing_items_trip_user ON public.packing_items(trip_id, user_id);
CREATE INDEX IF NOT EXISTS idx_meals_trip_user ON public.meals(trip_id, user_id);
CREATE INDEX IF NOT EXISTS idx_shopping_items_trip_user ON public.shopping_items(trip_id, user_id);
CREATE INDEX IF NOT EXISTS idx_gear_items_user ON public.gear_items(user_id);
CREATE INDEX IF NOT EXISTS idx_todo_items_trip_user ON public.todo_items(trip_id, user_id);
CREATE INDEX IF NOT EXISTS idx_todo_items_display_order ON public.todo_items(trip_id, user_id, display_order);
CREATE INDEX IF NOT EXISTS idx_security_logs_user ON public.security_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_security_logs_type ON public.security_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_deleted_ingredients_trip_user ON public.deleted_ingredients(trip_id, user_id);

-- Enable RLS on all tables
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packing_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gear_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.todo_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deleted_ingredients ENABLE ROW LEVEL SECURITY;

-- RLS Policies for trips
DROP POLICY IF EXISTS "Users can only access own trips" ON public.trips;
CREATE POLICY "Users can only access own trips" ON public.trips
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for groups (access through trip ownership)
DROP POLICY IF EXISTS "Users can access groups for their trips" ON public.groups;
CREATE POLICY "Users can access groups for their trips" ON public.groups
  FOR ALL USING (trip_id IN (SELECT id FROM public.trips WHERE user_id = auth.uid()));

-- RLS Policies for packing_items
DROP POLICY IF EXISTS "Users can access their own packing items" ON public.packing_items;
CREATE POLICY "Users can access their own packing items" ON public.packing_items
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for meals
DROP POLICY IF EXISTS "Users can access their own meals" ON public.meals;
CREATE POLICY "Users can access their own meals" ON public.meals
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for shopping_items
DROP POLICY IF EXISTS "Users can access their own shopping items" ON public.shopping_items;
CREATE POLICY "Users can access their own shopping items" ON public.shopping_items
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for gear_items
DROP POLICY IF EXISTS "Users can access their own gear items" ON public.gear_items;
CREATE POLICY "Users can access their own gear items" ON public.gear_items
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for todo_items
DROP POLICY IF EXISTS "Users can access their own todo items" ON public.todo_items;
CREATE POLICY "Users can access their own todo items" ON public.todo_items
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for security_logs (users can insert, admins can read)
DROP POLICY IF EXISTS "Allow insert for all authenticated users" ON public.security_logs;
CREATE POLICY "Allow insert for all authenticated users" ON public.security_logs
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow read for same user" ON public.security_logs;
CREATE POLICY "Allow read for same user" ON public.security_logs
  FOR SELECT USING (auth.uid() = user_id);

-- RLS Policies for deleted_ingredients
DROP POLICY IF EXISTS "Users can access their own deleted ingredients" ON public.deleted_ingredients;
CREATE POLICY "Users can access their own deleted ingredients" ON public.deleted_ingredients
  FOR ALL USING (auth.uid() = user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create updated_at triggers for tables that need them
DROP TRIGGER IF EXISTS update_trips_updated_at ON public.trips;
CREATE TRIGGER update_trips_updated_at BEFORE UPDATE ON public.trips
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_packing_items_updated_at ON public.packing_items;
CREATE TRIGGER update_packing_items_updated_at BEFORE UPDATE ON public.packing_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_meals_updated_at ON public.meals;
CREATE TRIGGER update_meals_updated_at BEFORE UPDATE ON public.meals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_shopping_items_updated_at ON public.shopping_items;
CREATE TRIGGER update_shopping_items_updated_at BEFORE UPDATE ON public.shopping_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_gear_items_updated_at ON public.gear_items;
CREATE TRIGGER update_gear_items_updated_at BEFORE UPDATE ON public.gear_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_todo_items_updated_at ON public.todo_items;
CREATE TRIGGER update_todo_items_updated_at BEFORE UPDATE ON public.todo_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();