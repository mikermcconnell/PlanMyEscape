-- Create todo_items table for trip-specific todo lists

CREATE TABLE IF NOT EXISTS todo_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_todo_items_trip_user ON todo_items(trip_id, user_id);
CREATE INDEX IF NOT EXISTS idx_todo_items_display_order ON todo_items(trip_id, user_id, display_order);

-- Enable RLS on todo_items table
ALTER TABLE todo_items ENABLE ROW LEVEL SECURITY;

-- RLS Policy for todo_items
CREATE POLICY "Users can access their own todo items" ON todo_items
    FOR ALL USING (auth.uid() = user_id);

-- Create updated_at trigger for todo_items
CREATE TRIGGER update_todo_items_updated_at BEFORE UPDATE ON todo_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();