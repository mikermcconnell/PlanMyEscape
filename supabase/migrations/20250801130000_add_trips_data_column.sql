-- Add missing data JSONB column to trips table
-- This column is required by the SupabaseStorageAdapter to store additional trip data

ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS data JSONB DEFAULT '{}'::jsonb;

-- Add index for better performance when querying the JSONB data
CREATE INDEX IF NOT EXISTS idx_trips_data ON public.trips USING GIN (data);