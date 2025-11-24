import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { auth } from '../firebaseConfig';
import { verifyPasswordResetCode, confirmPasswordReset } from 'firebase/auth';
import { Tent, Loader2 } from 'lucide-react';
import { logSecurityEvent } from '../utils/securityLogger';

export default function PasswordReset() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [email, setEmail] = useState<string | null>(null);

  const oobCode = searchParams.get('oobCode');

  useEffect(() => {
    const verifyCode = async () => {
      if (!oobCode) {
        setError('Invalid password reset link. Please request a new one.');
        setLoading(false);
        return;
      }

      try {
        const email = await verifyPasswordResetCode(auth, oobCode);
        setEmail(email);
        setLoading(false);
      } catch (err: any) {
        console.error('Invalid code:', err);
        setError('Invalid or expired password reset link. Please request a new one.');
        setLoading(false);
      }
    };

    verifyCode();
  }, [oobCode]);

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

    if (!oobCode) return;

    setIsUpdating(true);
    setError(null);

    try {
      await confirmPasswordReset(auth, oobCode, newPassword);

      // Log successful password update
      // Note: We might not have the user ID here if not signed in, 
      // but we know the email from verifyPasswordResetCode
      await logSecurityEvent({
        type: 'password_updated',
        details: { email },
        userAgent: navigator.userAgent
      });

      // Success - redirect to sign in
      alert('Password updated successfully! Please sign in with your new password.');
      navigate('/signin');
    } catch (err: any) {
      console.error('Password update error:', err);
      setError(err.message);
      setIsUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full text-center">
          <Tent className="h-8 w-8 text-green-600 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Verifying Link</h1>
          <div className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-green-600" />
          </div>
          <p className="text-gray-600 mt-2">Please wait while we verify your password reset link...</p>
        </div>
      </div>
    );
  }

  if (error) {
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
          <p className="text-gray-600">Enter your new password for {email}</p>
        </div>

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
            className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
          >
            {isUpdating && <Loader2 className="h-4 w-4 animate-spin" />}
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
