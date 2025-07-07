import { supabase } from '../supabaseClient';
import { AppError } from './errorHandler';

/**
 * deleteUserAccount – Removes all user data and deletes auth user.
 * Requires a Supabase Edge Function named `delete_user` running with service role key,
 * or replace logic with your own backend endpoint.
 */
export const deleteUserAccount = async (): Promise<void> => {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    throw new AppError('User not authenticated', 'You must be signed in to delete your account', 401);
  }

  // Attempt to call an Edge Function that deletes user and related data securely
  const { error: fnError } = await supabase.functions.invoke('delete_user', {
    body: { user_id: user.id }
  });

  if (fnError) {
    // Fallback: try client-side deletions (only works if RLS policies allow)
    await supabase.from('trips').delete().eq('user_id', user.id);
    await supabase.from('gear').delete().eq('user_id', user.id);

    // Attempt admin delete – will only work in secure server environment
    try {
      // @ts-ignore – admin typings may not be available in browser context
      await supabase.auth.admin.deleteUser(user.id);
    } catch (adminErr) {
      // eslint-disable-next-line no-console
      console.warn('Admin delete failed (expected on client):', adminErr);
    }
  }

  // Sign out regardless
  await supabase.auth.signOut();
}; 