/**
 * Card Service — Manages NFC card data and storage
 * Handles card registration, status updates, balance management, and transactions
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CardInfo, CardStatus, Transaction } from '../types';
import { STORAGE_KEYS, CARD_STATUS } from '../utils/constants';

// ============================================================
//  Helpers
// ============================================================

/**
 * Generate unique ID with timestamp and random component
 */
const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// ============================================================
//  Card Storage
// ============================================================

/**
 * Get all cards from storage
 */
export const getCards = async (): Promise<CardInfo[]> => {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEYS.CARDS);
    if (!json) return [];
    return JSON.parse(json);
  } catch (error) {
    console.error('[CardService] Error getting cards:', error);
    return [];
  }
};

/**
 * Save cards to storage
 */
const saveCards = async (cards: CardInfo[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.CARDS, JSON.stringify(cards));
  } catch (error) {
    console.error('[CardService] Error saving cards:', error);
    throw new Error('บันทึกการ์ดไม่สำเร็จ');
  }
};

// ============================================================
//  Card Lookup
// ============================================================

/**
 * Get card by NFC UID
 */
export const getCardByUID = async (uid: string): Promise<CardInfo | null> => {
  try {
    const cards = await getCards();
    return cards.find(c => c.uid === uid) || null;
  } catch (error) {
    console.error('[CardService] Error getting card by UID:', error);
    return null;
  }
};

// ============================================================
//  Card Registration
// ============================================================

/**
 * Register a new card
 * Creates card with active status and 0 balance
 */
export const registerCard = async (data: {
  uid: string;
  memberId?: string;
  memberName?: string;
  tagType?: string;
}): Promise<CardInfo> => {
  try {
    // Check for duplicate
    const existing = await getCardByUID(data.uid);
    if (existing) {
      throw new Error('การ์ดนี้ถูกลงทะเบียนแล้ว');
    }

    const cards = await getCards();
    const newCard: CardInfo = {
      id: generateId(),
      uid: data.uid,
      memberId: data.memberId,
      memberName: data.memberName,
      status: CARD_STATUS.ACTIVE as CardStatus,
      balance: 0,
      pvPoints: 0,
      registeredAt: new Date().toISOString(),
      tagType: data.tagType,
    };

    cards.push(newCard);
    await saveCards(cards);
    return newCard;
  } catch (error) {
    console.error('[CardService] Error registering card:', error);
    throw error instanceof Error ? error : new Error('ลงทะเบียนการ์ดไม่สำเร็จ');
  }
};

// ============================================================
//  Card Status Management
// ============================================================

/**
 * Update card status (active, disabled, lost)
 */
export const updateCardStatus = async (
  uid: string,
  status: CardStatus
): Promise<CardInfo> => {
  try {
    const cards = await getCards();
    const cardIndex = cards.findIndex(c => c.uid === uid);

    if (cardIndex === -1) {
      throw new Error('ไม่พบการ์ด');
    }

    cards[cardIndex].status = status;
    await saveCards(cards);
    return cards[cardIndex];
  } catch (error) {
    console.error('[CardService] Error updating card status:', error);
    throw error instanceof Error ? error : new Error('อัพเดตสถานะการ์ดไม่สำเร็จ');
  }
};

// ============================================================
//  Balance Management
// ============================================================

/**
 * Add balance to card (admin top-up)
 * Creates transaction record
 */
export const addBalance = async (
  uid: string,
  amount: number
): Promise<{ card: CardInfo; transaction: Transaction }> => {
  try {
    if (amount <= 0) {
      throw new Error('จำนวนเงินต้องมากกว่า 0');
    }

    const cards = await getCards();
    const cardIndex = cards.findIndex(c => c.uid === uid);

    if (cardIndex === -1) {
      throw new Error('ไม่พบการ์ด');
    }

    const card = cards[cardIndex];
    const balanceBefore = card.balance;
    card.balance += amount;
    card.lastUsed = new Date().toISOString();

    const transaction: Transaction = {
      id: generateId(),
      cardUID: uid,
      memberName: card.memberName,
      memberId: card.memberId,
      type: 'topup',
      amount,
      pvEarned: 0,
      balanceBefore,
      balanceAfter: card.balance,
      timestamp: new Date().toISOString(),
      note: 'เติมเงินจากแอดมิน',
    };

    await saveCards(cards);
    return { card, transaction };
  } catch (error) {
    console.error('[CardService] Error adding balance:', error);
    throw error instanceof Error ? error : new Error('เติมเงินไม่สำเร็จ');
  }
};

/**
 * Deduct balance from card (payment)
 * Creates transaction record and calculates PV points
 */
export const deductBalance = async (
  uid: string,
  amount: number
): Promise<{ card: CardInfo; transaction: Transaction }> => {
  try {
    if (amount <= 0) {
      throw new Error('จำนวนเงินต้องมากกว่า 0');
    }

    const cards = await getCards();
    const cardIndex = cards.findIndex(c => c.uid === uid);

    if (cardIndex === -1) {
      throw new Error('ไม่พบการ์ด');
    }

    const card = cards[cardIndex];

    if (card.status !== CARD_STATUS.ACTIVE) {
      throw new Error('การ์ดไม่อยู่ในสถานะใช้งาน');
    }

    if (card.balance < amount) {
      throw new Error('ยอดเงินในการ์ดไม่เพียงพอ');
    }

    const balanceBefore = card.balance;
    const pvEarned = Math.floor(amount * 0.1); // 10% PV rate

    card.balance -= amount;
    card.pvPoints += pvEarned;
    card.lastUsed = new Date().toISOString();

    const transaction: Transaction = {
      id: generateId(),
      cardUID: uid,
      memberName: card.memberName,
      memberId: card.memberId,
      type: 'payment',
      amount,
      pvEarned,
      balanceBefore,
      balanceAfter: card.balance,
      timestamp: new Date().toISOString(),
    };

    await saveCards(cards);
    return { card, transaction };
  } catch (error) {
    console.error('[CardService] Error deducting balance:', error);
    throw error instanceof Error ? error : new Error('หักเงินไม่สำเร็จ');
  }
};

// ============================================================
//  Transaction History
// ============================================================

/**
 * Get all transactions for a card
 */
export const getCardTransactions = async (uid: string): Promise<Transaction[]> => {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (!json) return [];

    const allTransactions: Transaction[] = JSON.parse(json);
    return allTransactions
      .filter(t => t.cardUID === uid)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch (error) {
    console.error('[CardService] Error getting card transactions:', error);
    return [];
  }
};

// ============================================================
//  Card Deletion
// ============================================================

/**
 * Delete a card from storage
 */
export const deleteCard = async (uid: string): Promise<void> => {
  try {
    const cards = await getCards();
    const filtered = cards.filter(c => c.uid !== uid);
    await saveCards(filtered);
  } catch (error) {
    console.error('[CardService] Error deleting card:', error);
    throw new Error('ลบการ์ดไม่สำเร็จ');
  }
};
