import { LogOut } from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function LogoutButton() {
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      window.location.href = '/';
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to log out:', error);
    }
  };

  return (
    <button
      onClick={handleLogout}
      className="inline-flex items-center px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/50 rounded-lg transition-colors"
    >
      <LogOut className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
      <span className="hidden sm:inline">Log out</span>
      <span className="sm:hidden text-xs">Logout</span>
    </button>
  );
} 