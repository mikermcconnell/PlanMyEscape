import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { logSecurityEvent, checkRateLimit } from './errorHandler';
import { clearCSRFToken } from './csrfProtection';

/**
 * Enhanced Authentication Guard with Security Features
 * 
 * useAuthGuard – Hook to programmatically redirect unauthenticated users to /signin
 * Can be used inside any component (including non-route components) that requires auth.
 *
 * Note: For route-level protection we already use the `ProtectedRoute` wrapper.
 * This hook is provided as an additional safeguard for use cases where wrapping
 * in a route component isn't practical (e.g., deep inside a modal or utility
 * function component).
 */

interface SessionInfo {
  userId: string;
  email: string;
  lastActivity: number;
  sessionStart: number;
}

class SessionManager {
  private static instance: SessionManager;
  private sessionTimeout = 8 * 60 * 60 * 1000; // 8 hours
  private activityTimeout = 30 * 60 * 1000; // 30 minutes of inactivity
  private lastActivity = Date.now();
  private sessionStart = Date.now();
  private activityTimer: NodeJS.Timeout | null = null;

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  updateActivity(): void {
    this.lastActivity = Date.now();
    this.resetActivityTimer();
  }

  private resetActivityTimer(): void {
    if (this.activityTimer) {
      clearTimeout(this.activityTimer);
    }

    this.activityTimer = setTimeout(() => {
      this.handleInactivityTimeout();
    }, this.activityTimeout);
  }

  private async handleInactivityTimeout(): Promise<void> {
    await logSecurityEvent({
      event_type: 'auth_failure',
      details: {
        reason: 'SESSION_INACTIVITY_TIMEOUT',
        last_activity: new Date(this.lastActivity).toISOString(),
        timeout_minutes: this.activityTimeout / 60000
      },
      severity: 'low'
    });

    // Sign out due to inactivity
    await supabase.auth.signOut();
  }

  isSessionValid(): boolean {
    const now = Date.now();
    const sessionAge = now - this.sessionStart;
    const timeSinceActivity = now - this.lastActivity;

    return sessionAge < this.sessionTimeout && timeSinceActivity < this.activityTimeout;
  }

  getSessionInfo(): SessionInfo | null {
    if (!this.isSessionValid()) {
      return null;
    }

    const session = supabase.auth.getSession();
    if (!session) return null;

    return {
      userId: '',  // Will be populated by the auth guard
      email: '',   // Will be populated by the auth guard
      lastActivity: this.lastActivity,
      sessionStart: this.sessionStart
    };
  }

  resetSession(): void {
    this.sessionStart = Date.now();
    this.lastActivity = Date.now();
    this.resetActivityTimer();
  }

  clearSession(): void {
    if (this.activityTimer) {
      clearTimeout(this.activityTimer);
      this.activityTimer = null;
    }
    clearCSRFToken();
  }
}

const sessionManager = SessionManager.getInstance();

// Track suspicious authentication attempts
const trackAuthAttempt = async (event: string, success: boolean, details: any = {}) => {
  if (!checkRateLimit('auth_attempts', 10, 15 * 60 * 1000)) {
    await logSecurityEvent({
      event_type: 'rate_limit_exceeded',
      details: {
        action: 'auth_attempts',
        event,
        ...details
      },
      severity: 'medium'
    });
  }

  if (!success) {
    await logSecurityEvent({
      event_type: 'auth_failure',
      details: {
        event,
        user_agent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        ...details
      },
      severity: event === 'SIGNED_OUT' ? 'low' : 'medium'
    });
  }
};

export const useAuthGuard = (): void => {
  const navigate = useNavigate();

  const handleSignOut = useCallback(async (reason: string = 'user_action') => {
    await trackAuthAttempt('SIGNED_OUT', true, { reason });
    sessionManager.clearSession();
    navigate('/signin');
  }, [navigate]);

  const checkAuthStatus = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        await trackAuthAttempt('SESSION_ERROR', false, { error: error.message });
        await handleSignOut('session_error');
        return;
      }

      if (!session) {
        await handleSignOut('no_session');
        return;
      }

      // Check if session is still valid
      if (!sessionManager.isSessionValid()) {
        await handleSignOut('session_expired');
        return;
      }

      // Update activity timestamp
      sessionManager.updateActivity();

      // Verify session hasn't been tampered with
      const { data: user, error: userError } = await supabase.auth.getUser();
      if (userError || !user?.user) {
        await trackAuthAttempt('USER_VERIFICATION_FAILED', false, { 
          error: userError?.message 
        });
        await handleSignOut('user_verification_failed');
        return;
      }

      // Check for concurrent sessions (if needed)
      // This would require server-side implementation

    } catch (error) {
      await trackAuthAttempt('AUTH_CHECK_ERROR', false, { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      await handleSignOut('auth_check_error');
    }
  }, [handleSignOut]);

  useEffect(() => {
    let isMounted = true;
    let healthCheckInterval: NodeJS.Timeout;

    const initializeAuth = async () => {
      if (!isMounted) return;
      
      await checkAuthStatus();
      
      // Set up periodic session health check
      healthCheckInterval = setInterval(() => {
        if (isMounted) {
          checkAuthStatus();
        }
      }, 5 * 60 * 1000); // Check every 5 minutes
    };

    // Initial check
    initializeAuth();

    // Subscribe to auth state changes with enhanced security
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      switch (event) {
        case 'SIGNED_IN':
          if (session?.user) {
            sessionManager.resetSession();
            await trackAuthAttempt('SIGNED_IN', true, {
              user_id: session.user.id,
              provider: session.user.app_metadata?.provider
            });
          }
          break;

        case 'SIGNED_OUT':
          await handleSignOut('auth_state_change');
          break;

        case 'TOKEN_REFRESHED':
          if (session) {
            sessionManager.updateActivity();
            await trackAuthAttempt('TOKEN_REFRESHED', true, {
              user_id: session.user?.id
            });
          }
          break;

        case 'USER_UPDATED':
          sessionManager.updateActivity();
          break;

        default:
          if (!session) {
            await handleSignOut('unknown_auth_event');
          }
      }
    });

    // Set up activity tracking
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    const handleActivity = () => {
      if (isMounted) {
        sessionManager.updateActivity();
      }
    };

    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Cleanup function
    return () => {
      isMounted = false;
      
      if (healthCheckInterval) {
        clearInterval(healthCheckInterval);
      }
      
      listener.subscription.unsubscribe();
      
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, [checkAuthStatus, handleSignOut]);
};

// Export additional security utilities
export const getCurrentSessionInfo = () => sessionManager.getSessionInfo();
export const updateSessionActivity = () => sessionManager.updateActivity();
export const isSessionHealthy = () => sessionManager.isSessionValid(); 