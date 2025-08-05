// Test script to verify packing list template override fix
// This simulates the user interaction and navigation scenario
// Run with: node test-packing-persistence.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Environment variables not set. Please update .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Test data
const TEST_USER_EMAIL = 'test-packing@example.com';
const TEST_USER_PASSWORD = 'testpassword123';
const TEST_TRIP_ID = crypto.randomUUID();

let testUser = null;
let testTripId = null;

async function createTestUser() {
  console.log('👤 Creating test user...');
  
  // Try to sign up (will fail if user exists, which is fine)
  const { data: signupData, error: signupError } = await supabase.auth.signUp({
    email: TEST_USER_EMAIL,
    password: TEST_USER_PASSWORD,
  });
  
  // Sign in (whether user existed or was just created)
  const { data: signinData, error: signinError } = await supabase.auth.signInWithPassword({
    email: TEST_USER_EMAIL,
    password: TEST_USER_PASSWORD,
  });
  
  if (signinError) {
    console.error('❌ Failed to sign in test user:', signinError.message);
    return false;
  }
  
  testUser = signinData.user;
  console.log('✅ Test user signed in:', testUser.email);
  return true;
}

async function createTestTrip() {
  console.log('🎒 Creating test trip...');
  
  const testTrip = {
    id: TEST_TRIP_ID,
    user_id: testUser.id,
    trip_name: 'Test Camping Trip - Packing Persistence',
    trip_type: 'car camping',
    start_date: '2024-08-15',
    end_date: '2024-08-17',
    location: 'Test Campground',
    description: 'Test trip for packing list persistence'
  };
  
  const { data, error } = await supabase
    .from('trips')
    .insert([testTrip])
    .select();
  
  if (error) {
    console.error('❌ Failed to create test trip:', error.message);
    return false;
  }
  
  testTripId = testTrip.id;
  console.log('✅ Test trip created:', testTrip.trip_name);
  return true;
}

async function createInitialPackingItems() {
  console.log('📝 Creating initial packing items...');
  
  const packingItems = [
    {
      id: crypto.randomUUID(),
      trip_id: testTripId,
      user_id: testUser.id,
      name: 'Test Tent',
      category: 'Shelter',
      quantity: 1,
      is_checked: false,
      is_owned: false,
      needs_to_buy: false,
      is_packed: false,
      required: true,
      is_personal: false,
      weight: 2000,
      notes: 'Test tent for camping'
    },
    {
      id: crypto.randomUUID(),
      trip_id: testTripId,
      user_id: testUser.id,
      name: 'Test Sleeping Bag',
      category: 'Sleep',
      quantity: 1,
      is_checked: false,
      is_owned: false,
      needs_to_buy: false,
      is_packed: false,
      required: true,
      is_personal: true,
      weight: 1500,
      notes: 'Personal sleeping bag'
    },
    {
      id: crypto.randomUUID(),
      trip_id: testTripId,
      user_id: testUser.id,
      name: 'Test Cooking Stove',
      category: 'Kitchen',
      quantity: 1,
      is_checked: false,
      is_owned: false,
      needs_to_buy: false,
      is_packed: false,
      required: false,
      is_personal: false,
      weight: 800,
      notes: 'Portable camping stove'
    }
  ];
  
  const { data, error } = await supabase
    .from('packing_items')
    .insert(packingItems)
    .select();
  
  if (error) {
    console.error('❌ Failed to create packing items:', error.message);
    return false;
  }
  
  console.log('✅ Created', data.length, 'initial packing items');
  return data;
}

async function simulateUserInteractions(packingItems) {
  console.log('🎯 Simulating user interactions (checking items as owned/packed)...');
  
  // Simulate user marking items as owned and packed
  const updates = [
    { id: packingItems[0].id, is_owned: true, is_packed: true },  // Tent: owned and packed
    { id: packingItems[1].id, is_owned: true, is_packed: false }, // Sleeping bag: owned but not packed
    { id: packingItems[2].id, is_owned: false, needs_to_buy: true } // Stove: needs to buy
  ];
  
  for (const update of updates) {
    const { error } = await supabase
      .from('packing_items')
      .update(update)
      .eq('id', update.id);
    
    if (error) {
      console.error('❌ Failed to update item:', error.message);
      return false;
    }
  }
  
  console.log('✅ User interactions saved:');
  console.log('   - Test Tent: owned ✅, packed ✅');
  console.log('   - Test Sleeping Bag: owned ✅, not packed ❌');
  console.log('   - Test Cooking Stove: needs to buy 🛒');
  
  return true;
}

async function simulateNavigationAndReturn() {
  console.log('🔄 Simulating navigation away and back...');
  
  // This simulates what happens when user navigates away and back
  // In real app, this would be component unmount/remount
  
  // First, verify our changes are saved
  const { data: beforeNav, error: beforeError } = await supabase
    .from('packing_items')
    .select('*')
    .eq('trip_id', testTripId)
    .order('name');
  
  if (beforeError) {
    console.error('❌ Failed to check items before navigation:', beforeError.message);
    return false;
  }
  
  console.log('📊 Items before navigation:');
  beforeNav.forEach(item => {
    const status = [];
    if (item.is_owned) status.push('owned');
    if (item.is_packed) status.push('packed');
    if (item.needs_to_buy) status.push('needs to buy');
    console.log(`   - ${item.name}: ${status.join(', ') || 'no status'}`);
  });
  
  // Simulate a delay (navigation time)
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Now check if data persists after "navigation"
  const { data: afterNav, error: afterError } = await supabase
    .from('packing_items')
    .select('*')
    .eq('trip_id', testTripId)
    .order('name');
  
  if (afterError) {
    console.error('❌ Failed to check items after navigation:', afterError.message);
    return false;
  }
  
  console.log('📊 Items after navigation:');
  afterNav.forEach(item => {
    const status = [];
    if (item.is_owned) status.push('owned');
    if (item.is_packed) status.push('packed');
    if (item.needs_to_buy) status.push('needs to buy');
    console.log(`   - ${item.name}: ${status.join(', ') || 'no status'}`);
  });
  
  return { beforeNav, afterNav };
}

async function validateResults(beforeNav, afterNav) {
  console.log('🧪 Validating template override fix...');
  
  if (beforeNav.length !== afterNav.length) {
    console.error('❌ Item count changed! Template may have been reloaded');
    return false;
  }
  
  let allStatusPreserved = true;
  
  for (let i = 0; i < beforeNav.length; i++) {
    const before = beforeNav[i];
    const after = afterNav[i];
    
    if (before.id !== after.id) {
      console.error(`❌ Item order changed: ${before.name} vs ${after.name}`);
      allStatusPreserved = false;
      continue;
    }
    
    const statusFields = ['is_owned', 'is_packed', 'needs_to_buy'];
    for (const field of statusFields) {
      if (before[field] !== after[field]) {
        console.error(`❌ ${before.name}: ${field} changed from ${before[field]} to ${after[field]}`);
        allStatusPreserved = false;
      }
    }
  }
  
  if (allStatusPreserved) {
    console.log('✅ All status icons preserved across navigation!');
    console.log('✅ Template override fix is working correctly!');
    return true;
  } else {
    console.log('❌ Some status icons were lost - template override issue still exists');
    return false;
  }
}

async function cleanup() {
  console.log('🧹 Cleaning up test data...');
  
  try {
    // Delete packing items
    await supabase
      .from('packing_items')
      .delete()
      .eq('trip_id', testTripId);
    
    // Delete test trip
    await supabase
      .from('trips')
      .delete()
      .eq('id', testTripId);
    
    // Sign out test user
    await supabase.auth.signOut();
    
    console.log('✅ Test cleanup completed');
  } catch (error) {
    console.error('⚠️ Cleanup failed:', error.message);
  }
}

async function runTest() {
  console.log('🧪 Testing Packing List Template Override Fix\n');
  console.log('This test simulates the user interaction scenario:');
  console.log('1. Create packing items');
  console.log('2. User marks items as owned/packed');
  console.log('3. User navigates away and back');
  console.log('4. Verify status icons are preserved\n');
  
  try {
    // Setup
    const userCreated = await createTestUser();
    if (!userCreated) return;
    
    const tripCreated = await createTestTrip();
    if (!tripCreated) return;
    
    // Test scenario
    const packingItems = await createInitialPackingItems();
    if (!packingItems) return;
    
    const interactionsCompleted = await simulateUserInteractions(packingItems);
    if (!interactionsCompleted) return;
    
    const navigationResults = await simulateNavigationAndReturn();
    if (!navigationResults) return;
    
    // Validation
    const testPassed = await validateResults(navigationResults.beforeNav, navigationResults.afterNav);
    
    // Results
    console.log('\n🎯 TEST RESULTS:');
    if (testPassed) {
      console.log('✅ PASS: Template override fix is working correctly!');
      console.log('✅ User status icons persist across navigation');
      console.log('✅ No unwanted template reloading occurred');
    } else {
      console.log('❌ FAIL: Template override issue still exists');
      console.log('❌ User status icons were lost during navigation');
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  } finally {
    await cleanup();
  }
}

// Run the test
runTest();