-- Check if the view exists and its security properties
SELECT 
    schemaname,
    viewname,
    viewowner,
    definition
FROM pg_views 
WHERE viewname = 'trip_performance_stats'
AND schemaname = 'public';

-- Check for SECURITY DEFINER in the view definition
SELECT 
    proname AS function_name,
    prosecdef AS has_security_definer
FROM pg_proc
WHERE proname = 'trip_performance_stats'
OR proname LIKE '%trip_performance%';

-- Alternative check using information schema
SELECT 
    table_schema,
    table_name,
    view_definition
FROM information_schema.views
WHERE table_name = 'trip_performance_stats';