import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

/**
 * useAuthGuard – Hook to programmatically redirect unauthenticated users to /signin
 * Can be used inside any component (including non-route components) that requires auth.
 *
 * Note: For route-level protection we already use the `ProtectedRoute` wrapper.
 * This hook is provided as an additional safeguard for use cases where wrapping
 * in a route component isn't practical (e.g., deep inside a modal or utility
 * function component).
 */
export const useAuthGuard = (): void => {
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (isMounted && !session) {
        navigate('/signin');
      }
    };

    // Initial check
    checkAuth();

    // Subscribe to auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_OUT' || !session) && isMounted) {
        navigate('/signin');
      }
    });

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, [navigate]);
}; 