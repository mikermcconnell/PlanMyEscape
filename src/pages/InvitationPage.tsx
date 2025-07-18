import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tripSharingService } from '../services/tripSharingService';
import { useAuth } from '../contexts/AuthContext';

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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h1 className="text-2xl font-bold text-center mb-4">Trip Invitation</h1>
          <p className="text-gray-600 text-center mb-6">
            You need to sign in to view this invitation.
          </p>
          <div className="text-center">
            <button
              onClick={() => navigate(`/signin?invitation=${token}`)}
              className="px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-4">Trip Invitation</h1>
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <p className="text-gray-600 text-center mb-6">
          You have been invited to collaborate on a trip. Would you like to accept this invitation?
        </p>

        <div className="flex space-x-4">
          <button
            onClick={handleAccept}
            disabled={loading}
            className="flex-1 px-4 py-3 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Accept Invitation'}
          </button>
          <button
            onClick={handleDecline}
            disabled={loading}
            className="flex-1 px-4 py-3 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Decline'}
          </button>
        </div>

        <div className="mt-4 text-center">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-gray-500 hover:text-gray-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};