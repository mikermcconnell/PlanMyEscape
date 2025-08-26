-- Add packing templates table
CREATE TABLE IF NOT EXISTS packing_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  trip_type TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add meal templates table
CREATE TABLE IF NOT EXISTS meal_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  trip_type TEXT NOT NULL,
  trip_duration INTEGER NOT NULL DEFAULT 1,
  meals JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on templates tables
ALTER TABLE packing_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_templates ENABLE ROW LEVEL SECURITY;

-- RLS policies for packing_templates
CREATE POLICY "Users can view their own packing templates" ON packing_templates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own packing templates" ON packing_templates FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own packing templates" ON packing_templates FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own packing templates" ON packing_templates FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for meal_templates
CREATE POLICY "Users can view their own meal templates" ON meal_templates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own meal templates" ON meal_templates FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own meal templates" ON meal_templates FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own meal templates" ON meal_templates FOR DELETE USING (auth.uid() = user_id);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_packing_templates_user_id ON packing_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_packing_templates_trip_type ON packing_templates(trip_type);
CREATE INDEX IF NOT EXISTS idx_packing_templates_created_at ON packing_templates(created_at);

CREATE INDEX IF NOT EXISTS idx_meal_templates_user_id ON meal_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_meal_templates_trip_type ON meal_templates(trip_type);
CREATE INDEX IF NOT EXISTS idx_meal_templates_created_at ON meal_templates(created_at);