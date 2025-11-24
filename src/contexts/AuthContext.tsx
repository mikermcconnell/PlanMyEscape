import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import FullPageSpinner from '../components/FullPageSpinner';
import { hybridDataService } from '../services/hybridDataService';
import { TripStorage } from '../services/tripStorage';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  migrationStatus: 'pending' | 'complete' | 'error' | 'retrying' | null;
  retryMigration: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => { },
  migrationStatus: null,
  retryMigration: async () => { }
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [migrationStatus, setMigrationStatus] = useState<'pending' | 'complete' | 'error' | 'retrying' | null>(null);
  const [hasTriggeredMigration, setHasTriggeredMigration] = useState(false);

  const performMigration = async () => {
    try {
      setMigrationStatus('pending');
      const localTripAdapter = new TripStorage();
      const localTrips = await localTripAdapter.getTrips();
      const tripIds = localTrips.map(trip => trip.id);

      if (tripIds.length > 0) {
        console.log(`Starting migration for ${tripIds.length} trips...`);
        // We'll update hybridDataService to have this method
        await hybridDataService.migrateLocalDataToFirebase(tripIds);
        console.log('Data migration completed successfully');
      }

      setMigrationStatus('complete');
    } catch (error) {
      console.error('Data migration failed:', error);
      setMigrationStatus('error');
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoading(false);

      if (currentUser && !hasTriggeredMigration) {
        setHasTriggeredMigration(true);
        performMigration();
      } else if (!currentUser) {
        setHasTriggeredMigration(false);
        setMigrationStatus(null);
      }
    });

    return () => unsubscribe();
  }, [hasTriggeredMigration]);

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const retryMigration = async () => {
    if (user) {
      await performMigration();
    }
  };

  if (loading) {
    return <FullPageSpinner />;
  }

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signOut,
      migrationStatus,
      retryMigration
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};