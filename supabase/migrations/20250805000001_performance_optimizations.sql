-- Performance and Security Optimizations for PlanMyEscape
-- Run this AFTER the main schema migration

-- 1. Add critical missing indexes for performance
CREATE INDEX IF NOT EXISTS idx_packing_items_category_trip 
ON public.packing_items(trip_id, category, is_checked);

CREATE INDEX IF NOT EXISTS idx_meals_day_type 
ON public.meals(trip_id, day, type);

CREATE INDEX IF NOT EXISTS idx_shopping_items_category_checked 
ON public.shopping_items(trip_id, category, is_checked);

CREATE INDEX IF NOT EXISTS idx_todo_items_completed 
ON public.todo_items(trip_id, user_id, is_completed, display_order);

-- 2. JSONB optimization indexes
CREATE INDEX IF NOT EXISTS idx_trips_data_gin 
ON public.trips USING GIN (data);

CREATE INDEX IF NOT EXISTS idx_meals_ingredients_gin 
ON public.meals USING GIN (ingredients);

CREATE INDEX IF NOT EXISTS idx_shopping_items_splits_gin 
ON public.shopping_items USING GIN (splits);

CREATE INDEX IF NOT EXISTS idx_gear_items_trips_gin 
ON public.gear_items USING GIN (assigned_trips);

-- 3. Performance indexes for common filtering
CREATE INDEX IF NOT EXISTS idx_trips_date_range 
ON public.trips(user_id, start_date, end_date) WHERE start_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_security_logs_timestamp 
ON public.security_logs(timestamp DESC, user_id);

-- 4. Add data integrity constraints (with conditional logic)
DO $$
BEGIN
  -- Add constraints only if they don't exist
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_quantity_positive') THEN
    ALTER TABLE public.packing_items ADD CONSTRAINT check_quantity_positive CHECK (quantity > 0);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_weight_reasonable') THEN
    ALTER TABLE public.packing_items ADD CONSTRAINT check_weight_reasonable CHECK (weight IS NULL OR weight BETWEEN 0 AND 50000);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_day_valid') THEN
    ALTER TABLE public.meals ADD CONSTRAINT check_day_valid CHECK (day BETWEEN 1 AND 365);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_servings_positive') THEN
    ALTER TABLE public.meals ADD CONSTRAINT check_servings_positive CHECK (servings > 0);
  END IF;
END $$;

-- 5. Enhanced security policies for completed trips
DROP POLICY IF EXISTS "Protect completed trips packing" ON public.packing_items;
CREATE POLICY "Protect completed trips packing" ON public.packing_items
  FOR UPDATE USING (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM trips 
      WHERE id = trip_id 
      AND (end_date IS NULL OR end_date > NOW() - INTERVAL '30 days')
    )
  );

DROP POLICY IF EXISTS "Protect completed trips meals" ON public.meals;
CREATE POLICY "Protect completed trips meals" ON public.meals
  FOR UPDATE USING (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM trips 
      WHERE id = trip_id 
      AND (end_date IS NULL OR end_date > NOW() - INTERVAL '30 days')
    )
  );

-- 6. Create cleanup function for maintenance
CREATE OR REPLACE FUNCTION cleanup_old_security_logs()
RETURNS INTEGER 
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
  deleted_count INTEGER := 0;
BEGIN
  -- Remove security logs older than 1 year to save space
  DELETE FROM security_logs 
  WHERE timestamp < NOW() - INTERVAL '1 year';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Log the cleanup action
  INSERT INTO security_logs (user_id, event_type, details)
  VALUES (
    NULL,
    'system_cleanup',
    jsonb_build_object('deleted_logs', deleted_count, 'cleanup_date', NOW())
  );
  
  RETURN deleted_count;
END;
$$;

-- 7. Performance monitoring view
CREATE OR REPLACE VIEW trip_performance_stats AS
SELECT 
  t.id,
  t.trip_name,
  t.user_id,
  COUNT(DISTINCT pi.id) as packing_items_count,
  COUNT(DISTINCT m.id) as meals_count,
  COUNT(DISTINCT si.id) as shopping_items_count,
  COUNT(DISTINCT ti.id) as todo_items_count,
  CASE 
    WHEN COUNT(DISTINCT pi.id) > 500 OR COUNT(DISTINCT m.id) > 200 THEN 'HIGH'
    WHEN COUNT(DISTINCT pi.id) > 200 OR COUNT(DISTINCT m.id) > 100 THEN 'MEDIUM'
    ELSE 'LOW'
  END as complexity_level,
  t.created_at,
  t.updated_at
FROM trips t
LEFT JOIN packing_items pi ON t.id = pi.trip_id
LEFT JOIN meals m ON t.id = m.trip_id
LEFT JOIN shopping_items si ON t.id = si.trip_id
LEFT JOIN todo_items ti ON t.id = ti.trip_id
GROUP BY t.id, t.trip_name, t.user_id, t.created_at, t.updated_at;

-- 8. Create secure function for trip performance stats
-- Views can't have RLS policies, so we use a security definer function instead
CREATE OR REPLACE FUNCTION get_user_trip_performance_stats()
RETURNS TABLE (
  id UUID,
  trip_name TEXT,
  user_id UUID,
  packing_items_count BIGINT,
  meals_count BIGINT,
  shopping_items_count BIGINT,
  todo_items_count BIGINT,
  complexity_level TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only return stats for the authenticated user's trips
  RETURN QUERY
  SELECT 
    t.id,
    t.trip_name,
    t.user_id,
    COUNT(DISTINCT pi.id) as packing_items_count,
    COUNT(DISTINCT m.id) as meals_count,
    COUNT(DISTINCT si.id) as shopping_items_count,
    COUNT(DISTINCT ti.id) as todo_items_count,
    CASE 
      WHEN COUNT(DISTINCT pi.id) > 500 OR COUNT(DISTINCT m.id) > 200 THEN 'HIGH'::TEXT
      WHEN COUNT(DISTINCT pi.id) > 200 OR COUNT(DISTINCT m.id) > 100 THEN 'MEDIUM'::TEXT
      ELSE 'LOW'::TEXT
    END as complexity_level,
    t.created_at,
    t.updated_at
  FROM trips t
  LEFT JOIN packing_items pi ON t.id = pi.trip_id
  LEFT JOIN meals m ON t.id = m.trip_id
  LEFT JOIN shopping_items si ON t.id = si.trip_id
  LEFT JOIN todo_items ti ON t.id = ti.trip_id
  WHERE t.user_id = auth.uid()  -- Security: only user's own trips
  GROUP BY t.id, t.trip_name, t.user_id, t.created_at, t.updated_at;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_trip_performance_stats() TO authenticated;

-- Keep the view for admin/reporting purposes (without RLS)
-- Admin users can query this directly, but app users should use the function
ALTER VIEW trip_performance_stats OWNER TO postgres;