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
      <div className="w-full max-w-md sm:max-w-lg lg:max-w-xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Tent className="h-10 w-10 text-green-600" />
            <span className="font-bold text-3xl text-gray-900">PlanMyEscape</span>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-3">
            Welcome back
          </h1>
          <p className="text-lg text-gray-600">
            Sign in to access your trips and plans
          </p>
        </div>

        {/* Auth Form */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <Auth
            supabaseClient={supabase}
            appearance={{ 
              theme: ThemeSupa,
              style: {
                button: {
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  padding: '0.875rem 1.5rem',
                  fontWeight: '500',
                },
                input: {
                  borderRadius: '0.5rem',
                  fontSize: '1rem',
                  padding: '0.875rem 1rem',
                  border: '1px solid #d1d5db',
                },
                label: {
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#374151',
                  marginBottom: '0.5rem',
                },
                container: {
                  gap: '1.5rem',
                }
              }
            }}
            providers={[]}
            theme="default"
          />
        </div>

        {/* Continue without signing in */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-5 mb-6">
            <p className="text-base text-amber-800">
              <strong>Note:</strong> If you continue without signing in, your trip data will only be saved locally on this device and won't be accessible from other devices.
            </p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full px-6 py-4 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-lg"
          >
            Continue without signing in
          </button>
        </div>

        {/* Footer link */}
        <div className="text-center mt-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-green-600 hover:text-green-700 text-base font-medium"
          >
            ← Back to dashboard
          </button>
        </div>
      </div>
    </div>
  );
} 