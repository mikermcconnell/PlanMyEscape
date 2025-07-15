import { useState } from 'react';
import DataExport from '../components/DataExport';
import { deleteUserAccount } from '../utils/accountDeletion';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';

const PrivacySettings = () => {
  const [analytics, setAnalytics] = useState<boolean>(() => {
    return localStorage.getItem('allow_analytics') !== 'false';
  });
  const [marketing, setMarketing] = useState<boolean>(() => {
    return localStorage.getItem('allow_marketing') === 'true';
  });
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();

  const handleAnalyticsChange = (value: boolean) => {
    setAnalytics(value);
    localStorage.setItem('allow_analytics', String(value));
    // Optionally trigger analytics opt-out API
  };

  const handleMarketingChange = (value: boolean) => {
    setMarketing(value);
    localStorage.setItem('allow_marketing', String(value));
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
      navigate('/signin');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Account deletion failed', error);
      alert('Could not delete account. Please try again later.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">User Settings</h2>

      <div className="space-y-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={analytics}
            onChange={(e) => handleAnalyticsChange(e.target.checked)}
          />
          Allow analytics to improve app performance
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={marketing}
            onChange={(e) => handleMarketingChange(e.target.checked)}
          />
          Receive email updates about new features
        </label>
      </div>

      <hr className="my-4" />

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Account Actions</h3>
        <DataExport />

        <button
          type="button"
          onClick={confirmAndDelete}
          disabled={deleting}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
        >
          <AlertTriangle className="h-4 w-4" />
          {deleting ? 'Deleting...' : 'Delete Account'}
        </button>
      </div>
    </div>
  );
};

export default PrivacySettings; 