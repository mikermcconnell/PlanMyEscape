import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../supabaseClient';
import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { logSecurityEvent } from '../utils/securityLogger';
import { Tent } from 'lucide-react';

export default function SupaSignIn() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  const [showManualRecovery, setShowManualRecovery] = useState(false);
  
  // Check for invitation token in URL params
  const urlParams = new URLSearchParams(window.location.search);
  const invitationToken = urlParams.get('invitation');

  // Check for password recovery tokens in URL fragments
  useEffect(() => {
    const handlePasswordRecovery = async () => {
      // Debug: Log current URL structure
      console.log('Current URL:', window.location.href);
      console.log('Hash:', window.location.hash);
      console.log('Search params:', window.location.search);
      
      // Check URL hash for password recovery tokens
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      const type = hashParams.get('type');
      
      // Debug: Log what we found
      console.log('Hash params:', {
        accessToken: accessToken ? 'present' : 'missing',
        refreshToken: refreshToken ? 'present' : 'missing',
        type,
        allParams: Object.fromEntries(hashParams.entries())
      });

      // Also check search params in case tokens are there instead
      const searchParams = new URLSearchParams(window.location.search);
      const searchAccessToken = searchParams.get('access_token');
      const searchRefreshToken = searchParams.get('refresh_token');
      const searchType = searchParams.get('type');
      
      console.log('Search params:', {
        accessToken: searchAccessToken ? 'present' : 'missing',
        refreshToken: searchRefreshToken ? 'present' : 'missing',
        type: searchType,
        allParams: Object.fromEntries(searchParams.entries())
      });

      // Try hash params first, then search params
      const finalAccessToken = accessToken || searchAccessToken;
      const finalRefreshToken = refreshToken || searchRefreshToken;
      const finalType = type || searchType;

      if (finalType === 'recovery' && finalAccessToken && finalRefreshToken) {
        console.log('Password recovery detected, setting up session...');
        setIsPasswordRecovery(true);
        try {
          // Set the session with the tokens from the URL
          const { data, error } = await supabase.auth.setSession({
            access_token: finalAccessToken,
            refresh_token: finalRefreshToken
          });

          if (error) {
            console.error('Error setting session from recovery:', error);
            return;
          }

          if (data.user) {
            console.log('Session set successfully for user:', data.user.id);
            await logSecurityEvent({
              type: 'password_reset',
              userId: data.user.id,
              userAgent: navigator.userAgent
            });
            
            // Clear the hash/search params to prevent issues
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        } catch (error) {
          console.error('Password recovery error:', error);
        }
      } else {
        console.log('No password recovery tokens found or incomplete set');
      }
    };

    handlePasswordRecovery();
  }, []);

  // Check if user is already authenticated and in recovery mode
  useEffect(() => {
    const checkAuthState = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // Check if this is a recovery session by looking at user metadata or other indicators
        const userMetadata = session.user.user_metadata;
        const lastSignInAt = session.user.last_sign_in_at;
        
        console.log('Current session:', {
          userId: session.user.id,
          lastSignInAt,
          userMetadata,
          recoveryMode: isPasswordRecovery
        });
        
        // If we have a user but haven't navigated away yet, check if this might be recovery
        if (!isPasswordRecovery) {
          // Look for recovery indicators in URL or session
          const hasRecoveryTokens = window.location.hash.includes('type=recovery') || 
                                   window.location.search.includes('type=recovery');
          if (hasRecoveryTokens) {
            console.log('Recovery tokens detected in URL, setting recovery mode');
            setIsPasswordRecovery(true);
            return; // Don't navigate to dashboard yet
          }
        }
      }
    };
    
    checkAuthState();
  }, [isPasswordRecovery]);

  useEffect(() => {
    if (user && !isPasswordRecovery) {
      // If there's an invitation token, redirect back to the invitation page
      if (invitationToken) {
        navigate(`/invite/${invitationToken}`);
      } else {
        navigate('/dashboard');
      }
    }
  }, [user, navigate, isPasswordRecovery, invitationToken]);

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await logSecurityEvent({
          type: 'login',
          userId: session.user.id,
          userAgent: navigator.userAgent
        });
        // If there's an invitation token, redirect back to the invitation page
        if (invitationToken) {
          navigate(`/invite/${invitationToken}`);
        } else {
          navigate('/dashboard');
        }
      } else if (event === 'PASSWORD_RECOVERY' && session?.user) {
        setIsPasswordRecovery(true);
        await logSecurityEvent({
          type: 'password_reset_initiated',
          userId: session.user.id,
          userAgent: navigator.userAgent
        });
      } else if (event === 'USER_UPDATED' && session?.user) {
        await logSecurityEvent({
          type: 'password_updated',
          userId: session.user.id,
          userAgent: navigator.userAgent
        });
        // Reset the recovery mode and navigate to dashboard
        setIsPasswordRecovery(false);
        navigate('/dashboard');
      }
    });
    return () => listener.subscription.unsubscribe();
  }, [navigate, invitationToken]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-2 sm:p-4">
      <div className="w-full max-w-sm sm:max-w-md">
        {/* Compact Header */}
        <div className="text-center mb-4 sm:mb-6">
          <div className="flex items-center justify-center gap-2 mb-3 sm:mb-4">
            <Tent className="h-8 w-8 sm:h-10 sm:w-10 text-green-600" />
            <span className="font-bold text-xl sm:text-2xl text-gray-900">PlanMyEscape</span>
          </div>
          <h1 className="text-lg sm:text-xl font-semibold text-gray-900 mb-1 sm:mb-2">
            {(isPasswordRecovery || showManualRecovery) ? 'Reset your password' : 'Welcome back'}
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            {(isPasswordRecovery || showManualRecovery) ? 'Enter your new password below' : 'Sign in to access your trips'}
          </p>
        </div>

        {/* Compact Auth Form */}
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 mb-3 sm:mb-4">
          {(isPasswordRecovery || showManualRecovery) && user ? (
            // Show password update form if we have a user and are in recovery mode
            <Auth
              supabaseClient={supabase}
              view="update_password"
              appearance={{ 
                theme: ThemeSupa,
                style: {
                  button: {
                    borderRadius: '0.5rem',
                    fontSize: '0.9rem',
                    padding: '0.75rem 1.25rem',
                    fontWeight: '500',
                    marginBottom: '0.5rem',
                  },
                  input: {
                    borderRadius: '0.5rem',
                    fontSize: '0.9rem',
                    padding: '0.75rem 0.875rem',
                    border: '1px solid #d1d5db',
                    marginBottom: '0.75rem',
                  },
                  label: {
                    fontSize: '0.8rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.25rem',
                  },
                  container: {
                    gap: '1rem',
                  },
                  message: {
                    fontSize: '0.8rem',
                    padding: '0.5rem',
                    marginBottom: '0.75rem',
                  }
                }
              }}
              theme="default"
            />
          ) : (
            // Show regular sign in form
            <Auth
              supabaseClient={supabase}
              view="sign_in"
              appearance={{ 
                theme: ThemeSupa,
                style: {
                  button: {
                    borderRadius: '0.5rem',
                    fontSize: '0.9rem',
                    padding: '0.75rem 1.25rem',
                    fontWeight: '500',
                    marginBottom: '0.5rem',
                  },
                  input: {
                    borderRadius: '0.5rem',
                    fontSize: '0.9rem',
                    padding: '0.75rem 0.875rem',
                    border: '1px solid #d1d5db',
                    marginBottom: '0.75rem',
                  },
                  label: {
                    fontSize: '0.8rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.25rem',
                  },
                  container: {
                    gap: '1rem',
                  },
                  anchor: {
                    fontSize: '0.8rem',
                    marginTop: '0.5rem',
                  },
                  divider: {
                    margin: '0.75rem 0',
                  },
                  message: {
                    fontSize: '0.8rem',
                    padding: '0.5rem',
                    marginBottom: '0.75rem',
                  }
                }
              }}
              providers={[]}
              theme="default"
            />
          )}
          
          {/* Manual recovery toggle for debugging */}
          {user && !isPasswordRecovery && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowManualRecovery(true);
                  setIsPasswordRecovery(true);
                }}
                className="w-full px-3 py-2 text-sm text-blue-600 hover:text-blue-700 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
              >
                Change Password
              </button>
            </div>
          )}
        </div>

        {/* Compact Continue without signing in - hide during password recovery */}
        {!(isPasswordRecovery || showManualRecovery) && (
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-5 mb-3 sm:mb-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4">
              <p className="text-xs sm:text-sm text-amber-800">
                <strong>Note:</strong> Without signing in, data stays on this device only.
              </p>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full px-4 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm sm:text-base"
            >
              Continue without signing in
            </button>
          </div>
        )}

        {/* Compact Footer link */}
        <div className="text-center">
          <button
            onClick={() => {
              // Force navigation to home page
              window.location.href = '/';
            }}
            className="text-green-600 hover:text-green-700 text-sm font-medium"
          >
            ← Back to home
          </button>
        </div>
      </div>
    </div>
  );
} 