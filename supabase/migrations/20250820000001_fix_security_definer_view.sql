-- Fix Security Definer issue for trip_performance_stats view
-- This migration removes the SECURITY DEFINER property from the view

-- Drop the existing view first
DROP VIEW IF EXISTS public.trip_performance_stats;

-- Recreate the view WITHOUT SECURITY DEFINER
-- This view will now respect RLS policies
CREATE OR REPLACE VIEW public.trip_performance_stats AS
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
WHERE t.user_id = auth.uid()  -- Add RLS filter directly in view
GROUP BY t.id, t.trip_name, t.user_id, t.created_at, t.updated_at;

-- Grant appropriate permissions
GRANT SELECT ON public.trip_performance_stats TO authenticated;

-- Add comment explaining the security model
COMMENT ON VIEW public.trip_performance_stats IS 
'Performance statistics view for trips. Uses RLS via auth.uid() filter instead of SECURITY DEFINER to ensure users only see their own data.';