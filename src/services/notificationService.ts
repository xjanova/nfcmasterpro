/**
 * Notification Service — Manages in-app notifications
 * Stores and retrieves notifications from AsyncStorage
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppNotification, CardInfo } from '../types';
import { STORAGE_KEYS, LOW_BALANCE_THRESHOLD, NOTIFICATION_TYPES } from '../utils/constants';

// ============================================================
//  Helpers
// ============================================================

/**
 * Generate unique ID
 */
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

/**
 * Get all notifications from storage
 */
const getNotificationsFromStorage = async (): Promise<AppNotification[]> => {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    if (!json) return [];
    return JSON.parse(json);
  } catch (error) {
    console.error('[NotificationService] Error getting notifications:', error);
    return [];
  }
};

/**
 * Save notifications to storage
 */
const saveNotificationsToStorage = async (notifs: AppNotification[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifs));
  } catch (error) {
    console.error('[NotificationService] Error saving notifications:', error);
    throw new Error('บันทึกการแจ้งเตือนไม่สำเร็จ');
  }
};

// ============================================================
//  Notification Retrieval
// ============================================================

/**
 * Get all notifications sorted by timestamp (newest first)
 */
export const getNotifications = async (): Promise<AppNotification[]> => {
  try {
    const notifs = await getNotificationsFromStorage();
    return notifs.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  } catch (error) {
    console.error('[NotificationService] Error getting notifications:', error);
    return [];
  }
};

/**
 * Add a new notification
 */
export const addNotification = async (
  type: string,
  title: string,
  message: string,
  data?: any
): Promise<AppNotification> => {
  try {
    const notifs = await getNotificationsFromStorage();

    const notification: AppNotification = {
      id: generateId(),
      type,
      title,
      message,
      timestamp: new Date().toISOString(),
      read: false,
      data,
    };

    notifs.push(notification);
    await saveNotificationsToStorage(notifs);

    console.log('[NotificationService] Notification added:', notification.id);
    return notification;
  } catch (error) {
    console.error('[NotificationService] Error adding notification:', error);
    throw error instanceof Error ? error : new Error('สร้างการแจ้งเตือนไม่สำเร็จ');
  }
};

// ============================================================
//  Notification Management
// ============================================================

/**
 * Mark notification as read
 */
export const markAsRead = async (id: string): Promise<void> => {
  try {
    const notifs = await getNotificationsFromStorage();
    const notif = notifs.find(n => n.id === id);
    if (notif) {
      notif.read = true;
      await saveNotificationsToStorage(notifs);
    }
  } catch (error) {
    console.error('[NotificationService] Error marking notification as read:', error);
    throw new Error('อัพเดตการแจ้งเตือนไม่สำเร็จ');
  }
};

/**
 * Mark all notifications as read
 */
export const markAllAsRead = async (): Promise<void> => {
  try {
    const notifs = await getNotificationsFromStorage();
    notifs.forEach(n => (n.read = true));
    await saveNotificationsToStorage(notifs);
  } catch (error) {
    console.error('[NotificationService] Error marking all as read:', error);
    throw new Error('อัพเดตการแจ้งเตือนไม่สำเร็จ');
  }
};

/**
 * Get count of unread notifications
 */
export const getUnreadCount = async (): Promise<number> => {
  try {
    const notifs = await getNotificationsFromStorage();
    return notifs.filter(n => !n.read).length;
  } catch (error) {
    console.error('[NotificationService] Error getting unread count:', error);
    return 0;
  }
};

/**
 * Clear all notifications
 */
export const clearNotifications = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
  } catch (error) {
    console.error('[NotificationService] Error clearing notifications:', error);
    throw new Error('ลบการแจ้งเตือนไม่สำเร็จ');
  }
};

// ============================================================
//  Low Balance Check
// ============================================================

/**
 * Check if card balance is low and create notification
 * Triggers only if balance < LOW_BALANCE_THRESHOLD
 */
export const checkLowBalance = async (card: CardInfo): Promise<void> => {
  try {
    if (card.balance < LOW_BALANCE_THRESHOLD) {
      // Check if we already have a recent low balance notification for this card
      const notifs = await getNotificationsFromStorage();
      const recentLowBalanceNotif = notifs.find(
        n =>
          n.type === NOTIFICATION_TYPES.LOW_BALANCE &&
          n.data?.cardUID === card.uid &&
          !n.read
      );

      // Only create notification if we don't have a recent unread one
      if (!recentLowBalanceNotif) {
        await addNotification(
          NOTIFICATION_TYPES.LOW_BALANCE,
          'ยอดเงินต่ำ',
          `การ์ด ${card.memberName || card.uid} มียอดเงินเหลือเพียง ${card.balance} บาท`,
          { cardUID: card.uid, balance: card.balance }
        );
      }
    }
  } catch (error) {
    console.error('[NotificationService] Error checking low balance:', error);
  }
};
