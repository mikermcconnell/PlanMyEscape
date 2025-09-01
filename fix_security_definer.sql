-- Quick fix for Security Definer issue
-- Drop and recreate the view without SECURITY DEFINER

-- 1. Drop the existing view and any dependencies
DROP VIEW IF EXISTS public.trip_performance_stats CASCADE;

-- 2. Drop the existing function (which has SECURITY DEFINER)
DROP FUNCTION IF EXISTS public.get_user_trip_performance_stats();

-- 3. Recreate the view WITHOUT SECURITY DEFINER or SECURITY INVOKER
-- This view is for admin/reporting only and should not be directly accessed by users
CREATE VIEW public.trip_performance_stats AS
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
-- No WHERE clause - admin view shows all data
GROUP BY t.id, t.trip_name, t.user_id, t.created_at, t.updated_at;

-- 4. Restrict view access to postgres role only (admin use)
REVOKE ALL ON public.trip_performance_stats FROM PUBLIC;
REVOKE ALL ON public.trip_performance_stats FROM authenticated;
REVOKE ALL ON public.trip_performance_stats FROM anon;
GRANT SELECT ON public.trip_performance_stats TO postgres;

-- 5. Create a new secure function WITHOUT SECURITY DEFINER
-- This function uses the querying user's permissions (SECURITY INVOKER is default)
CREATE OR REPLACE FUNCTION public.get_user_trip_performance_stats()
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
LANGUAGE sql
STABLE
AS $$
  -- This function runs with the permissions of the calling user (SECURITY INVOKER)
  -- RLS policies on the underlying tables will be enforced
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
  WHERE t.user_id = auth.uid()  -- Filter to current user's trips only
  GROUP BY t.id, t.trip_name, t.user_id, t.created_at, t.updated_at;
$$;

-- 6. Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_trip_performance_stats() TO authenticated;

-- Success confirmation
SELECT 'Security Definer issue fixed successfully!' as result;