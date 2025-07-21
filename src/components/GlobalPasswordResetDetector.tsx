import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { logSecurityEvent } from '../utils/securityLogger';

/**
 * Global component that detects password reset tokens in the URL
 * regardless of which page the user lands on
 */
export const GlobalPasswordResetDetector = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const detectPasswordReset = async () => {
      // Parse URL for recovery tokens - check both hash and search params
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const searchParams = new URLSearchParams(window.location.search);
      
      // Check for various parameter names that Supabase might use
      const accessToken = hashParams.get('access_token') || searchParams.get('access_token') ||
                         hashParams.get('token') || searchParams.get('token');
      const refreshToken = hashParams.get('refresh_token') || searchParams.get('refresh_token');
      const type = hashParams.get('type') || searchParams.get('type');
      const errorParam = hashParams.get('error') || searchParams.get('error');
      const errorDescription = hashParams.get('error_description') || searchParams.get('error_description');
      
      // Also check for other auth parameters
      const resetToken = hashParams.get('reset_token') || searchParams.get('reset_token');
      const recoveryToken = hashParams.get('recovery_token') || searchParams.get('recovery_token');


      // Handle Supabase errors
      if (errorParam) {
        navigate('/signin?error=' + encodeURIComponent(errorDescription || errorParam));
        return;
      }

      // Check if this is a password recovery - try multiple detection methods
      const isPasswordRecovery = (
        // Standard Supabase recovery
        (type === 'recovery' && accessToken && refreshToken) ||
        // Alternative token patterns
        (resetToken || recoveryToken) ||
        // Any auth tokens that might indicate recovery
        (accessToken && (type === 'recovery' || type === 'reset' || type === 'password_reset'))
      );

      if (isPasswordRecovery) {
        
        try {
          let sessionResult = null;

          // Try to set session with the tokens we have
          if (accessToken && refreshToken) {
            sessionResult = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            });
          } else if (accessToken) {
            // Just try to get user with the access token
            sessionResult = await supabase.auth.getUser(accessToken);
          }

          if (sessionResult?.error) {
            navigate('/signin?error=' + encodeURIComponent('Invalid or expired reset link'));
            return;
          }

          if (sessionResult?.data?.user) {
            // Log the security event
            await logSecurityEvent({
              type: 'password_reset_initiated',
              userId: sessionResult.data.user.id,
              userAgent: navigator.userAgent
            });

            // Clean the URL and redirect to password reset page
            window.location.replace(window.location.origin + '/reset-password');
          } else {
            // Still redirect to reset page, let it handle the tokens
            const cleanUrl = window.location.origin + '/reset-password' + window.location.hash + window.location.search;
            window.location.replace(cleanUrl);
          }
        } catch (error) {
          navigate('/signin?error=' + encodeURIComponent('Failed to process reset link'));
        }
      }
    };

    // Run detection on component mount and location changes
    detectPasswordReset();
  }, [navigate, location]);

  // This component doesn't render anything
  return null;
};