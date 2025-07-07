import { LogOut } from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function LogoutButton() {
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      window.location.href = '/signin';
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to log out:', error);
    }
  };

  return (
    <button
      onClick={handleLogout}
      className="inline-flex items-center px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50 rounded-lg transition-colors"
    >
      <LogOut className="h-5 w-5 mr-2" /> Log out
    </button>
  );
} 