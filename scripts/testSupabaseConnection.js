const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const anonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const log = (msg, ...rest) => console.log(`=> ${msg}`, ...rest);
const fail = (msg) => {
  console.error(`✖ ${msg}`);
  process.exitCode = 1;
};

if (!supabaseUrl || !anonKey) {
  throw new Error('Supabase URL/anon key missing from environment. Check .env.local');
}

const anonClient = createClient(supabaseUrl, anonKey, {
  auth: { persistSession: false },
});

async function verifyAnonAccess() {
  log('Verifying anon read access...');
  const { error } = await anonClient
    .from('trips')
    .select('id', { count: 'exact', head: true })
    .limit(1);
  if (error) {
    fail(`Anon connection failed: ${error.message}`);
    throw error;
  }
  log('Anon connection successful.');
}

async function verifyServiceInsert() {
  if (!serviceRoleKey) {
    log('Service role key not provided; skipping write test.');
    return;
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  log('Testing write access with service role key...');
  const { data, error } = await adminClient
    .from('security_logs')
    .insert({
      event_type: 'integration_test',
      ip_address: '127.0.0.1',
      user_agent: 'supabase-connection-test',
      details: { note: 'temporary connectivity verification', runAt: new Date().toISOString() },
    })
    .select('id')
    .single();

  if (error) {
    fail(`Service insert failed: ${error.message}`);
    throw error;
  }

  log('Insert succeeded, removing test record...');
  const { error: deleteError } = await adminClient
    .from('security_logs')
    .delete()
    .eq('id', data.id);

  if (deleteError) {
    fail(`Cleanup failed: ${deleteError.message}`);
    throw deleteError;
  }
  log('Cleanup completed.');
}

(async () => {
  try {
    await verifyAnonAccess();
    await verifyServiceInsert();
    log('Supabase connectivity checks finished.');
  } catch (err) {
    if (!process.exitCode) {
      process.exitCode = 1;
    }
  }
})();
