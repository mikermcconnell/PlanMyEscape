import { db } from '../firebaseConfig';
import { collection, addDoc, query, where, getDocs, writeBatch, Timestamp } from 'firebase/firestore';

export type SecurityEventType = 'login' | 'login_google' | 'signup' | 'failed_login' | 'data_access' | 'data_export' | 'password_reset' | 'password_reset_initiated' | 'password_updated' | 'suspicious_activity' | 'rate_limit_exceeded' | 'auth_failure' | 'data_access_violation' | 'input_validation_error';

interface SecurityEvent {
  type: SecurityEventType;
  userId?: string;
  ip?: string;
  userAgent?: string;
  details?: Record<string, unknown>;
}

const hashData = async (data: string): Promise<string> => {
  if (!data) return '';

  try {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
  } catch {
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return Math.abs(hash).toString(16).substring(0, 16);
  }
};

const redactIp = (ip?: string): string | null => {
  if (!ip) return null;
  if (ip.includes(':')) {
    const parts = ip.split(':');
    return `${parts.slice(0, -1).join(':')}:0000`;
  }
  const segments = ip.split('.');
  if (segments.length === 4) {
    return `${segments[0]}.${segments[1]}.xxx.xxx`;
  }
  return null;
};

export const logSecurityEvent = async (event: SecurityEvent): Promise<void> => {
  try {
    const redactedIp = redactIp(event.ip);
    const hashedUserId = event.userId ? await hashData(event.userId) : undefined;
    const hashedIp = event.ip ? await hashData(event.ip) : undefined;

    await addDoc(collection(db, 'security_logs'), {
      event_type: event.type,
      user_id: event.userId ?? null,
      ip_address: redactedIp,
      user_agent: event.userAgent || navigator.userAgent,
      details: JSON.parse(JSON.stringify({
        ...event.details,
        hashed_user_id: hashedUserId,
        hashed_ip: hashedIp
      })),
      timestamp: Timestamp.now()
    });
  } catch (error) {
    console.error('Security event logging failed', error);
  }
};

export const cleanupOldSecurityLogs = async (retentionDays: number = 90): Promise<void> => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    const cutoffTimestamp = Timestamp.fromDate(cutoffDate);

    const q = query(
      collection(db, 'security_logs'),
      where('timestamp', '<', cutoffTimestamp)
    );

    const snapshot = await getDocs(q);
    const batch = writeBatch(db);

    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
  } catch (error) {
    console.error('Security log cleanup failed', error);
  }
};
