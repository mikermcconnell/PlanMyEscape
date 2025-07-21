import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tripSharingService } from '../services/tripSharingService';
import { useAuth } from '../contexts/AuthContext';
import { Tent } from 'lucide-react';

export const InvitationPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      // Redirect to sign in with invitation token in URL
      navigate(`/signin?invitation=${token}`);
    }
  }, [user, token, navigate]);

  const handleAccept = async () => {
    if (!token) {
      setError('Invalid invitation link');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await tripSharingService.acceptInvitation(token);
      navigate('/dashboard');
    } catch (error) {
      console.error('Error accepting invitation:', error);
      setError(error instanceof Error ? error.message : 'Failed to accept invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = async () => {
    if (!token) {
      setError('Invalid invitation link');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await tripSharingService.declineInvitation(token);
      navigate('/dashboard');
    } catch (error) {
      console.error('Error declining invitation:', error);
      setError(error instanceof Error ? error.message : 'Failed to decline invitation');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-2 sm:p-4">
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 max-w-sm sm:max-w-md w-full">
          {/* Header */}
          <div className="text-center mb-4 sm:mb-6">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Tent className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
              <span className="font-bold text-lg sm:text-xl text-gray-900">PlanMyEscape</span>
            </div>
            <h1 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Trip Invitation</h1>
            <p className="text-sm sm:text-base text-gray-600">
              You need to sign in to view this invitation.
            </p>
          </div>
          <div className="text-center">
            <button
              onClick={() => navigate(`/signin?invitation=${token}`)}
              className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm sm:text-base"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 max-w-sm sm:max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-4 sm:mb-6">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Tent className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
            <span className="font-bold text-lg sm:text-xl text-gray-900">PlanMyEscape</span>
          </div>
          <h1 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Trip Invitation</h1>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <p className="text-gray-600 text-center mb-4 sm:mb-6 text-sm sm:text-base">
          You have been invited to collaborate on a trip. Would you like to accept this invitation?
        </p>

        <div className="space-y-3 mb-4">
          <button
            onClick={handleAccept}
            disabled={loading}
            className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors font-medium text-sm sm:text-base"
          >
            {loading ? 'Processing...' : 'Accept Invitation'}
          </button>
          <button
            onClick={handleDecline}
            disabled={loading}
            className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors font-medium text-sm sm:text-base"
          >
            {loading ? 'Processing...' : 'Decline'}
          </button>
        </div>

        <div className="text-center">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-green-600 hover:text-green-700 text-sm font-medium"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};