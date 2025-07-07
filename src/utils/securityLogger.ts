import { supabase } from '../supabaseClient';

export type SecurityEventType = 'login' | 'failed_login' | 'data_access' | 'data_export';

interface SecurityEvent {
  type: SecurityEventType;
  userId?: string;
  ip?: string;
  userAgent?: string;
  details?: unknown;
}

/**
 * logSecurityEvent – write a security-related event to the `security_logs` table.
 * This runs best with a dedicated table + RLS that allows insert for authenticated users.
 */
export const logSecurityEvent = async (event: SecurityEvent): Promise<void> => {
  try {
    await supabase.from('security_logs').insert({
      ...event,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to log security event', error);
  }
}; 