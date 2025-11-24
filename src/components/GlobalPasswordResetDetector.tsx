import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * Global component that detects password reset tokens in the URL
 * regardless of which page the user lands on
 */
export const GlobalPasswordResetDetector = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const detectPasswordReset = async () => {
      // Parse URL for Firebase action parameters
      const searchParams = new URLSearchParams(window.location.search);
      const mode = searchParams.get('mode');
      const oobCode = searchParams.get('oobCode');
      const apiKey = searchParams.get('apiKey');

      // Check if this is a password recovery
      if (mode === 'resetPassword' && oobCode) {
        // Redirect to reset password page with the code
        // We use window.location.replace to ensure a clean URL transition if needed
        // but navigate is usually better for SPA
        navigate(`/reset-password?oobCode=${oobCode}`);
      }
    };

    // Run detection on component mount and location changes
    detectPasswordReset();
  }, [navigate, location]);

  // This component doesn't render anything
  return null;
};