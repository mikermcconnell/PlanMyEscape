import React, { useState, useEffect, useContext } from 'react';
import { tripSharingService, TripInvitation } from '../services/tripSharingService';
import { AuthContext } from '../contexts/AuthContext';

export const PendingInvitations: React.FC = () => {
  const { user } = useContext(AuthContext);
  const [invitations, setInvitations] = useState<TripInvitation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadPendingInvitations();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadPendingInvitations = async () => {
    try {
      setLoading(true);
      const data = await tripSharingService.getMyPendingInvitations();
      setInvitations(data);
    } catch (error) {
      console.error('Error loading pending invitations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvitation = async (invitationToken: string) => {
    try {
      await tripSharingService.acceptInvitation(invitationToken);
      await loadPendingInvitations();
    } catch (error) {
      console.error('Error accepting invitation:', error);
    }
  };

  const handleDeclineInvitation = async (invitationToken: string) => {
    try {
      await tripSharingService.declineInvitation(invitationToken);
      await loadPendingInvitations();
    } catch (error) {
      console.error('Error declining invitation:', error);
    }
  };

  // Don't render anything for non-authenticated users
  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-2">Pending Trip Invitations</h2>
        <p className="text-sm text-gray-600 mb-4">
          Trip invitations allow others to share their trips with you. You can view or collaborate on their trip planning.
        </p>
        <div className="text-center py-8">Loading...</div>
      </div>
    );
  }

  if (invitations.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-2">Pending Trip Invitations</h2>
        <p className="text-sm text-gray-600 mb-4">
          Trip invitations allow others to share their trips with you. You can view or collaborate on their trip planning.
        </p>
        <p className="text-gray-500 text-center py-8">No pending invitations</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-2">Pending Trip Invitations</h2>
      <p className="text-sm text-gray-600 mb-4">
        Trip invitations allow others to share their trips with you. You can view or collaborate on their trip planning.
      </p>
      <div className="space-y-4">
        {invitations.map((invitation) => (
          <div key={invitation.id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-lg">Trip Invitation</h3>
                <p className="text-gray-600">
                  Permission Level: {invitation.permission_level === 'read' ? 'Read Only' : 'Can Edit'}
                </p>
                <p className="text-sm text-gray-500">
                  Expires: {new Date(invitation.expires_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleAcceptInvitation(invitation.invitation_token)}
                  className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                >
                  Accept
                </button>
                <button
                  onClick={() => handleDeclineInvitation(invitation.invitation_token)}
                  className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                >
                  Decline
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};