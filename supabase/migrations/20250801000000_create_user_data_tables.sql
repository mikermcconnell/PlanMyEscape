-- Create tables for user data with proper RLS policies

-- Packing Items Table
CREATE TABLE IF NOT EXISTS packing_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    is_checked BOOLEAN DEFAULT FALSE,
    weight INTEGER, -- in grams
    is_owned BOOLEAN DEFAULT FALSE,
    needs_to_buy BOOLEAN DEFAULT FALSE,
    is_packed BOOLEAN DEFAULT FALSE,
    required BOOLEAN DEFAULT FALSE,
    assigned_group_id UUID,
    is_personal BOOLEAN DEFAULT FALSE,
    packed_by_user_id UUID,
    last_modified_by UUID,
    last_modified_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Meals Table  
CREATE TABLE IF NOT EXISTS meals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    day INTEGER NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('breakfast', 'lunch', 'dinner', 'snack')),
    ingredients JSONB DEFAULT '[]'::jsonb,
    is_custom BOOLEAN DEFAULT FALSE,
    assigned_group_id UUID,
    shared_servings BOOLEAN DEFAULT TRUE,
    servings INTEGER DEFAULT 1,
    last_modified_by UUID,
    last_modified_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shopping Items Table
CREATE TABLE IF NOT EXISTS shopping_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    category TEXT NOT NULL CHECK (category IN ('food', 'camping')),
    is_checked BOOLEAN DEFAULT FALSE,
    is_owned BOOLEAN DEFAULT FALSE,
    needs_to_buy BOOLEAN DEFAULT FALSE,
    source_item_id UUID, -- Reference to packing item if generated from packing list
    assigned_group_id UUID,
    cost DECIMAL(10,2),
    paid_by_group_id UUID,
    paid_by_user_name TEXT,
    splits JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Gear Items Table (user-level, not trip-specific)
CREATE TABLE IF NOT EXISTS gear_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    weight INTEGER, -- in grams
    notes TEXT,
    assigned_trips JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Deleted Ingredients Table (for tracking manually deleted meal ingredients)
CREATE TABLE IF NOT EXISTS deleted_ingredients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    ingredient_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(trip_id, user_id, ingredient_name)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_packing_items_trip_user ON packing_items(trip_id, user_id);
CREATE INDEX IF NOT EXISTS idx_meals_trip_user ON meals(trip_id, user_id);
CREATE INDEX IF NOT EXISTS idx_shopping_items_trip_user ON shopping_items(trip_id, user_id);
CREATE INDEX IF NOT EXISTS idx_gear_items_user ON gear_items(user_id);
CREATE INDEX IF NOT EXISTS idx_deleted_ingredients_trip_user ON deleted_ingredients(trip_id, user_id);

-- Enable RLS on all tables
ALTER TABLE packing_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE gear_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE deleted_ingredients ENABLE ROW LEVEL SECURITY;

-- RLS Policies for packing_items
CREATE POLICY "Users can access their own packing items" ON packing_items
    FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for meals
CREATE POLICY "Users can access their own meals" ON meals
    FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for shopping_items
CREATE POLICY "Users can access their own shopping items" ON shopping_items
    FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for gear_items
CREATE POLICY "Users can access their own gear items" ON gear_items
    FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for deleted_ingredients
CREATE POLICY "Users can access their own deleted ingredients" ON deleted_ingredients
    FOR ALL USING (auth.uid() = user_id);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_packing_items_updated_at BEFORE UPDATE ON packing_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_meals_updated_at BEFORE UPDATE ON meals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shopping_items_updated_at BEFORE UPDATE ON shopping_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gear_items_updated_at BEFORE UPDATE ON gear_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();