import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../supabaseClient';
import { useContext, useEffect } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { logSecurityEvent } from '../utils/securityLogger';
import { Tent } from 'lucide-react';

export default function SupaSignIn() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await logSecurityEvent({
          type: 'login',
          userId: session.user.id,
          userAgent: navigator.userAgent
        });
        navigate('/dashboard');
      }
    });
    return () => listener.subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Tent className="h-8 w-8 text-green-600" />
            <span className="font-bold text-2xl text-gray-900">PlanMyEscape</span>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Welcome back
          </h1>
          <p className="text-gray-600">
            Sign in to access your trips and plans
          </p>
        </div>

        {/* Auth Form */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <Auth
            supabaseClient={supabase}
            appearance={{ 
              theme: ThemeSupa,
              style: {
                button: {
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  padding: '0.75rem 1rem',
                },
                input: {
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  padding: '0.75rem',
                },
                container: {
                  gap: '1rem',
                }
              }
            }}
            providers={[]}
            theme="default"
          />
        </div>

        {/* Continue without signing in */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-amber-800">
              <strong>Note:</strong> If you continue without signing in, your trip data will only be saved locally on this device and won't be accessible from other devices.
            </p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full px-4 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Continue without signing in
          </button>
        </div>

        {/* Footer link */}
        <div className="text-center mt-6">
          <button
            onClick={() => navigate('/')}
            className="text-green-600 hover:text-green-700 text-sm font-medium"
          >
            ← Back to home
          </button>
        </div>
      </div>
    </div>
  );
} 