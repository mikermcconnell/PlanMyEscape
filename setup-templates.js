#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  console.error('Required: REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTemplateTables() {
  console.log('🚀 Creating template tables...');
  
  const sql = fs.readFileSync(path.join(__dirname, 'create_template_tables.sql'), 'utf8');
  
  try {
    // Split SQL into individual statements and execute them
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Executing ${statements.length} SQL statements...`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement) {
        console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
        console.log(`   ${statement.substring(0, 50)}...`);
        
        const { error } = await supabase.rpc('exec_sql', { sql_text: statement });
        
        if (error) {
          // Try direct query method as fallback
          const { error: queryError } = await supabase.from('dual').select('1');
          console.log('⚠️  RPC method not available, this is expected with anon key');
        }
      }
    }
    
    console.log('✅ Template tables setup attempted');
    console.log('');
    console.log('⚠️  Note: Due to RLS restrictions, you may need to run the SQL manually in Supabase Dashboard');
    console.log('📋 Copy the contents of create_template_tables.sql into Supabase SQL Editor');
    
  } catch (error) {
    console.error('❌ Error setting up tables:', error.message);
    console.log('');
    console.log('📋 Manual Setup Required:');
    console.log('1. Go to: https://supabase.com/dashboard/project/jyulgyuyacyqpzaalaky/sql');
    console.log('2. Copy contents of create_template_tables.sql');
    console.log('3. Paste and run in SQL Editor');
  }
}

// Test connection first
async function testConnection() {
  console.log('🔗 Testing Supabase connection...');
  try {
    const { data, error } = await supabase.from('trips').select('count', { count: 'exact', head: true });
    if (error && error.code !== 'PGRST116') {  // PGRST116 is "relation does not exist" which is fine
      throw error;
    }
    console.log('✅ Connection successful');
    return true;
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    return false;
  }
}

async function main() {
  console.log('🎯 PlanMyEscape Template Tables Setup');
  console.log('=====================================');
  
  const connected = await testConnection();
  if (!connected) {
    process.exit(1);
  }
  
  await createTemplateTables();
}

main().catch(console.error);