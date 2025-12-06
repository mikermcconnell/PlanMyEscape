/**
 * Notification Service
 * Handles push notifications for trip reminders using Firebase Cloud Messaging
 */

import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';
import { app } from '../firebaseConfig';
import logger from '../utils/logger';
import { Trip } from '../types';

// VAPID public key for web push (you'll need to set this in Firebase Console)
const VAPID_KEY = process.env.REACT_APP_FIREBASE_VAPID_KEY || '';

class NotificationService {
    private messaging: Messaging | null = null;
    private initialized = false;

    /**
     * Initialize Firebase Cloud Messaging
     */
    async initialize(): Promise<void> {
        if (this.initialized) return;

        if (!('Notification' in window)) {
            logger.warn('[NotificationService] Notifications not supported in this browser');
            return;
        }

        if (!('serviceWorker' in navigator)) {
            logger.warn('[NotificationService] Service workers not supported');
            return;
        }

        try {
            this.messaging = getMessaging(app);
            this.setupMessageHandler();
            this.initialized = true;
            logger.log('[NotificationService] Initialized successfully');
        } catch (error) {
            logger.error('[NotificationService] Failed to initialize:', error);
        }
    }

    /**
     * Request notification permission from user
     */
    async requestPermission(): Promise<boolean> {
        if (!('Notification' in window)) {
            return false;
        }

        if (Notification.permission === 'granted') {
            return true;
        }

        if (Notification.permission === 'denied') {
            logger.log('[NotificationService] Notifications blocked by user');
            return false;
        }

        try {
            const permission = await Notification.requestPermission();
            const granted = permission === 'granted';
            logger.log(`[NotificationService] Permission ${granted ? 'granted' : 'denied'}`);
            return granted;
        } catch (error) {
            logger.error('[NotificationService] Failed to request permission:', error);
            return false;
        }
    }

    /**
     * Get the FCM token for this device
     */
    async getToken(): Promise<string | null> {
        if (!this.messaging) {
            await this.initialize();
        }

        if (!this.messaging) {
            return null;
        }

        try {
            const registration = await navigator.serviceWorker.ready;
            const token = await getToken(this.messaging, {
                vapidKey: VAPID_KEY,
                serviceWorkerRegistration: registration
            });
            logger.log('[NotificationService] FCM token obtained');
            return token;
        } catch (error) {
            logger.error('[NotificationService] Failed to get token:', error);
            return null;
        }
    }

    /**
     * Setup handler for foreground messages
     */
    private setupMessageHandler(): void {
        if (!this.messaging) return;

        onMessage(this.messaging, (payload) => {
            logger.log('[NotificationService] Foreground message received:', payload);

            // Show notification when app is in foreground
            if (payload.notification) {
                const { title, body } = payload.notification;
                this.showLocalNotification(title || 'PlanMyEscape', body || '');
            }
        });
    }

    /**
     * Show a local notification
     */
    async showLocalNotification(title: string, body: string, options?: NotificationOptions): Promise<void> {
        if (Notification.permission !== 'granted') {
            logger.warn('[NotificationService] Cannot show notification - permission not granted');
            return;
        }

        try {
            const registration = await navigator.serviceWorker.ready;
            await registration.showNotification(title, {
                body,
                icon: '/icon-192.png',
                badge: '/icon-192.png',
                vibrate: [100, 50, 100],
                tag: 'planmyescape',
                ...options
            });
        } catch (error) {
            // Fallback to standard Notification API
            new Notification(title, {
                body,
                icon: '/icon-192.png',
                ...options
            });
        }
    }

    /**
     * Schedule a trip reminder notification
     * Note: True scheduling requires a backend. This sets up client-side reminders.
     */
    scheduleTripReminder(trip: Trip): void {
        const tripStart = new Date(trip.startDate);
        const reminderTime = new Date(tripStart);
        reminderTime.setDate(reminderTime.getDate() - 2); // 2 days before

        const now = new Date();
        const delay = reminderTime.getTime() - now.getTime();

        if (delay > 0) {
            // Store reminder in localStorage for persistence across sessions
            const reminders = this.getStoredReminders();
            reminders[trip.id] = {
                tripId: trip.id,
                tripName: trip.tripName,
                reminderTime: reminderTime.toISOString()
            };
            localStorage.setItem('trip_reminders', JSON.stringify(reminders));

            logger.log(`[NotificationService] Reminder scheduled for ${trip.tripName} on ${reminderTime.toLocaleDateString()}`);
        }
    }

    /**
     * Check for pending reminders on app load
     */
    async checkPendingReminders(): Promise<void> {
        const reminders = this.getStoredReminders();
        const now = new Date();

        for (const [tripId, reminder] of Object.entries(reminders)) {
            const reminderTime = new Date(reminder.reminderTime);

            if (reminderTime <= now) {
                // Show the reminder
                await this.showLocalNotification(
                    `🏕️ Trip Reminder`,
                    `Your trip "${reminder.tripName}" starts in 2 days! Time to start packing!`,
                    { data: { tripId } }
                );

                // Remove the triggered reminder
                delete reminders[tripId];
                localStorage.setItem('trip_reminders', JSON.stringify(reminders));
            }
        }
    }

    private getStoredReminders(): Record<string, { tripId: string; tripName: string; reminderTime: string }> {
        try {
            return JSON.parse(localStorage.getItem('trip_reminders') || '{}');
        } catch {
            return {};
        }
    }

    /**
     * Get notification permission status
     */
    getPermissionStatus(): NotificationPermission | 'unsupported' {
        if (!('Notification' in window)) {
            return 'unsupported';
        }
        return Notification.permission;
    }
}

export const notificationService = new NotificationService();
