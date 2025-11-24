import { serve } from 'https://deno.land/std@0.193.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

interface DeleteUserPayload {
  user_id?: string;
}

const REQUIRED_ENV_VARS = ['SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_URL'] as const;

type RequiredEnv = (typeof REQUIRED_ENV_VARS)[number];

const getEnv = (key: RequiredEnv): string => {
  const value = Deno.env.get(key);
  if (!value) {
    throw new Error(Missing required environment variable: );
  }
  return value;
};

const supabaseUrl = getEnv('SUPABASE_URL');
const serviceRoleKey = getEnv('SUPABASE_SERVICE_ROLE_KEY');

const adminClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const USER_TABLES = [
  'trips',
  'packing_items',
  'meals',
  'shopping_items',
  'gear_items',
  'todo_items',
  'security_logs',
];

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

serve(async (req) => {
  if (req.method !== 'POST') {
    return jsonResponse({ success: false, message: 'Method not allowed' }, 405);
  }

  try {
    const payload = (await req.json()) as DeleteUserPayload;
    const userId = payload.user_id;
    if (!userId) {
      return jsonResponse({ success: false, message: 'user_id is required' }, 400);
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return jsonResponse({ success: false, message: 'Missing Authorization header' }, 401);
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: userInfo, error: sessionError } = await adminClient.auth.getUser(token);
    if (sessionError || userInfo?.user?.id !== userId) {
      return jsonResponse({ success: false, message: 'Unauthorized' }, 403);
    }

    for (const table of USER_TABLES) {
      const { error } = await adminClient.from(table).delete().eq('user_id', userId);
      if (error) {
        console.error(Failed to delete from , error);
        throw error;
      }
    }

    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);
    if (deleteError) {
      console.error('Failed to delete auth user', deleteError);
      throw deleteError;
    }

    return jsonResponse({ success: true });
  } catch (error) {
    console.error('delete_user function failed', error);
    return jsonResponse({ success: false, message: 'Deletion failed' }, 500);
  }
});
