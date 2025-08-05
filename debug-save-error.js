// Debug the 400 error when saving packing items
// Run this in browser console while logged into your app

(async function debugSaveError() {
  console.log('🔍 Debugging Packing Item Save Error');
  console.log('=====================================');
  
  const supabase = window.supabase;
  if (!supabase) {
    console.error('❌ Supabase client not found');
    return;
  }
  
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('❌ User not authenticated:', userError?.message);
      return;
    }
    
    console.log('✅ User authenticated:', user.email);
    
    // Get a trip
    const { data: trips, error: tripsError } = await supabase
      .from('trips')
      .select('*')
      .limit(1);
    
    if (tripsError || !trips?.length) {
      console.error('❌ No trips found:', tripsError?.message);
      return;
    }
    
    const trip = trips[0];
    console.log('✅ Using trip:', trip.trip_name);
    
    // Test creating a simple packing item
    const testItem = {
      id: crypto.randomUUID(),
      trip_id: trip.id,
      user_id: user.id,
      name: 'Debug Test Item',
      category: 'Other',
      quantity: 1,
      is_checked: false,
      weight: null,
      is_owned: false,
      needs_to_buy: false,
      is_packed: false,
      required: false,
      assigned_group_id: null,
      is_personal: false,
      packed_by_user_id: null,
      last_modified_by: user.id,
      last_modified_at: new Date().toISOString(),
      notes: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log('🧪 Testing direct insert of packing item:', testItem);
    
    // Try direct insert first
    const { data: insertData, error: insertError } = await supabase
      .from('packing_items')
      .insert([testItem])
      .select();
    
    if (insertError) {
      console.error('❌ Direct insert failed:', insertError);
      console.error('❌ Error details:', insertError.message, insertError.details, insertError.hint);
      console.error('❌ Error code:', insertError.code);
      
      // Check if it's a foreign key constraint issue
      if (insertError.message.includes('foreign key') || insertError.message.includes('violates')) {
        console.log('🔍 Checking foreign key constraints...');
        
        // Check if trip exists
        const { data: tripCheck } = await supabase
          .from('trips')
          .select('id')
          .eq('id', trip.id);
        console.log('Trip exists check:', tripCheck?.length > 0);
        
        // Check if user exists in auth.users
        console.log('User ID being used:', user.id);
      }
    } else {
      console.log('✅ Direct insert successful:', insertData);
      
      // Clean up test item
      await supabase
        .from('packing_items')
        .delete()
        .eq('id', testItem.id);
      console.log('🧹 Cleaned up test item');
    }
    
    // Now test upsert
    console.log('\n🧪 Testing upsert operation...');
    const { data: upsertData, error: upsertError } = await supabase
      .from('packing_items')
      .upsert([testItem], {
        onConflict: 'id',
        ignoreDuplicates: false
      })
      .select();
    
    if (upsertError) {
      console.error('❌ Upsert failed:', upsertError);
      console.error('❌ Error details:', upsertError.message, upsertError.details, upsertError.hint);
    } else {
      console.log('✅ Upsert successful:', upsertData);
      
      // Clean up
      await supabase
        .from('packing_items')
        .delete()
        .eq('id', testItem.id);
      console.log('🧹 Cleaned up upsert test item');
    }
    
  } catch (error) {
    console.error('❌ Debug test failed:', error.message);
  }
})();

console.log('Copy and paste this script in your browser console while logged into PlanMyEscape');