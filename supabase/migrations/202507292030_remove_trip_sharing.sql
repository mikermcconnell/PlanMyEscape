-- Migration: Remove trip sharing functionality
-- Execute with supabase db push

-- 1. Revert RLS policies to original state (no shared access)

-- Revert trips policies
DROP POLICY IF EXISTS "Users can access owned and shared trips" ON public.trips;
DROP POLICY IF EXISTS "Users can modify only owned trips" ON public.trips;
CREATE POLICY "Users can only access own trips"
  ON public.trips
  FOR ALL
  USING (auth.uid() = user_id);

-- Revert packing_items policies
DROP POLICY IF EXISTS "Users can access packing items for owned and shared trips" ON public.packing_items;
DROP POLICY IF EXISTS "Users can modify packing items for owned and editable shared trips" ON public.packing_items;
CREATE POLICY "Users can only access own packing items"
  ON public.packing_items
  FOR ALL
  USING (auth.uid() = user_id);

-- Revert meals policies
DROP POLICY IF EXISTS "Users can access meals for owned and shared trips" ON public.meals;
DROP POLICY IF EXISTS "Users can modify meals for owned and editable shared trips" ON public.meals;
CREATE POLICY "Users can only access own meals"
  ON public.meals
  FOR ALL
  USING (auth.uid() = user_id);

-- Revert shopping_lists policies
DROP POLICY IF EXISTS "Users can access shopping lists for owned and shared trips" ON public.shopping_lists;
DROP POLICY IF EXISTS "Users can modify shopping lists for owned and editable shared trips" ON public.shopping_lists;
CREATE POLICY "Users can only access own shopping lists"
  ON public.shopping_lists
  FOR ALL
  USING (auth.uid() = user_id);

-- Revert groups policies
DROP POLICY IF EXISTS "Users can access groups for owned and shared trips" ON public.groups;
DROP POLICY IF EXISTS "Users can modify groups for owned and editable shared trips" ON public.groups;
CREATE POLICY "Users can access groups for their trips"
  ON public.groups
  FOR ALL
  USING (
    trip_id IN (
      SELECT id FROM public.trips WHERE user_id = auth.uid()
    )
  );

-- 2. Drop sharing-related functions
DROP FUNCTION IF EXISTS get_user_trip_permission(UUID, UUID);
DROP FUNCTION IF EXISTS cleanup_expired_invitations();

-- 3. Drop sharing tables (this will cascade and remove all sharing data)
DROP TABLE IF EXISTS public.shared_trips CASCADE;
DROP TABLE IF EXISTS public.trip_invitations CASCADE;