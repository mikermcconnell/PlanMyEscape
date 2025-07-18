-- Migration: Add trip sharing functionality
-- Execute with supabase db push

-- 1. Create shared_trips table for trip sharing
CREATE TABLE IF NOT EXISTS public.shared_trips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_with_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_with_email TEXT NOT NULL,
  permission_level TEXT NOT NULL CHECK (permission_level IN ('read', 'edit')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(trip_id, shared_with_email)
);

-- 2. Create trip_invitations table for email-based invitations
CREATE TABLE IF NOT EXISTS public.trip_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  invited_email TEXT NOT NULL,
  permission_level TEXT NOT NULL CHECK (permission_level IN ('read', 'edit')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  invitation_token UUID NOT NULL DEFAULT uuid_generate_v4(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(trip_id, invited_email)
);

-- 3. Enable RLS on new tables
ALTER TABLE public.shared_trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_invitations ENABLE ROW LEVEL SECURITY;

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS shared_trips_trip_id_idx ON public.shared_trips(trip_id);
CREATE INDEX IF NOT EXISTS shared_trips_owner_id_idx ON public.shared_trips(owner_id);
CREATE INDEX IF NOT EXISTS shared_trips_shared_with_id_idx ON public.shared_trips(shared_with_id);
CREATE INDEX IF NOT EXISTS shared_trips_shared_with_email_idx ON public.shared_trips(shared_with_email);
CREATE INDEX IF NOT EXISTS trip_invitations_trip_id_idx ON public.trip_invitations(trip_id);
CREATE INDEX IF NOT EXISTS trip_invitations_owner_id_idx ON public.trip_invitations(owner_id);
CREATE INDEX IF NOT EXISTS trip_invitations_invited_email_idx ON public.trip_invitations(invited_email);
CREATE INDEX IF NOT EXISTS trip_invitations_token_idx ON public.trip_invitations(invitation_token);

-- 5. Create RLS policies for shared_trips table
CREATE POLICY "Users can view their own shared trips"
  ON public.shared_trips
  FOR SELECT
  USING (auth.uid() = owner_id OR auth.uid() = shared_with_id);

CREATE POLICY "Trip owners can manage shared trips"
  ON public.shared_trips
  FOR ALL
  USING (auth.uid() = owner_id);

CREATE POLICY "Shared users can update their own shared trip status"
  ON public.shared_trips
  FOR UPDATE
  USING (auth.uid() = shared_with_id);

-- 6. Create RLS policies for trip_invitations table
CREATE POLICY "Users can view their own trip invitations"
  ON public.trip_invitations
  FOR SELECT
  USING (auth.uid() = owner_id OR auth.email() = invited_email);

CREATE POLICY "Trip owners can manage trip invitations"
  ON public.trip_invitations
  FOR ALL
  USING (auth.uid() = owner_id);

-- 7. Update existing RLS policies to support shared access
DROP POLICY IF EXISTS "Users can only access own trips" ON public.trips;
CREATE POLICY "Users can access owned and shared trips"
  ON public.trips
  FOR SELECT
  USING (
    auth.uid() = user_id OR
    id IN (
      SELECT trip_id FROM public.shared_trips 
      WHERE shared_with_id = auth.uid() AND status = 'accepted'
    )
  );

CREATE POLICY "Users can modify only owned trips"
  ON public.trips
  FOR INSERT, UPDATE, DELETE
  USING (auth.uid() = user_id);

-- 8. Update packing_items policy to allow shared access
DROP POLICY IF EXISTS "Users can only access own packing items" ON public.packing_items;
CREATE POLICY "Users can access packing items for owned and shared trips"
  ON public.packing_items
  FOR SELECT
  USING (
    auth.uid() = user_id OR
    trip_id IN (
      SELECT trip_id FROM public.shared_trips 
      WHERE shared_with_id = auth.uid() AND status = 'accepted'
    )
  );

CREATE POLICY "Users can modify packing items for owned and editable shared trips"
  ON public.packing_items
  FOR INSERT, UPDATE, DELETE
  USING (
    auth.uid() = user_id OR
    trip_id IN (
      SELECT trip_id FROM public.shared_trips 
      WHERE shared_with_id = auth.uid() AND status = 'accepted' AND permission_level = 'edit'
    )
  );

-- 9. Update meals policy to allow shared access
DROP POLICY IF EXISTS "Users can only access own meals" ON public.meals;
CREATE POLICY "Users can access meals for owned and shared trips"
  ON public.meals
  FOR SELECT
  USING (
    auth.uid() = user_id OR
    trip_id IN (
      SELECT trip_id FROM public.shared_trips 
      WHERE shared_with_id = auth.uid() AND status = 'accepted'
    )
  );

CREATE POLICY "Users can modify meals for owned and editable shared trips"
  ON public.meals
  FOR INSERT, UPDATE, DELETE
  USING (
    auth.uid() = user_id OR
    trip_id IN (
      SELECT trip_id FROM public.shared_trips 
      WHERE shared_with_id = auth.uid() AND status = 'accepted' AND permission_level = 'edit'
    )
  );

-- 10. Update shopping_lists policy to allow shared access
DROP POLICY IF EXISTS "Users can only access own shopping lists" ON public.shopping_lists;
CREATE POLICY "Users can access shopping lists for owned and shared trips"
  ON public.shopping_lists
  FOR SELECT
  USING (
    auth.uid() = user_id OR
    trip_id IN (
      SELECT trip_id FROM public.shared_trips 
      WHERE shared_with_id = auth.uid() AND status = 'accepted'
    )
  );

CREATE POLICY "Users can modify shopping lists for owned and editable shared trips"
  ON public.shopping_lists
  FOR INSERT, UPDATE, DELETE
  USING (
    auth.uid() = user_id OR
    trip_id IN (
      SELECT trip_id FROM public.shared_trips 
      WHERE shared_with_id = auth.uid() AND status = 'accepted' AND permission_level = 'edit'
    )
  );

-- 11. Update groups policy to allow shared access
DROP POLICY IF EXISTS "Users can access groups for their trips" ON public.groups;
CREATE POLICY "Users can access groups for owned and shared trips"
  ON public.groups
  FOR SELECT
  USING (
    trip_id IN (
      SELECT id FROM public.trips WHERE user_id = auth.uid()
      UNION
      SELECT trip_id FROM public.shared_trips 
      WHERE shared_with_id = auth.uid() AND status = 'accepted'
    )
  );

CREATE POLICY "Users can modify groups for owned and editable shared trips"
  ON public.groups
  FOR INSERT, UPDATE, DELETE
  USING (
    trip_id IN (
      SELECT id FROM public.trips WHERE user_id = auth.uid()
      UNION
      SELECT trip_id FROM public.shared_trips 
      WHERE shared_with_id = auth.uid() AND status = 'accepted' AND permission_level = 'edit'
    )
  );

-- 12. Create function to clean up expired invitations
CREATE OR REPLACE FUNCTION cleanup_expired_invitations()
RETURNS void AS $$
BEGIN
  UPDATE public.trip_invitations 
  SET status = 'expired' 
  WHERE status = 'pending' AND expires_at < now();
END;
$$ LANGUAGE plpgsql;

-- 13. Create function to get user's trip permissions
CREATE OR REPLACE FUNCTION get_user_trip_permission(trip_uuid UUID, user_uuid UUID)
RETURNS TEXT AS $$
BEGIN
  -- Check if user owns the trip
  IF EXISTS (SELECT 1 FROM public.trips WHERE id = trip_uuid AND user_id = user_uuid) THEN
    RETURN 'owner';
  END IF;
  
  -- Check if user has shared access
  RETURN (
    SELECT permission_level 
    FROM public.shared_trips 
    WHERE trip_id = trip_uuid AND shared_with_id = user_uuid AND status = 'accepted'
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;