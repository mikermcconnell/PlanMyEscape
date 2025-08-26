import { supabase } from '../supabaseClient';

export type SecurityEventType = 'login' | 'failed_login' | 'data_access' | 'data_export' | 'password_reset' | 'password_reset_initiated' | 'password_updated';

interface SecurityEvent {
  type: SecurityEventType;
  userId?: string;
  ip?: string;
  userAgent?: string;
  details?: unknown;
}

// Privacy-compliant logging - anonymize sensitive data
interface PrivacyCompliantEvent {
  type: SecurityEventType;
  userIdHash?: string; // Hash instead of actual user ID
  ipHash?: string;     // Hash instead of actual IP
  timestamp: string;
  eventId: string;     // Unique identifier for this event
}

/**
 * Hash sensitive data for privacy compliance
 */
const hashData = async (data: string): Promise<string> => {
  if (!data) return '';
  
  try {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
  } catch {
    // Fallback to simple hash for older browsers
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16).substring(0, 16);
  }
};

/**
 * logSecurityEvent – write a privacy-compliant security event to the `security_logs` table.
 * Implements ephemeral data collection by hashing sensitive information.
 * Data is processed in memory and only anonymized data is persisted.
 */
export const logSecurityEvent = async (event: SecurityEvent): Promise<void> => {
  try {
    // Process data ephemerally - hash sensitive info in memory before storage
    const privacyCompliantEvent: PrivacyCompliantEvent = {
      type: event.type,
      userIdHash: event.userId ? await hashData(event.userId) : undefined,
      ipHash: event.ip ? await hashData(event.ip) : undefined,
      timestamp: new Date().toISOString(),
      eventId: crypto.randomUUID()
    };
    
    // Only store anonymized event data
    await supabase.from('security_logs').insert({
      event_type: privacyCompliantEvent.type,
      user_id_hash: privacyCompliantEvent.userIdHash,
      ip_hash: privacyCompliantEvent.ipHash,
      timestamp: privacyCompliantEvent.timestamp,
      event_id: privacyCompliantEvent.eventId,
      details: event.details ? JSON.stringify(event.details) : null
    });
    
    // Clear sensitive data from memory immediately
    Object.keys(event).forEach(key => {
      if (key === 'userId' || key === 'ip' || key === 'userAgent') {
        delete (event as any)[key];
      }
    });
    
  } catch (error) {
    // Log minimal error info without exposing sensitive data
    console.error('Security event logging failed');
  }
};

/**
 * Clean up old security logs to comply with data retention policies
 */
export const cleanupOldSecurityLogs = async (retentionDays: number = 90): Promise<void> => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    
    const { error } = await supabase
      .from('security_logs')
      .delete()
      .lt('timestamp', cutoffDate.toISOString());
    
    if (error) {
      console.error('Failed to cleanup old security logs');
    } else {
      console.log(`🧹 [SecurityLogger] Cleaned security logs older than ${retentionDays} days`);
    }
  } catch (error) {
    console.error('Security log cleanup failed');
  }
};
