import { auth } from '../firebaseConfig';
import { deleteUser } from 'firebase/auth';
import { AppError } from './errorHandler';
import { DataRetentionPolicy } from './dataRetentionPolicy';

/**
 * deleteUserAccount - Removes all user data and deletes auth user.
 */
export const deleteUserAccount = async (): Promise<void> => {
  const user = auth.currentUser;

  if (!user) {
    throw new AppError('User not authenticated', 'You must be signed in to delete your account', 401);
  }

  try {
    // 1. Delete all user data from Firestore
    await DataRetentionPolicy.deleteAllUserData(user.uid);

    // 2. Delete the user from Firebase Auth
    await deleteUser(user);

  } catch (error: any) {
    console.error('Account deletion failed:', error);

    // Handle requires-recent-login error
    if (error.code === 'auth/requires-recent-login') {
      throw new AppError(
        'Re-authentication required',
        'For security reasons, please sign out and sign in again before deleting your account.',
        403
      );
    }

    throw new AppError(
      'Account deletion unavailable',
      'We could not complete your account deletion automatically. Please contact support@planmyescape.app so we can finish the process for you.',
      503
    );
  }
};
