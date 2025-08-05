-- Test SQL queries for meal planning functionality
-- Run these in Supabase SQL Editor to verify meal operations

-- 1. Check current meals table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'meals' 
ORDER BY ordinal_position;

-- 2. Count total meals in database
SELECT COUNT(*) as total_meals FROM public.meals;

-- 3. Count meals by user (replace with your actual user_id)
SELECT 
  user_id,
  COUNT(*) as meal_count,
  COUNT(DISTINCT trip_id) as trip_count
FROM public.meals 
GROUP BY user_id;

-- 4. Show sample meals with their trip information
SELECT 
  m.id,
  m.name,
  m.day,
  m.type,
  m.ingredients,
  m.is_custom,
  m.servings,
  m.created_at,
  t.trip_name
FROM public.meals m
LEFT JOIN public.trips t ON m.trip_id = t.id
ORDER BY m.created_at DESC
LIMIT 10;

-- 5. Check for any invalid UUID formats in meals table
SELECT 
  id,
  name,
  CASE 
    WHEN id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN 'Valid UUID'
    ELSE 'Invalid UUID'
  END as id_format,
  LENGTH(id) as id_length
FROM public.meals
WHERE NOT (id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')
LIMIT 20;

-- 6. Test meal insertion with proper UUID (replace user_id and trip_id with actual values)
-- NOTE: You'll need to replace these UUIDs with actual ones from your database
/*
INSERT INTO public.meals (
  id,
  trip_id,
  user_id,
  name,
  day,
  type,
  ingredients,
  is_custom,
  servings,
  shared_servings
) VALUES (
  gen_random_uuid(),
  'your-trip-id-here',
  'your-user-id-here',
  'Test Meal',
  1,
  'dinner',
  '["Test ingredient 1", "Test ingredient 2"]'::jsonb,
  true,
  4,
  true
);
*/

-- 7. Check meals by type distribution
SELECT 
  type,
  COUNT(*) as count,
  ROUND(AVG(servings), 1) as avg_servings
FROM public.meals 
GROUP BY type
ORDER BY count DESC;

-- 8. Find meals with empty or null ingredients
SELECT 
  id,
  name,
  ingredients,
  CASE 
    WHEN ingredients IS NULL THEN 'NULL ingredients'
    WHEN jsonb_array_length(ingredients) = 0 THEN 'Empty ingredients array'
    ELSE 'Has ingredients'
  END as ingredient_status
FROM public.meals
WHERE ingredients IS NULL OR jsonb_array_length(ingredients) = 0;

-- 9. Check RLS policies are working (this should only return meals for the authenticated user)
SELECT 
  COUNT(*) as accessible_meals,
  COUNT(DISTINCT trip_id) as accessible_trips
FROM public.meals;

-- 10. Test meal update operation (replace with actual meal ID)
/*
UPDATE public.meals 
SET 
  name = 'Updated Test Meal',
  ingredients = '["Updated ingredient 1", "Updated ingredient 2", "New ingredient"]'::jsonb,
  updated_at = NOW()
WHERE id = 'your-meal-id-here';
*/

-- 11. Clean up test data (uncomment to remove test meals)
/*
DELETE FROM public.meals 
WHERE name LIKE 'Test Meal%' OR name LIKE 'Updated Test Meal%';
*/

-- 12. Performance check - ensure indexes are being used
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM public.meals 
WHERE trip_id = 'sample-trip-id' AND user_id = 'sample-user-id';

-- 13. Check for orphaned meals (meals without corresponding trips)
SELECT 
  m.id,
  m.name,
  m.trip_id,
  CASE 
    WHEN t.id IS NULL THEN 'Orphaned - No trip found'
    ELSE 'Valid - Trip exists'
  END as trip_status
FROM public.meals m
LEFT JOIN public.trips t ON m.trip_id = t.id
WHERE t.id IS NULL;

-- 14. Check for timezone consistency
SELECT 
  id,
  name,
  created_at,
  updated_at,
  EXTRACT(TIMEZONE FROM created_at) as created_tz,
  EXTRACT(TIMEZONE FROM updated_at) as updated_tz
FROM public.meals
WHERE created_at IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;