/**
 * Payment Service — Handles payment processing and transaction management
 * Manages balance deductions, credit top-ups, and PV calculations
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Transaction, CardInfo } from '../types';
import { STORAGE_KEYS, PV_RATE, LOW_BALANCE_THRESHOLD, TRANSACTION_TYPES } from '../utils/constants';
import * as cardService from './cardService';
import * as notificationService from './notificationService';

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
 * Get all transactions from storage
 */
const getTransactionsFromStorage = async (): Promise<Transaction[]> => {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (!json) return [];
    return JSON.parse(json);
  } catch (error) {
    console.error('[PaymentService] Error getting transactions:', error);
    return [];
  }
};

/**
 * Save transactions to storage
 */
const saveTransactionsToStorage = async (transactions: Transaction[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  } catch (error) {
    console.error('[PaymentService] Error saving transactions:', error);
    throw new Error('บันทึกธุรกรรมไม่สำเร็จ');
  }
};

// ============================================================
//  PV Calculation
// ============================================================

/**
 * Calculate PV points based on amount
 * Using PV_RATE from constants (10%)
 */
export const calculatePV = (amount: number): number => {
  return Math.floor(amount * PV_RATE);
};

// ============================================================
//  Payment Processing
// ============================================================

/**
 * Process payment from card
 * Deducts amount, calculates PV, creates transaction, checks low balance
 */
export const processPayment = async (
  cardUID: string,
  amount: number,
  note?: string
): Promise<Transaction> => {
  try {
    // Validate amount
    if (amount <= 0) {
      throw new Error('จำนวนเงินต้องมากกว่า 0');
    }

    // Lookup card
    const card = await cardService.getCardByUID(cardUID);
    if (!card) {
      throw new Error('ไม่พบการ์ด');
    }

    // Check card is active
    if (card.status !== 'active') {
      throw new Error('การ์ดไม่อยู่ในสถานะใช้งาน');
    }

    // Check balance
    if (card.balance < amount) {
      throw new Error('ยอดเงินในการ์ดไม่เพียงพอ');
    }

    // Deduct balance
    const { transaction } = await cardService.deductBalance(cardUID, amount);

    // Add transaction note
    if (note) {
      transaction.note = note;
    }

    // Save transaction
    const transactions = await getTransactionsFromStorage();
    transactions.push(transaction);
    await saveTransactionsToStorage(transactions);

    // Update card last used
    const updatedCard = await cardService.getCardByUID(cardUID);
    if (updatedCard && updatedCard.balance < LOW_BALANCE_THRESHOLD) {
      await notificationService.checkLowBalance(updatedCard);
    }

    console.log('[PaymentService] Payment processed:', transaction.id);
    return transaction;
  } catch (error) {
    console.error('[PaymentService] Error processing payment:', error);
    throw error instanceof Error ? error : new Error('ประมวลผลการชำระเงินไม่สำเร็จ');
  }
};

// ============================================================
//  Credit Management
// ============================================================

/**
 * Add credit to card (admin top-up)
 */
export const addCredit = async (
  cardUID: string,
  amount: number,
  note?: string
): Promise<Transaction> => {
  try {
    // Validate amount
    if (amount <= 0) {
      throw new Error('จำนวนเงินต้องมากกว่า 0');
    }

    // Lookup card
    const card = await cardService.getCardByUID(cardUID);
    if (!card) {
      throw new Error('ไม่พบการ์ด');
    }

    // Add balance
    const { transaction } = await cardService.addBalance(cardUID, amount);

    // Add note
    if (note) {
      transaction.note = note;
    } else {
      transaction.note = 'เติมเงินจากแอดมิน';
    }

    // Save transaction
    const transactions = await getTransactionsFromStorage();
    transactions.push(transaction);
    await saveTransactionsToStorage(transactions);

    console.log('[PaymentService] Credit added:', transaction.id);
    return transaction;
  } catch (error) {
    console.error('[PaymentService] Error adding credit:', error);
    throw error instanceof Error ? error : new Error('เติมเงินไม่สำเร็จ');
  }
};

// ============================================================
//  Transaction History
// ============================================================

/**
 * Get transaction history
 * Can filter by card UID
 */
export const getTransactionHistory = async (
  cardUID?: string
): Promise<Transaction[]> => {
  try {
    const transactions = await getTransactionsFromStorage();

    // Filter by card if provided
    if (cardUID) {
      return transactions
        .filter(t => t.cardUID === cardUID)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }

    // Return all sorted by timestamp (newest first)
    return transactions.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  } catch (error) {
    console.error('[PaymentService] Error getting transaction history:', error);
    return [];
  }
};

// ============================================================
//  Analytics
// ============================================================

/**
 * Get transaction statistics
 */
export const getTransactionStats = async (): Promise<{
  totalTransactions: number;
  totalAmount: number;
  totalPV: number;
}> => {
  try {
    const transactions = await getTransactionsFromStorage();

    const stats = transactions.reduce(
      (acc, tx) => ({
        totalTransactions: acc.totalTransactions + 1,
        totalAmount: acc.totalAmount + tx.amount,
        totalPV: acc.totalPV + tx.pvEarned,
      }),
      { totalTransactions: 0, totalAmount: 0, totalPV: 0 }
    );

    return stats;
  } catch (error) {
    console.error('[PaymentService] Error getting transaction stats:', error);
    return { totalTransactions: 0, totalAmount: 0, totalPV: 0 };
  }
};
