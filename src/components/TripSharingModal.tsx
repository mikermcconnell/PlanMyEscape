import React, { useState, useEffect, useCallback } from 'react';
import { tripSharingService, TripWithSharing, TripInvitation } from '../services/tripSharingService';

interface TripSharingModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
}

export const TripSharingModal: React.FC<TripSharingModalProps> = ({ isOpen, onClose, tripId }) => {
  const [tripData, setTripData] = useState<TripWithSharing | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePermission, setInvitePermission] = useState<'read' | 'edit'>('read');
  const [loading, setLoading] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [editingInvitation, setEditingInvitation] = useState<string | null>(null);
  const [editEmail, setEditEmail] = useState('');
  const [editPermission, setEditPermission] = useState<'read' | 'edit'>('read');

  const loadTripData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await tripSharingService.getTripSharingDetails(tripId);
      setTripData(data);
    } catch (error) {
      console.error('Error loading trip sharing data:', error);
    } finally {
      setLoading(false);
    }
  }, [tripId]);

  useEffect(() => {
    if (isOpen && tripId) {
      loadTripData();
    }
  }, [isOpen, tripId, loadTripData]);

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    try {
      setInviteLoading(true);
      await tripSharingService.inviteUserToTrip(tripId, inviteEmail.trim(), invitePermission);
      setInviteEmail('');
      setInvitePermission('read');
      await loadTripData();
    } catch (error) {
      console.error('Error inviting user:', error);
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRemoveUser = async (sharedTripId: string) => {
    try {
      await tripSharingService.removeUserFromTrip(tripId, sharedTripId);
      await loadTripData();
    } catch (error) {
      console.error('Error removing user:', error);
    }
  };

  const handleUpdatePermission = async (sharedTripId: string, newPermission: 'read' | 'edit') => {
    try {
      await tripSharingService.updateUserPermission(sharedTripId, newPermission);
      await loadTripData();
    } catch (error) {
      console.error('Error updating permission:', error);
    }
  };

  const generateInviteLink = async (email: string, permission: 'read' | 'edit') => {
    try {
      if (!email.trim()) {
        // Generate a temporary email for the link, user can share the link directly
        const tempEmail = `temp-${Date.now()}@invitation.link`;
        const link = await tripSharingService.generateInvitationLink(tripId, tempEmail, permission);
        await navigator.clipboard.writeText(link);
        alert('Invitation link copied to clipboard! Share this link with anyone you want to invite.');
        await loadTripData();
      } else {
        // Generate link for specific email
        const link = await tripSharingService.generateInvitationLink(tripId, email, permission);
        await navigator.clipboard.writeText(link);
        alert('Invitation link copied to clipboard!');
        await loadTripData();
      }
    } catch (error) {
      console.error('Error generating invite link:', error);
    }
  };

  const handleCancelInvitation = async (invitationId: string) => {
    try {
      await tripSharingService.cancelInvitation(invitationId);
      await loadTripData();
    } catch (error) {
      console.error('Error cancelling invitation:', error);
    }
  };

  const handleEditInvitation = (invitation: TripInvitation) => {
    setEditingInvitation(invitation.id);
    setEditEmail(invitation.invited_email);
    setEditPermission(invitation.permission_level);
  };

  const handleSaveEdit = async () => {
    if (!editingInvitation) return;
    try {
      await tripSharingService.updateInvitation(editingInvitation, editEmail, editPermission);
      setEditingInvitation(null);
      setEditEmail('');
      setEditPermission('read');
      await loadTripData();
    } catch (error) {
      console.error('Error updating invitation:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingInvitation(null);
    setEditEmail('');
    setEditPermission('read');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Share Trip</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ×
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : tripData ? (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">{tripData.trip_name}</h3>
              <p className="text-gray-600">
                Permission Level: <span className="font-medium">{tripData.permission_level}</span>
              </p>
            </div>

            {tripData.permission_level === 'owner' && (
              <>
                <div className="border-t pt-4">
                  <h4 className="font-semibold mb-3">Invite Someone</h4>
                  <form onSubmit={handleInviteUser} className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Email Address</label>
                      <input
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter email address"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Permission Level</label>
                      <select
                        value={invitePermission}
                        onChange={(e) => setInvitePermission(e.target.value as 'read' | 'edit')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="read">Read Only</option>
                        <option value="edit">Can Edit</option>
                      </select>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        type="submit"
                        disabled={inviteLoading}
                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
                      >
                        {inviteLoading ? 'Sending...' : 'Send Invite'}
                      </button>
                      <button
                        type="button"
                        onClick={() => generateInviteLink(inviteEmail, invitePermission)}
                        className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                      >
                        Generate Link
                      </button>
                    </div>
                  </form>
                </div>

                {tripData.shared_users.length > 0 && (
                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-3">Shared Users</h4>
                    <div className="space-y-2">
                      {tripData.shared_users.map((sharedUser) => (
                        <div key={sharedUser.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                          <div>
                            <div className="font-medium">{sharedUser.shared_with_email}</div>
                            <div className="text-sm text-gray-600">
                              {sharedUser.permission_level === 'read' ? 'Read Only' : 'Can Edit'}
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <select
                              value={sharedUser.permission_level}
                              onChange={(e) => handleUpdatePermission(sharedUser.id, e.target.value as 'read' | 'edit')}
                              className="px-2 py-1 text-sm border border-gray-300 rounded"
                            >
                              <option value="read">Read Only</option>
                              <option value="edit">Can Edit</option>
                            </select>
                            <button
                              onClick={() => handleRemoveUser(sharedUser.id)}
                              className="px-2 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {tripData.pending_invitations.length > 0 && (
                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-3">Pending Invitations</h4>
                    <div className="space-y-2">
                      {tripData.pending_invitations.map((invitation) => (
                        <div key={invitation.id} className="p-3 bg-yellow-50 rounded-md">
                          {editingInvitation === invitation.id ? (
                            <div className="space-y-3">
                              <div>
                                <label className="block text-sm font-medium mb-1">Email Address</label>
                                <input
                                  type="email"
                                  value={editEmail}
                                  onChange={(e) => setEditEmail(e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium mb-1">Permission Level</label>
                                <select
                                  value={editPermission}
                                  onChange={(e) => setEditPermission(e.target.value as 'read' | 'edit')}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                  <option value="read">Read Only</option>
                                  <option value="edit">Can Edit</option>
                                </select>
                              </div>
                              <div className="flex space-x-2">
                                <button
                                  onClick={handleSaveEdit}
                                  className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={handleCancelEdit}
                                  className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium">{invitation.invited_email}</div>
                                <div className="text-sm text-gray-600">
                                  {invitation.permission_level === 'read' ? 'Read Only' : 'Can Edit'} • 
                                  Expires: {new Date(invitation.expires_at).toLocaleDateString()}
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => generateInviteLink(invitation.invited_email, invitation.permission_level)}
                                  className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                                  title="Copy invitation link"
                                >
                                  Copy Link
                                </button>
                                <button
                                  onClick={() => handleEditInvitation(invitation)}
                                  className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
                                  title="Edit invitation"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleCancelInvitation(invitation.id)}
                                  className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                                  title="Cancel invitation"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {tripData.permission_level !== 'owner' && (
              <div className="border-t pt-4">
                <p className="text-gray-600">
                  You have {tripData.permission_level === 'read' ? 'read-only' : 'edit'} access to this trip.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            Failed to load trip sharing information.
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};