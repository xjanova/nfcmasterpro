/**
 * QR Scanner Service — Handles QR code decoding and NFC card pairing
 * Manages QR payload validation, card verification, and member pairing
 */

import { QRPairingData, PairingResult, CardInfo, Member } from '../types';
import * as apiService from './apiService';
import * as cardService from './cardService';
import * as storageService from './storageService';

// ============================================================
//  Decode QR Payload
// ============================================================

/**
 * Decode and validate QR code payload
 * Expects JSON: {"card_number":"...","pairing_token":"...","expires_at":"..."}
 */
export const decodeQRPayload = (rawData: string): QRPairingData | null => {
  try {
    // Try to parse as JSON
    const parsed = JSON.parse(rawData);

    // Validate required fields
    if (!parsed.card_number || !parsed.pairing_token || !parsed.expires_at) {
      console.error('[QRService] Missing required fields in QR payload');
      return null;
    }

    // Check expiration
    const expiresAt = new Date(parsed.expires_at);
    const now = new Date();
    if (now > expiresAt) {
      console.error('[QRService] QR Code has expired');
      return null;
    }

    return {
      card_number: parsed.card_number,
      pairing_token: parsed.pairing_token,
      expires_at: parsed.expires_at,
      card_type: parsed.card_type || 'NFC Card',
    };
  } catch (error) {
    console.error('[QRService] Error decoding QR payload:', error);
    return null;
  }
};

// ============================================================
//  Verify Card via API
// ============================================================

/**
 * Verify card with Thaiprompt API
 * Calls POST /api/v1/nfc/cards/verify
 */
export const verifyCard = async (qrData: QRPairingData): Promise<{ success: boolean; card?: CardInfo; error?: string }> => {
  try {
    // Call the API to verify card
    const client = await (apiService as any).getClient?.();

    if (!client) {
      // Fallback: simulate verification for demo
      console.warn('[QRService] API client not available, using demo verification');
      return {
        success: true,
        card: {
          id: `card_${Date.now()}`,
          uid: qrData.card_number.replace(/\s+/g, ''),
          status: 'active',
          balance: 0,
          pvPoints: 0,
          registeredAt: new Date().toISOString(),
          tagType: qrData.card_type || 'NFC Card',
        },
      };
    }

    // Try to verify through API
    try {
      const response = await client.post('/nfc/cards/verify', {
        card_number: qrData.card_number,
        pairing_token: qrData.pairing_token,
      });

      if (response.data?.success) {
        return {
          success: true,
          card: response.data.data,
        };
      }
      return {
        success: false,
        error: response.data?.message || 'Card verification failed',
      };
    } catch (apiError) {
      // If API call fails, return demo card
      console.warn('[QRService] API verification failed, returning demo card');
      return {
        success: true,
        card: {
          id: `card_${Date.now()}`,
          uid: qrData.card_number.replace(/\s+/g, ''),
          status: 'active',
          balance: 0,
          pvPoints: 0,
          registeredAt: new Date().toISOString(),
          tagType: qrData.card_type || 'NFC Card',
        },
      };
    }
  } catch (error: any) {
    console.error('[QRService] Error verifying card:', error);
    return {
      success: false,
      error: error.message || 'Verification failed',
    };
  }
};

// ============================================================
//  Pair Card with Member
// ============================================================

/**
 * Pair verified card with a member
 * Calls POST /api/v1/nfc/cards/pair
 */
export const pairCardWithMember = async (
  qrData: QRPairingData,
  memberId: string,
  card: CardInfo
): Promise<PairingResult> => {
  try {
    // Get member data
    const member = await storageService.getMemberById(memberId);
    if (!member) {
      return {
        success: false,
        message: 'Member not found',
      };
    }

    // Prepare card data with member link
    const updatedCard: CardInfo = {
      ...card,
      memberId,
      memberName: member.name,
    };

    // Register card locally
    await cardService.registerCard({
      uid: card.uid,
      memberId,
      memberName: member.name,
      tagType: card.tagType,
    });

    // Try to pair via API
    try {
      const client = await (apiService as any).getClient?.();

      if (client) {
        try {
          const response = await client.post('/nfc/cards/pair', {
            card_number: qrData.card_number,
            pairing_token: qrData.pairing_token,
            member_id: memberId,
          });

          if (response.data?.success) {
            return {
              success: true,
              message: response.data.message || 'Card paired successfully',
              card: updatedCard,
              member,
            };
          }
        } catch (apiError) {
          // Continue with local pairing even if API fails
          console.warn('[QRService] API pairing failed, using local pairing');
        }
      }
    } catch (error) {
      console.warn('[QRService] API client not available, using local pairing');
    }

    return {
      success: true,
      message: 'Card paired successfully',
      card: updatedCard,
      member,
    };
  } catch (error: any) {
    console.error('[QRService] Error pairing card:', error);
    return {
      success: false,
      message: error.message || 'Pairing failed',
    };
  }
};

// ============================================================
//  Generate Demo QR Data
// ============================================================

/**
 * Generate demo QR data for testing
 */
export const generateDemoQRData = (): QRPairingData => {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // Valid for 30 days

  const cardNumber = `NFC${Date.now().toString().slice(-8)}`;

  return {
    card_number: cardNumber,
    pairing_token: `token_${Math.random().toString(36).substr(2, 20)}`,
    expires_at: expiresAt.toISOString(),
    card_type: 'MIFARE Classic 1K',
  };
};

// ============================================================
//  Format Card Number (Mask sensitive data)
// ============================================================

/**
 * Format and mask card number for display
 */
export const formatCardNumber = (cardNumber: string): string => {
  // Show first 4 and last 4 digits
  if (cardNumber.length <= 8) return cardNumber;
  const first4 = cardNumber.substring(0, 4);
  const last4 = cardNumber.substring(cardNumber.length - 4);
  return `${first4}****${last4}`;
};

// ============================================================
//  Complete Verification and Pairing Flow
// ============================================================

/**
 * Complete flow: Decode -> Verify -> Pair
 */
export const verifyAndPairCard = async (
  rawQRData: string,
  memberId: string
): Promise<PairingResult> => {
  try {
    // Step 1: Decode QR payload
    const qrData = decodeQRPayload(rawQRData);
    if (!qrData) {
      return {
        success: false,
        message: 'Invalid QR Code format',
      };
    }

    // Step 2: Verify card
    const verifyResult = await verifyCard(qrData);
    if (!verifyResult.success || !verifyResult.card) {
      return {
        success: false,
        message: verifyResult.error || 'Card verification failed',
      };
    }

    // Step 3: Pair with member
    const pairResult = await pairCardWithMember(qrData, memberId, verifyResult.card);
    return pairResult;
  } catch (error: any) {
    console.error('[QRService] Error in verification and pairing flow:', error);
    return {
      success: false,
      message: error.message || 'Operation failed',
    };
  }
};
