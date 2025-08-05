// Quick Supabase test script
// Run with: node test-supabase.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

console.log('🔍 Testing Supabase Configuration...\n');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Environment variables missing!');
  console.log('REACT_APP_SUPABASE_URL:', !!supabaseUrl);
  console.log('REACT_APP_SUPABASE_ANON_KEY:', !!supabaseKey);
  process.exit(1);
}

console.log('✅ Environment variables loaded');
console.log('URL:', supabaseUrl.substring(0, 30) + '...');
console.log('Key:', supabaseKey.substring(0, 20) + '...\n');

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    console.log('🔌 Testing connection...');
    
    // Test 1: Check if we can connect to the database
    const { data, error } = await supabase
      .from('trips')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error('❌ Connection failed:', error.message);
      return false;
    }
    
    console.log('✅ Database connection successful');
    console.log('📊 Current trips count:', data?.length || 0);
    return true;
    
  } catch (err) {
    console.error('❌ Test failed:', err.message);
    return false;
  }
}

async function testTables() {
  console.log('\n🗄️  Testing table access...');
  
  const tables = [
    'trips', 'groups', 'packing_items', 'meals', 
    'shopping_items', 'gear_items', 'todo_items', 'security_logs'
  ];
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('count', { count: 'exact', head: true });
      
      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
      } else {
        console.log(`✅ ${table}: accessible`);
      }
    } catch (err) {
      console.log(`❌ ${table}: ${err.message}`);
    }
  }
}

async function testPerformanceFunction() {
  console.log('\n📈 Testing performance function...');
  
  try {
    const { data, error } = await supabase.rpc('get_user_trip_performance_stats');
    
    if (error) {
      console.log('❌ Performance function:', error.message);
    } else {
      console.log('✅ Performance function: working');
      console.log('📊 Stats returned:', data?.length || 0, 'trips');
    }
  } catch (err) {
    console.log('❌ Performance function:', err.message);
  }
}

async function runTests() {
  const connectionOk = await testConnection();
  if (!connectionOk) return;
  
  await testTables();
  await testPerformanceFunction();
  
  console.log('\n🎉 Supabase testing complete!');
  console.log('\nNext steps:');
  console.log('1. Test user authentication by signing up/in');
  console.log('2. Create a test trip to verify CRUD operations');
  console.log('3. Test RLS by creating a second user');
}

runTests();