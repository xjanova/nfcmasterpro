/**
 * Storage Service — บันทึกประวัติและการตั้งค่า
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NFCScanResult, AppSettings, CardInfo, Transaction, AppNotification, Member } from '../types';
import { STORAGE_KEYS } from '../utils/constants';

const HISTORY_KEY = '@nfc_history';
const SETTINGS_KEY = '@nfc_settings';
const MAX_HISTORY = 500;

// ============================================================
//  Default Settings
// ============================================================

const DEFAULT_SETTINGS: AppSettings = {
  apiBaseUrl: 'https://api.thaiprompt.com/v1',
  apiKey: '',
  nfcDefaultKey: 'FFFFFFFFFFFF',
  hapticFeedback: true,
  autoSaveHistory: true,
  confirmBeforeWrite: true,
  historyLimit: 500,
};

// ============================================================
//  Settings
// ============================================================

export const getSettings = async (): Promise<AppSettings> => {
  try {
    const json = await AsyncStorage.getItem(SETTINGS_KEY);
    if (!json) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(json) };
  } catch {
    return DEFAULT_SETTINGS;
  }
};

export const saveSettings = async (settings: Partial<AppSettings>): Promise<void> => {
  const current = await getSettings();
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...current, ...settings }));
};

// ============================================================
//  Scan History
// ============================================================

export const getScanHistory = async (): Promise<NFCScanResult[]> => {
  try {
    const json = await AsyncStorage.getItem(HISTORY_KEY);
    if (!json) return [];
    return JSON.parse(json);
  } catch {
    return [];
  }
};

export const addScanRecord = async (result: NFCScanResult): Promise<void> => {
  const settings = await getSettings();
  if (!settings.autoSaveHistory) return;

  const history = await getScanHistory();
  history.unshift(result); // Latest first

  // Trim to limit
  const trimmed = history.slice(0, settings.historyLimit || MAX_HISTORY);
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
};

export const deleteScanRecord = async (id: string): Promise<void> => {
  const history = await getScanHistory();
  const filtered = history.filter(r => r.id !== id);
  await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(filtered));
};

export const clearHistory = async (): Promise<void> => {
  await AsyncStorage.removeItem(HISTORY_KEY);
};

export const getHistoryByOperation = async (
  operation: 'read' | 'write' | 'clone' | 'register' | 'all'
): Promise<NFCScanResult[]> => {
  const history = await getScanHistory();
  if (operation === 'all') return history;
  return history.filter(r => r.operation === operation);
};

// ============================================================
//  Stats
// ============================================================

export const getStats = async (): Promise<{ reads: number; writes: number; clones: number; registers: number }> => {
  const history = await getScanHistory();
  return {
    reads: history.filter(r => r.operation === 'read').length,
    writes: history.filter(r => r.operation === 'write').length,
    clones: history.filter(r => r.operation === 'clone').length,
    registers: history.filter(r => r.operation === 'register').length,
  };
};

// ============================================================
//  Card Storage
// ============================================================

export const getCards = async (): Promise<CardInfo[]> => {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEYS.CARDS);
    if (!json) return [];
    return JSON.parse(json);
  } catch {
    return [];
  }
};

export const saveCards = async (cards: CardInfo[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.CARDS, JSON.stringify(cards));
  } catch (error) {
    console.error('[StorageService] Error saving cards:', error);
    throw new Error('บันทึกการ์ดไม่สำเร็จ');
  }
};

// ============================================================
//  Transaction Storage
// ============================================================

export const getTransactions = async (): Promise<Transaction[]> => {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (!json) return [];
    return JSON.parse(json);
  } catch {
    return [];
  }
};

export const saveTransactions = async (txs: Transaction[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(txs));
  } catch (error) {
    console.error('[StorageService] Error saving transactions:', error);
    throw new Error('บันทึกธุรกรรมไม่สำเร็จ');
  }
};

// ============================================================
//  Notification Storage
// ============================================================

export const getNotifications = async (): Promise<AppNotification[]> => {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    if (!json) return [];
    return JSON.parse(json);
  } catch {
    return [];
  }
};

export const saveNotifications = async (notifs: AppNotification[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifs));
  } catch (error) {
    console.error('[StorageService] Error saving notifications:', error);
    throw new Error('บันทึกการแจ้งเตือนไม่สำเร็จ');
  }
};

// ============================================================
//  Member Storage
// ============================================================

export const getMembers = async (): Promise<Member[]> => {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEYS.MEMBERS);
    if (!json) return [];
    return JSON.parse(json);
  } catch {
    return [];
  }
};

export const saveMembers = async (members: Member[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));
  } catch (error) {
    console.error('[StorageService] Error saving members:', error);
    throw new Error('บันทึกสมาชิกไม่สำเร็จ');
  }
};
