-- Migration: Enable RLS and add user_id columns & policies
-- NOTE: Execute with Supabase CLI: `supabase db push`

-- 1. Enable RLS on tables ---------------------------------------------------
ALTER TABLE IF EXISTS trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS packing_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS gear ENABLE ROW LEVEL SECURITY;

-- 2. Add user_id columns -----------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name = 'trips' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE trips ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name = 'packing_lists' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE packing_lists ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name = 'meals' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE meals ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name = 'gear' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE gear ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns WHERE table_name = 'shopping_lists' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE shopping_lists ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 3. Create indexes ----------------------------------------------------------
CREATE INDEX IF NOT EXISTS trips_user_id_idx ON trips(user_id);
CREATE INDEX IF NOT EXISTS packing_lists_user_id_idx ON packing_lists(user_id);
CREATE INDEX IF NOT EXISTS meals_user_id_idx ON meals(user_id);
CREATE INDEX IF NOT EXISTS gear_user_id_idx ON gear(user_id);
CREATE INDEX IF NOT EXISTS shopping_lists_user_id_idx ON shopping_lists(user_id);

-- 4. Policies ----------------------------------------------------------------
CREATE POLICY "Users can only access own trips"
  ON trips
  FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can only access own packing lists"
  ON packing_lists
  FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can only access own meals"
  ON meals
  FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can only access own gear"
  ON gear
  FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can only access own shopping lists"
  ON shopping_lists
  FOR ALL
  USING (auth.uid() = user_id); 