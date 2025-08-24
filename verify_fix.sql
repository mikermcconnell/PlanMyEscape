-- Verify the view exists and check its definition
SELECT 
    schemaname,
    viewname,
    substring(definition, 1, 100) as definition_preview
FROM pg_views 
WHERE viewname = 'trip_performance_stats'
AND schemaname = 'public';

-- Test that the view works with RLS (should only show your trips)
SELECT * FROM public.trip_performance_stats LIMIT 1;