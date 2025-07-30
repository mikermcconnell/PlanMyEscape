import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Tent } from 'lucide-react';
import { logSecurityEvent } from '../utils/securityLogger';

export default function PasswordReset() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    const handlePasswordReset = async () => {
      try {
        // First check if we already have a session (user might have been redirected here)
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          console.log('Password reset page: Session already exists for user:', session.user.id);
          setSessionReady(true);
          setLoading(false);
          return;
        }

        // Parse URL fragments for tokens
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const searchParams = new URLSearchParams(window.location.search);
        
        const accessToken = hashParams.get('access_token') || searchParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token') || searchParams.get('refresh_token');
        const type = hashParams.get('type') || searchParams.get('type');

        console.log('Password reset page loaded with:', {
          type,
          hasAccessToken: !!accessToken,
          hasRefreshToken: !!refreshToken,
          fullHash: window.location.hash,
          search: window.location.search
        });

        if (type === 'recovery' && accessToken && refreshToken) {
          // Set the session using the tokens
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });

          if (sessionError) {
            console.error('Session error:', sessionError);
            setError('Invalid or expired reset link. Please request a new password reset.');
            setLoading(false);
            return;
          }

          // Clear the URL hash/search params
          window.history.replaceState({}, document.title, window.location.pathname);
          setSessionReady(true);
          setLoading(false);

          // Log the security event
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await logSecurityEvent({
              type: 'password_reset_initiated',
              userId: user.id,
              userAgent: navigator.userAgent
            });
          }
        } else if (!session?.user) {
          setError('Invalid reset link. Please check your email and try clicking the link again.');
          setLoading(false);
        }
      } catch (err) {
        console.error('Password reset error:', err);
        setError('An error occurred. Please try again.');
        setLoading(false);
      }
    };

    handlePasswordReset();
  }, []);

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setIsUpdating(true);
    setError(null);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) {
        setError(updateError.message);
        setIsUpdating(false);
        return;
      }

      // Log successful password update
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await logSecurityEvent({
          type: 'password_updated',
          userId: user.id,
          userAgent: navigator.userAgent
        });
      }

      // Success - redirect to dashboard
      alert('Password updated successfully!');
      navigate('/dashboard');
    } catch (err) {
      console.error('Password update error:', err);
      setError('Failed to update password. Please try again.');
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full text-center">
          <Tent className="h-8 w-8 text-green-600 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Processing Reset Link</h1>
          <p className="text-gray-600">Please wait while we verify your password reset link...</p>
        </div>
      </div>
    );
  }

  if (error && !sessionReady) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
          <div className="text-center mb-6">
            <Tent className="h-8 w-8 text-green-600 mx-auto mb-4" />
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Reset Link Error</h1>
          </div>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800 text-sm">{error}</p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => navigate('/signin')}
              className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Back to Sign In
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full px-4 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
        <div className="text-center mb-6">
          <Tent className="h-8 w-8 text-green-600 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Reset Your Password</h1>
          <p className="text-gray-600">Enter your new password below</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handlePasswordUpdate} className="space-y-4">
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <input
              type="password"
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
              placeholder="Enter new password"
              required
              minLength={6}
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500"
              placeholder="Confirm new password"
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={isUpdating || !newPassword || !confirmPassword}
            className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isUpdating ? 'Updating Password...' : 'Update Password'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/signin')}
            className="text-green-600 hover:text-green-700 text-sm font-medium"
          >
            ← Back to Sign In
          </button>
        </div>
      </div>
    </div>
  );
}