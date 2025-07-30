import { useState, useContext } from 'react';
import { deleteUserAccount } from '../utils/accountDeletion';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, User, Shield, Bell, Eye, Key } from 'lucide-react';
import { AuthContext } from '../contexts/AuthContext';
import { supabase } from '../supabaseClient';

const PrivacySettings = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  // Settings state
  const [analytics, setAnalytics] = useState<boolean>(() => {
    return localStorage.getItem('allow_analytics') !== 'false';
  });
  const [marketing, setMarketing] = useState<boolean>(() => {
    return localStorage.getItem('allow_marketing') === 'true';
  });
  const [notifications, setNotifications] = useState<boolean>(() => {
    return localStorage.getItem('allow_notifications') === 'true';
  });
  const [dataSharing, setDataSharing] = useState<boolean>(() => {
    return localStorage.getItem('allow_data_sharing') === 'true';
  });
  
  // Action states
  const [deleting, setDeleting] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const handleAnalyticsChange = (value: boolean) => {
    setAnalytics(value);
    localStorage.setItem('allow_analytics', String(value));
    // Optionally trigger analytics opt-out API
  };

  const handleMarketingChange = (value: boolean) => {
    setMarketing(value);
    localStorage.setItem('allow_marketing', String(value));
  };

  const handleNotificationsChange = (value: boolean) => {
    setNotifications(value);
    localStorage.setItem('allow_notifications', String(value));
  };

  const handleDataSharingChange = (value: boolean) => {
    setDataSharing(value);
    localStorage.setItem('allow_data_sharing', String(value));
  };

  const handleChangePassword = async () => {
    if (!user) {
      alert('You must be signed in to change your password.');
      return;
    }

    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email!, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) {
        alert('Failed to send password reset email. Please try again.');
      } else {
        alert('Password reset email sent! Check your inbox.');
      }
    } catch (error) {
      console.error('Password reset error:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setChangingPassword(false);
    }
  };

  const confirmAndDelete = async () => {
    const confirmed = window.confirm(
      'This will permanently delete your account and all related data. This action cannot be undone. Continue?'
    );
    if (!confirmed) return;

    try {
      setDeleting(true);
      await deleteUserAccount();
      alert('Your account has been deleted. We are sad to see you go.');
      navigate('/');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Account deletion failed', error);
      alert('Could not delete account. Please try again later.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="border-b border-gray-200 pb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <User className="h-6 w-6 text-green-600" />
          Account Settings
        </h1>
        <p className="text-gray-600 mt-2">Manage your account preferences and privacy settings</p>
      </div>

      {/* Account Information */}
      {user && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <User className="h-5 w-5 text-gray-600" />
            Account Information
          </h2>
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Email:</span> {user.email}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Account created:</span> {new Date(user.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      )}

      {/* Privacy & Data Settings */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Shield className="h-5 w-5 text-gray-600" />
          Privacy & Data
        </h2>
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
            <Eye className="h-5 w-5 text-gray-500 mt-0.5" />
            <div className="flex-1">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <h3 className="font-medium text-gray-900">Analytics & Performance</h3>
                  <p className="text-sm text-gray-600">Help improve app performance by sharing anonymous usage data</p>
                </div>
                <input
                  type="checkbox"
                  checked={analytics}
                  onChange={(e) => handleAnalyticsChange(e.target.checked)}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
              </label>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
            <Shield className="h-5 w-5 text-gray-500 mt-0.5" />
            <div className="flex-1">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <h3 className="font-medium text-gray-900">Data Sharing</h3>
                  <p className="text-sm text-gray-600">Share anonymized trip data to help improve recommendations</p>
                </div>
                <input
                  type="checkbox"
                  checked={dataSharing}
                  onChange={(e) => handleDataSharingChange(e.target.checked)}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Communication Settings */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Bell className="h-5 w-5 text-gray-600" />
          Communication Preferences
        </h2>
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
            <Bell className="h-5 w-5 text-gray-500 mt-0.5" />
            <div className="flex-1">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <h3 className="font-medium text-gray-900">Email Updates</h3>
                  <p className="text-sm text-gray-600">Receive emails about new features and important updates</p>
                </div>
                <input
                  type="checkbox"
                  checked={marketing}
                  onChange={(e) => handleMarketingChange(e.target.checked)}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
              </label>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
            <Bell className="h-5 w-5 text-gray-500 mt-0.5" />
            <div className="flex-1">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <h3 className="font-medium text-gray-900">Push Notifications</h3>
                  <p className="text-sm text-gray-600">Get notified about trip reminders and shared trips</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifications}
                  onChange={(e) => handleNotificationsChange(e.target.checked)}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Security Settings */}
      {user && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Key className="h-5 w-5 text-gray-600" />
            Security
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900">Password</h3>
                <p className="text-sm text-gray-600">Change your account password</p>
              </div>
              <button
                onClick={handleChangePassword}
                disabled={changingPassword}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50 transition-colors"
              >
                {changingPassword ? 'Sending...' : 'Change Password'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Danger Zone */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-red-900 mb-4 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          Danger Zone
        </h2>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-red-900">Delete Account</h3>
            <p className="text-sm text-red-700">Permanently delete your account and all associated data. This action cannot be undone.</p>
          </div>
          <button
            onClick={confirmAndDelete}
            disabled={deleting}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            <AlertTriangle className="h-4 w-4" />
            {deleting ? 'Deleting...' : 'Delete Account'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrivacySettings; 