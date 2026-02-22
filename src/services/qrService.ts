/**
 * QR Service — App-Backend Pairing
 * สแกน QR จากหน้าแอดมิน Thaiprompt เพื่อจับคู่แอพกับระบบหลังบ้าน
 * QR code contains API URL, API Key, device token for auto-configuration
 */

import { AppSettings } from '../types';
import * as storageService from './storageService';
import * as apiService from './apiService';

// ============================================================
//  Types
// ============================================================

export interface BackendPairingData {
  api_url: string;          // Backend API base URL
  api_key: string;          // API authentication key
  device_token: string;     // Unique device registration token
  org_name?: string;        // Organization name
  org_id?: string;          // Organization ID
  expires_at: string;       // QR expiration timestamp
  permissions?: string[];   // Granted permissions
}

export interface PairingResult {
  success: boolean;
  message: string;
  orgName?: string;
  connectedAt?: string;
}

// ============================================================
//  Decode QR Payload
// ============================================================

/**
 * Decode QR payload from Thaiprompt admin panel
 * Expected JSON format:
 * {
 *   "api_url": "https://yourdomain.com/api/v1",
 *   "api_key": "your-api-key-here",
 *   "device_token": "unique-device-token",
 *   "org_name": "My Organization",
 *   "org_id": "org_123",
 *   "expires_at": "2026-02-22T23:59:59Z",
 *   "permissions": ["nfc", "payment", "members"]
 * }
 */
export const decodeQRPayload = (rawData: string): BackendPairingData | null => {
  try {
    const trimmed = rawData.trim();

    // Try JSON parse
    const parsed = JSON.parse(trimmed);

    // Validate required fields
    if (!parsed.api_url || !parsed.api_key || !parsed.device_token) {
      console.error('[QRService] Missing required fields: api_url, api_key, or device_token');
      return null;
    }

    // Validate URL format
    if (!parsed.api_url.startsWith('http://') && !parsed.api_url.startsWith('https://')) {
      console.error('[QRService] Invalid API URL format');
      return null;
    }

    // Check expiration
    if (parsed.expires_at) {
      const expiresAt = new Date(parsed.expires_at);
      const now = new Date();
      if (now > expiresAt) {
        console.error('[QRService] QR Code has expired');
        return null;
      }
    }

    return {
      api_url: parsed.api_url,
      api_key: parsed.api_key,
      device_token: parsed.device_token,
      org_name: parsed.org_name || '',
      org_id: parsed.org_id || '',
      expires_at: parsed.expires_at || new Date(Date.now() + 3600000).toISOString(),
      permissions: parsed.permissions || ['nfc', 'payment', 'members'],
    };
  } catch (error) {
    console.error('[QRService] Error decoding QR payload:', error);
    return null;
  }
};

// ============================================================
//  Pair App with Backend
// ============================================================

/**
 * Complete app-backend pairing flow:
 * 1. Decode QR data
 * 2. Save API config to app settings
 * 3. Register device with backend
 * 4. Test connection
 */
export const pairWithBackend = async (qrData: BackendPairingData): Promise<PairingResult> => {
  try {
    // Step 1: Save API config to local settings
    await storageService.saveSettings({
      apiBaseUrl: qrData.api_url,
      apiKey: qrData.api_key,
    });

    // Save device token and org info
    await storageService.saveDevicePairing({
      deviceToken: qrData.device_token,
      orgName: qrData.org_name || '',
      orgId: qrData.org_id || '',
      pairedAt: new Date().toISOString(),
      permissions: qrData.permissions || [],
    });

    // Step 2: Re-initialize API client with new config
    await apiService.initApiClient();

    // Step 3: Register device with backend
    try {
      const result = await apiService.registerDevice(qrData.device_token);
      if (result.success) {
        return {
          success: true,
          message: result.message || 'เชื่อมต่อระบบหลังบ้านสำเร็จ',
          orgName: qrData.org_name,
          connectedAt: new Date().toISOString(),
        };
      }
    } catch (apiError) {
      // API call failed but config saved — still count as partial success
      console.warn('[QRService] Device registration API failed, but config saved:', apiError);
    }

    // Step 4: Test connection
    try {
      const testResult = await apiService.testConnection();
      if (testResult.connected) {
        return {
          success: true,
          message: `เชื่อมต่อกับ ${qrData.org_name || 'ระบบหลังบ้าน'} สำเร็จ (${testResult.latency}ms)`,
          orgName: qrData.org_name,
          connectedAt: new Date().toISOString(),
        };
      }
    } catch (testError) {
      console.warn('[QRService] Connection test failed:', testError);
    }

    // Config saved but couldn't confirm connection
    return {
      success: true,
      message: `บันทึกการตั้งค่าสำเร็จ — ${qrData.org_name || 'ระบบหลังบ้าน'} (รอเชื่อมต่อ)`,
      orgName: qrData.org_name,
      connectedAt: new Date().toISOString(),
    };
  } catch (error: any) {
    console.error('[QRService] Pairing failed:', error);
    return {
      success: false,
      message: error.message || 'การจับคู่ล้มเหลว',
    };
  }
};

// ============================================================
//  Check Pairing Status
// ============================================================

/**
 * Check if app is already paired with a backend
 */
export const getPairingStatus = async (): Promise<{
  isPaired: boolean;
  orgName?: string;
  pairedAt?: string;
  apiUrl?: string;
}> => {
  try {
    const pairing = await storageService.getDevicePairing();
    if (pairing && pairing.deviceToken) {
      const settings = await storageService.getSettings();
      return {
        isPaired: true,
        orgName: pairing.orgName,
        pairedAt: pairing.pairedAt,
        apiUrl: settings.apiBaseUrl,
      };
    }
    return { isPaired: false };
  } catch {
    return { isPaired: false };
  }
};

// ============================================================
//  Unpair / Reset
// ============================================================

/**
 * Unpair app from backend — reset API config
 */
export const unpairFromBackend = async (): Promise<void> => {
  await storageService.saveSettings({
    apiBaseUrl: 'https://api.thaiprompt.com/v1',
    apiKey: '',
  });
  await storageService.clearDevicePairing();
  await apiService.initApiClient();
};

// ============================================================
//  Demo QR Data
// ============================================================

/**
 * Generate demo QR data for testing the pairing flow
 */
export const generateDemoQRData = (): BackendPairingData => {
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 1); // Valid 1 hour

  return {
    api_url: 'https://api.thaiprompt.com/v1',
    api_key: `demo_key_${Math.random().toString(36).substr(2, 16)}`,
    device_token: `device_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`,
    org_name: 'Thaiprompt Demo',
    org_id: 'org_demo_001',
    expires_at: expiresAt.toISOString(),
    permissions: ['nfc', 'payment', 'members', 'cards'],
  };
};

/**
 * Generate QR payload string (for testing / admin panel)
 */
export const generateQRPayloadString = (data: BackendPairingData): string => {
  return JSON.stringify(data, null, 0);
};
