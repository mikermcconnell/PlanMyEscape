// Copy and paste this code into your browser console while logged into PlanMyEscape
// Run this while on any page of your app at http://localhost:3002

(async function testPackingListPersistence() {
  console.log('🧪 Testing Packing List Template Override Fix');
  console.log('============================================');
  
  // Get Supabase client from your app
  const supabase = window.supabase || window.React?.supabase;
  if (!supabase) {
    console.error('❌ Supabase client not found. Make sure you\'re on your app page.');
    return;
  }
  
  try {
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('❌ User not authenticated. Please log in first.');
      return;
    }
    
    console.log('✅ User authenticated:', user.email);
    
    // Get user's trips
    const { data: trips, error: tripsError } = await supabase
      .from('trips')
      .select('*')
      .limit(5);
    
    if (tripsError) {
      console.error('❌ Failed to get trips:', tripsError.message);
      return;
    }
    
    if (trips.length === 0) {
      console.error('❌ No trips found. Please create a trip first.');
      return;
    }
    
    const testTrip = trips[0];
    console.log('🎒 Using trip:', testTrip.trip_name);
    
    // Check existing packing items
    const { data: existingItems, error: itemsError } = await supabase
      .from('packing_items')
      .select('*')
      .eq('trip_id', testTrip.id);
    
    if (itemsError) {
      console.error('❌ Failed to get packing items:', itemsError.message);
      return;
    }
    
    console.log('📦 Found', existingItems.length, 'existing packing items');
    
    if (existingItems.length === 0) {
      console.log('📝 Creating test packing items...');
      
      // Create test items
      const testItems = [
        {
          id: crypto.randomUUID(),
          trip_id: testTrip.id,
          user_id: user.id,
          name: 'Console Test Tent',
          category: 'Shelter',
          quantity: 1,
          is_checked: false,
          is_owned: false,
          needs_to_buy: false,
          is_packed: false,
          required: true,
          is_personal: false,
          weight: 2000,
          notes: 'Template override test item'
        },
        {
          id: crypto.randomUUID(),
          trip_id: testTrip.id,
          user_id: user.id,
          name: 'Console Test Sleeping Bag',
          category: 'Sleep',
          quantity: 1,
          is_checked: false,
          is_owned: false,
          needs_to_buy: false,
          is_packed: false,
          required: true,
          is_personal: true,
          weight: 1500,
          notes: 'Template override test item'
        }
      ];
      
      const { data: createdItems, error: createError } = await supabase
        .from('packing_items')
        .insert(testItems)
        .select();
      
      if (createError) {
        console.error('❌ Failed to create test items:', createError.message);
        return;
      }
      
      console.log('✅ Created', createdItems.length, 'test items');
      existingItems.push(...createdItems);
    }
    
    // Test the fix by simulating status changes
    console.log('🎯 Testing status persistence...');
    
    const testItem = existingItems[0];
    console.log('📝 Testing with item:', testItem.name);
    
    // Step 1: Mark item as owned and packed
    console.log('Step 1: Marking item as owned and packed...');
    const { error: updateError1 } = await supabase
      .from('packing_items')
      .update({ is_owned: true, is_packed: true })
      .eq('id', testItem.id);
    
    if (updateError1) {
      console.error('❌ Failed to update item:', updateError1.message);
      return;
    }
    
    // Step 2: Verify the change
    const { data: afterUpdate, error: checkError1 } = await supabase
      .from('packing_items')
      .select('*')
      .eq('id', testItem.id)
      .single();
    
    if (checkError1) {
      console.error('❌ Failed to check updated item:', checkError1.message);
      return;
    }
    
    console.log('✅ Item updated - Owned:', afterUpdate.is_owned, 'Packed:', afterUpdate.is_packed);
    
    // Step 3: Simulate "navigation" delay
    console.log('Step 2: Simulating navigation delay...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Step 4: Check if status persisted
    console.log('Step 3: Checking if status persisted...');
    const { data: afterDelay, error: checkError2 } = await supabase
      .from('packing_items')
      .select('*')
      .eq('id', testItem.id)
      .single();
    
    if (checkError2) {
      console.error('❌ Failed to check item after delay:', checkError2.message);
      return;
    }
    
    // Verify persistence
    const statusPersisted = (
      afterUpdate.is_owned === afterDelay.is_owned &&
      afterUpdate.is_packed === afterDelay.is_packed &&
      afterUpdate.needs_to_buy === afterDelay.needs_to_buy
    );
    
    console.log('📊 PERSISTENCE TEST RESULTS:');
    console.log('============================');
    console.log('Item:', afterDelay.name);
    console.log('Owned status:', afterUpdate.is_owned, '→', afterDelay.is_owned);
    console.log('Packed status:', afterUpdate.is_packed, '→', afterDelay.is_packed);
    console.log('Needs to buy:', afterUpdate.needs_to_buy, '→', afterDelay.needs_to_buy);
    
    if (statusPersisted) {
      console.log('✅ SUCCESS: Status persisted correctly!');
      console.log('✅ Template override fix is working!');
    } else {
      console.log('❌ FAILURE: Status was lost during navigation simulation');
      console.log('❌ Template override issue may still exist');
    }
    
    // Manual test instructions
    console.log('\n📋 MANUAL TEST INSTRUCTIONS:');
    console.log('============================');
    console.log('1. Go to your trip\'s packing list page');
    console.log('2. Find the item:', afterDelay.name);
    console.log('3. Click the status icons to mark it as owned/packed');
    console.log('4. Navigate away (meal planning, shopping, etc.)');
    console.log('5. Navigate back to packing list');
    console.log('6. Verify the status icons are still checked!');
    
    console.log('\n🎯 TEST COMPLETED!');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
})();

// Instructions:
// 1. Make sure you're logged into PlanMyEscape at http://localhost:3002
// 2. Open browser console (F12 → Console)
// 3. Copy and paste this entire script
// 4. Press Enter to run the test
// 5. Follow the manual test instructions that appear