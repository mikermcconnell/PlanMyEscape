import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';
import FullPageSpinner from '../components/FullPageSpinner';
import { hybridDataService } from '../services/hybridDataService';
import { TripStorage } from '../services/tripStorage';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  migrationStatus: 'pending' | 'complete' | 'error' | 'retrying' | null;
  retryMigration: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  session: null, 
  migrationStatus: null,
  retryMigration: async () => {} 
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [migrationStatus, setMigrationStatus] = useState<'pending' | 'complete' | 'error' | 'retrying' | null>(null);
  const [hasTriggeredMigration, setHasTriggeredMigration] = useState(false);
  const [, setMigrationRetryCount] = useState(0);
  const maxRetries = 3;

  // Migration function with retry logic
  const performMigration = useCallback(async () => {
    let currentRetryCount = 0;
    
    const attemptMigration = async (): Promise<void> => {
      try {
        setMigrationStatus(currentRetryCount > 0 ? 'retrying' : 'pending');
        
        // Get all trip IDs from LOCAL storage specifically for migration
        const localTripAdapter = new TripStorage();
        const localTrips = await localTripAdapter.getTrips();
        const tripIds = localTrips.map(trip => trip.id);
        
        if (tripIds.length > 0) {
          console.log(`Starting migration for ${tripIds.length} trips... (attempt ${currentRetryCount + 1})`);
          await hybridDataService.migrateLocalDataToSupabase(tripIds);
          console.log('Data migration completed successfully');
        } else {
          console.log('No trips found to migrate');
        }
        
        setMigrationStatus('complete');
        setMigrationRetryCount(0);
      } catch (error) {
        console.error(`Data migration failed (attempt ${currentRetryCount + 1}):`, error);
        currentRetryCount++;
        setMigrationRetryCount(currentRetryCount);
        
        if (currentRetryCount < maxRetries) {
          // Exponential backoff: wait 2^attempt seconds
          const delay = Math.pow(2, currentRetryCount) * 1000;
          console.log(`Retrying migration in ${delay}ms...`);
          
          setTimeout(() => {
            attemptMigration();
          }, delay);
        } else {
          console.error('Migration failed after maximum retries');
          setMigrationStatus('error');
        }
      }
    };
    
    await attemptMigration();
  }, [maxRetries]);

  useEffect(() => {
    let isMounted = true;

    (async () => {
      const { data } = await supabase.auth.getSession();
      if (isMounted) {
        setSession(data.session);
        setLoading(false);
      }
    })();

    const { data: listener } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (isMounted) {
        setSession(newSession);
        
        // Trigger data migration when user signs in
        if (event === 'SIGNED_IN' && newSession?.user && !hasTriggeredMigration) {
          setHasTriggeredMigration(true);
          performMigration();
        }
        
        // Reset migration status and flag on sign out
        if (event === 'SIGNED_OUT') {
          setHasTriggeredMigration(false);
          setMigrationStatus(null);
          setMigrationRetryCount(0);
        }
      }
    });

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, [hasTriggeredMigration, performMigration]);
  
  // Manual retry function for user-triggered retries
  const retryMigration = async () => {
    if (!session?.user) {
      console.warn('Cannot retry migration: user not signed in');
      return;
    }
    
    setMigrationRetryCount(0);
    await performMigration();
  };

  if (loading) {
    return <FullPageSpinner />;
  }

  return (
    <AuthContext.Provider value={{ 
      user: session?.user ?? null, 
      session, 
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