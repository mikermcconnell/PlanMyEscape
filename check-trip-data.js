// Check trip data in Supabase
// Run with: node check-trip-data.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTripData() {
  console.log('🔍 Checking your trip data in Supabase...\n');
  
  try {
    // Check trips (this will show 0 because we're not authenticated)
    console.log('📋 TRIPS TABLE:');
    const { data: trips, error: tripsError } = await supabase
      .from('trips')
      .select('*');
    
    if (tripsError) {
      console.log('❌ Cannot read trips (RLS protection - this is normal)');
      console.log('   Error:', tripsError.message);
    } else {
      console.log('✅ Trips found:', trips.length);
      trips.forEach(trip => {
        console.log(`   - ${trip.trip_name} (${trip.location})`);
      });
    }
    
    // Check packing items
    console.log('\n🎒 PACKING ITEMS TABLE:');
    const { data: packingItems, error: packingError } = await supabase
      .from('packing_items')
      .select('*');
    
    if (packingError) {
      console.log('❌ Cannot read packing items (RLS protection - this is normal)');
      console.log('   Error:', packingError.message);
    } else {
      console.log('✅ Packing items found:', packingItems.length);
      packingItems.forEach(item => {
        console.log(`   - ${item.name} (${item.category}) x${item.quantity}`);
      });
    }
    
    // Check meals
    console.log('\n🍽️  MEALS TABLE:');
    const { data: meals, error: mealsError } = await supabase
      .from('meals')
      .select('*');
    
    if (mealsError) {
      console.log('❌ Cannot read meals (RLS protection - this is normal)');
      console.log('   Error:', mealsError.message);
    } else {
      console.log('✅ Meals found:', meals.length);
      meals.forEach(meal => {
        console.log(`   - Day ${meal.day}: ${meal.name} (${meal.type})`);
      });
    }
    
    // Check shopping items
    console.log('\n🛒 SHOPPING ITEMS TABLE:');
    const { data: shoppingItems, error: shoppingError } = await supabase
      .from('shopping_items')
      .select('*');
    
    if (shoppingError) {
      console.log('❌ Cannot read shopping items (RLS protection - this is normal)');
    } else {
      console.log('✅ Shopping items found:', shoppingItems.length);
    }
    
    // Check todo items
    console.log('\n✅ TODO ITEMS TABLE:');
    const { data: todoItems, error: todoError } = await supabase
      .from('todo_items')
      .select('*');
    
    if (todoError) {
      console.log('❌ Cannot read todo items (RLS protection - this is normal)');
    } else {
      console.log('✅ Todo items found:', todoItems.length);
    }
    
    // Count total records using admin queries
    console.log('\n📊 TOTAL RECORD COUNTS (All Users):');
    
    const tables = ['trips', 'packing_items', 'meals', 'shopping_items', 'todo_items'];
    
    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (!error) {
          console.log(`   ${table}: ${count} records`);
        }
      } catch (e) {
        console.log(`   ${table}: Unable to count`);
      }
    }
    
    console.log('\n🔐 Note: RLS errors above are GOOD - they mean your data is protected!');
    console.log('📊 Check the Supabase dashboard Table Editor to see your actual data.');
    
  } catch (error) {
    console.error('❌ Error checking data:', error.message);
  }
}

checkTripData();