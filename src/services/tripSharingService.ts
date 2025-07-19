import { supabase } from '../supabaseClient';
import { toast } from 'react-toastify';

export interface SharedTrip {
  id: string;
  trip_id: string;
  owner_id: string;
  shared_with_id: string;
  shared_with_email: string;
  permission_level: 'read' | 'edit';
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
  updated_at: string;
}

export interface TripInvitation {
  id: string;
  trip_id: string;
  owner_id: string;
  invited_email: string;
  permission_level: 'read' | 'edit';
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  invitation_token: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface TripWithSharing {
  id: string;
  trip_name: string;
  owner_id: string;
  permission_level: 'owner' | 'read' | 'edit';
  shared_users: SharedTrip[];
  pending_invitations: TripInvitation[];
}

export class TripSharingService {

  async acceptInvitation(invitationToken: string): Promise<void> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        throw new Error('Not authenticated');
      }

      // Get invitation details - first try with user's email, then try general invitations
      let { data: invitation, error: invitationError } = await supabase
        .from('trip_invitations')
        .select('*')
        .eq('invitation_token', invitationToken)
        .eq('invited_email', user.user.email)
        .single();

      // If not found with user's email, try to find a general invitation (temp email)
      if (invitationError || !invitation) {
        const { data: generalInvitation, error: generalError } = await supabase
          .from('trip_invitations')
          .select('*')
          .eq('invitation_token', invitationToken)
          .like('invited_email', 'temp-%@invitation.link')
          .single();

        if (generalError || !generalInvitation) {
          throw new Error('Invalid or expired invitation');
        }
        
        invitation = generalInvitation;
      }

      if (invitation.status !== 'pending') {
        throw new Error('Invitation is no longer valid');
      }

      if (new Date(invitation.expires_at) < new Date()) {
        throw new Error('Invitation has expired');
      }

      // Create shared trip record (use actual user email, not temp email)
      const { error: sharedTripError } = await supabase
        .from('shared_trips')
        .insert({
          trip_id: invitation.trip_id,
          owner_id: invitation.owner_id,
          shared_with_id: user.user.id,
          shared_with_email: user.user.email || invitation.invited_email,
          permission_level: invitation.permission_level,
          status: 'accepted',
        });

      if (sharedTripError) {
        throw new Error(`Failed to accept invitation: ${sharedTripError.message}`);
      }

      // Update invitation status
      const { error: updateError } = await supabase
        .from('trip_invitations')
        .update({ status: 'accepted', updated_at: new Date().toISOString() })
        .eq('id', invitation.id);

      if (updateError) {
        console.error('Failed to update invitation status:', updateError);
      }

      toast.success('Invitation accepted successfully');
    } catch (error) {
      console.error('Error accepting invitation:', error);
      const message = error instanceof Error ? error.message : 'Failed to accept invitation';
      toast.error(message);
      throw error;
    }
  }

  async declineInvitation(invitationToken: string): Promise<void> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        throw new Error('Not authenticated');
      }

      // Try to decline with user's email first, then try general invitations
      let { error } = await supabase
        .from('trip_invitations')
        .update({ status: 'declined', updated_at: new Date().toISOString() })
        .eq('invitation_token', invitationToken)
        .eq('invited_email', user.user.email);

      // If not found with user's email, try general invitation
      if (error) {
        const { error: generalError } = await supabase
          .from('trip_invitations')
          .update({ status: 'declined', updated_at: new Date().toISOString() })
          .eq('invitation_token', invitationToken)
          .like('invited_email', 'temp-%@invitation.link');
        
        if (generalError) {
          throw new Error(`Failed to decline invitation: ${generalError.message}`);
        }
      }


      toast.success('Invitation declined');
    } catch (error) {
      console.error('Error declining invitation:', error);
      const message = error instanceof Error ? error.message : 'Failed to decline invitation';
      toast.error(message);
      throw error;
    }
  }

  async removeUserFromTrip(tripId: string, sharedTripId: string): Promise<void> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        throw new Error('Not authenticated');
      }

      // Check if user owns the trip
      const { data: trip, error: tripError } = await supabase
        .from('trips')
        .select('id, user_id')
        .eq('id', tripId)
        .single();

      if (tripError || !trip) {
        throw new Error('Trip not found or access denied');
      }

      if (trip.user_id !== user.user.id) {
        throw new Error('Only trip owners can remove users');
      }

      const { error } = await supabase
        .from('shared_trips')
        .delete()
        .eq('id', sharedTripId)
        .eq('trip_id', tripId);

      if (error) {
        throw new Error(`Failed to remove user: ${error.message}`);
      }

      toast.success('User removed from trip');
    } catch (error) {
      console.error('Error removing user:', error);
      const message = error instanceof Error ? error.message : 'Failed to remove user';
      toast.error(message);
      throw error;
    }
  }

  async updateUserPermission(sharedTripId: string, permissionLevel: 'read' | 'edit'): Promise<void> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        throw new Error('Not authenticated');
      }

      const { error } = await supabase
        .from('shared_trips')
        .update({ permission_level: permissionLevel, updated_at: new Date().toISOString() })
        .eq('id', sharedTripId)
        .eq('owner_id', user.user.id);

      if (error) {
        throw new Error(`Failed to update permission: ${error.message}`);
      }

      toast.success('Permission updated successfully');
    } catch (error) {
      console.error('Error updating permission:', error);
      const message = error instanceof Error ? error.message : 'Failed to update permission';
      toast.error(message);
      throw error;
    }
  }

  async getTripSharingDetails(tripId: string): Promise<TripWithSharing | null> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        throw new Error('Not authenticated');
      }

      // Get trip details
      const { data: trip, error: tripError } = await supabase
        .from('trips')
        .select('id, name, user_id')
        .eq('id', tripId)
        .single();

      if (tripError || !trip) {
        throw new Error('Trip not found or access denied');
      }

      // Get user's permission level
      const { data: permissionData } = await supabase
        .rpc('get_user_trip_permission', { trip_uuid: tripId, user_uuid: user.user.id });

      if (!permissionData && trip.user_id !== user.user.id) {
        throw new Error('Access denied');
      }

      const permissionLevel = trip.user_id === user.user.id ? 'owner' : permissionData;

      // Get shared users (only if user is owner)
      let sharedUsers: SharedTrip[] = [];
      let pendingInvitations: TripInvitation[] = [];

      if (permissionLevel === 'owner') {
        const { data: shared } = await supabase
          .from('shared_trips')
          .select('*')
          .eq('trip_id', tripId)
          .eq('status', 'accepted');

        const { data: invitations } = await supabase
          .from('trip_invitations')
          .select('*')
          .eq('trip_id', tripId)
          .eq('status', 'pending');

        sharedUsers = shared || [];
        pendingInvitations = invitations || [];
      }

      return {
        id: trip.id,
        trip_name: trip.name,
        owner_id: trip.user_id,
        permission_level: permissionLevel as 'owner' | 'read' | 'edit',
        shared_users: sharedUsers,
        pending_invitations: pendingInvitations,
      };
    } catch (error) {
      console.error('Error getting trip sharing details:', error);
      const message = error instanceof Error ? error.message : 'Failed to get trip sharing details';
      toast.error(message);
      throw error;
    }
  }

  async getMySharedTrips(): Promise<TripWithSharing[]> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        throw new Error('Not authenticated');
      }

      const { data: sharedTrips, error } = await supabase
        .from('shared_trips')
        .select('*')
        .eq('shared_with_id', user.user.id)
        .eq('status', 'accepted');

      if (error) {
        throw new Error(`Failed to get shared trips: ${error.message}`);
      }

      return (sharedTrips || []).map(sharedTrip => ({
        id: sharedTrip.trip_id,
        trip_name: 'Shared Trip', // We'll get the actual name later if needed
        owner_id: sharedTrip.owner_id,
        permission_level: sharedTrip.permission_level as 'read' | 'edit',
        shared_users: [],
        pending_invitations: [],
      }));
    } catch (error) {
      console.error('Error getting shared trips:', error);
      const message = error instanceof Error ? error.message : 'Failed to get shared trips';
      toast.error(message);
      throw error;
    }
  }

  async getMyPendingInvitations(): Promise<TripInvitation[]> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        throw new Error('Not authenticated');
      }

      const { data: invitations, error } = await supabase
        .from('trip_invitations')
        .select('*')
        .eq('invited_email', user.user.email)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString());

      if (error) {
        throw new Error(`Failed to get pending invitations: ${error.message}`);
      }

      return invitations || [];
    } catch (error) {
      console.error('Error getting pending invitations:', error);
      const message = error instanceof Error ? error.message : 'Failed to get pending invitations';
      toast.error(message);
      throw error;
    }
  }

  async cancelInvitation(invitationId: string): Promise<void> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        throw new Error('Not authenticated');
      }

      const { error } = await supabase
        .from('trip_invitations')
        .delete()
        .eq('id', invitationId)
        .eq('owner_id', user.user.id);

      if (error) {
        throw new Error(`Failed to cancel invitation: ${error.message}`);
      }

      toast.success('Invitation cancelled');
    } catch (error) {
      console.error('Error cancelling invitation:', error);
      const message = error instanceof Error ? error.message : 'Failed to cancel invitation';
      toast.error(message);
      throw error;
    }
  }

  async updateInvitation(invitationId: string, email: string, permissionLevel: 'read' | 'edit'): Promise<void> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        throw new Error('Not authenticated');
      }

      const { error } = await supabase
        .from('trip_invitations')
        .update({ 
          invited_email: email, 
          permission_level: permissionLevel,
          updated_at: new Date().toISOString()
        })
        .eq('id', invitationId)
        .eq('owner_id', user.user.id);

      if (error) {
        throw new Error(`Failed to update invitation: ${error.message}`);
      }

      toast.success('Invitation updated');
    } catch (error) {
      console.error('Error updating invitation:', error);
      const message = error instanceof Error ? error.message : 'Failed to update invitation';
      toast.error(message);
      throw error;
    }
  }

  async generateInvitationLink(tripId: string, email: string, permissionLevel: 'read' | 'edit'): Promise<string> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        throw new Error('Not authenticated');
      }

      // Check if user owns the trip
      const { data: trip, error: tripError } = await supabase
        .from('trips')
        .select('id, user_id')
        .eq('id', tripId)
        .single();

      if (tripError || !trip) {
        throw new Error('Trip not found or access denied');
      }

      if (trip.user_id !== user.user.id) {
        throw new Error('Only trip owners can generate invitation links');
      }

      // Check if invitation already exists for this email
      const { data: existingInvitation } = await supabase
        .from('trip_invitations')
        .select('invitation_token')
        .eq('trip_id', tripId)
        .eq('invited_email', email)
        .eq('status', 'pending')
        .single();

      let invitationToken;
      if (existingInvitation) {
        // Use existing invitation token
        invitationToken = existingInvitation.invitation_token;
      } else {
        // Create new invitation without sending notification
        const { data: invitation, error } = await supabase
          .from('trip_invitations')
          .insert({
            trip_id: tripId,
            owner_id: user.user.id,
            invited_email: email,
            permission_level: permissionLevel,
          })
          .select()
          .single();

        if (error) {
          throw new Error(`Failed to create invitation: ${error.message}`);
        }

        invitationToken = invitation.invitation_token;
      }

      const baseUrl = window.location.origin;
      return `${baseUrl}/invite/${invitationToken}`;
    } catch (error) {
      console.error('Error generating invitation link:', error);
      throw error;
    }
  }
}

export const tripSharingService = new TripSharingService();