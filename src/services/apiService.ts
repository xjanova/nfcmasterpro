/**
 * Thaiprompt Affiliate API Service
 * เชื่อมต่อกับ Laravel API ของโปรเจค Thaiprompt-Affiliate
 */
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { TPMember, TPRegistrationData, TPRegistrationResult, AppSettings, Member, MemberFormData, CardInfo } from '../types';
import { getSettings } from './storageService';

let apiClient: AxiosInstance | null = null;

// ============================================================
//  Init API Client
// ============================================================

export const initApiClient = async (): Promise<void> => {
  const settings = await getSettings();
  apiClient = axios.create({
    baseURL: settings.apiBaseUrl || 'https://api.thaiprompt.com/v1',
    timeout: settings.timeout || 10000,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Api-Key': settings.apiKey || '',
      'User-Agent': 'NFCMasterPro/1.0 Android',
    },
  });

  // Request interceptor
  apiClient.interceptors.request.use(
    config => {
      console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
      return config;
    },
    error => Promise.reject(error)
  );

  // Response interceptor
  apiClient.interceptors.response.use(
    response => response,
    error => {
      const msg = error.response?.data?.message || error.message || 'เกิดข้อผิดพลาด';
      console.error('[API Error]', msg);
      return Promise.reject(new Error(msg));
    }
  );
};

const getClient = async (): Promise<AxiosInstance> => {
  if (!apiClient) await initApiClient();
  return apiClient!;
};

// ============================================================
//  Test Connection
// ============================================================

export const testConnection = async (): Promise<{ connected: boolean; latency?: number; error?: string }> => {
  const start = Date.now();
  try {
    const client = await getClient();
    await client.get('/ping');
    return { connected: true, latency: Date.now() - start };
  } catch (err: any) {
    return { connected: false, error: err.message };
  }
};

// ============================================================
//  Member Lookup by NFC UID
// ============================================================

export const getMemberByNFCUid = async (nfcUid: string): Promise<TPMember | null> => {
  try {
    const client = await getClient();
    const response: AxiosResponse<{ data: TPMember }> = await client.get(
      `/members/nfc/${encodeURIComponent(nfcUid.replace(/:/g, ''))}`
    );
    return response.data.data;
  } catch {
    return null;
  }
};

// ============================================================
//  Member Lookup by ID
// ============================================================

export const getMemberById = async (memberId: string): Promise<TPMember | null> => {
  try {
    const client = await getClient();
    const response: AxiosResponse<{ data: TPMember }> = await client.get(
      `/members/${encodeURIComponent(memberId)}`
    );
    return response.data.data;
  } catch {
    return null;
  }
};

// ============================================================
//  Search Members
// ============================================================

export const searchMembers = async (query: string): Promise<TPMember[]> => {
  try {
    const client = await getClient();
    const response: AxiosResponse<{ data: TPMember[] }> = await client.get('/members/search', {
      params: { q: query, limit: 20 },
    });
    return response.data.data || [];
  } catch {
    return [];
  }
};

// ============================================================
//  Register New Member via NFC
// ============================================================

export const registerMemberViaNFC = async (data: TPRegistrationData): Promise<TPRegistrationResult> => {
  try {
    const client = await getClient();
    const response: AxiosResponse<{ success: boolean; data: TPMember; message: string }> = await client.post(
      '/members/register/nfc',
      {
        name: data.memberName,
        phone: data.phone,
        email: data.email,
        referral_code: data.referralCode,
        nfc_uid: data.nfcUid.replace(/:/g, '').toLowerCase(),
        nfc_tag_type: data.nfcTagType,
        registration_source: 'nfc_app',
      }
    );

    return {
      success: true,
      member: response.data.data,
      message: response.data.message || 'ลงทะเบียนสำเร็จ',
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'ลงทะเบียนไม่สำเร็จ',
    };
  }
};

// ============================================================
//  Link NFC Card to Existing Member
// ============================================================

export const linkNFCToMember = async (memberId: string, nfcUid: string, tagType: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const client = await getClient();
    await client.post(`/members/${encodeURIComponent(memberId)}/nfc`, {
      nfc_uid: nfcUid.replace(/:/g, '').toLowerCase(),
      nfc_tag_type: tagType,
    });
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
};

// ============================================================
//  Get Affiliate URL for Member
// ============================================================

export const getAffiliateUrl = (member: TPMember): string => {
  if (member.affiliateUrl) return member.affiliateUrl;
  const refCode = member.affiliateCode || member.referralCode || member.memberId;
  return `https://thaiprompt.com/affiliate?ref=${refCode}`;
};

// ============================================================
//  Update API Settings
// ============================================================

export const updateApiConfig = async (baseUrl: string, apiKey: string): Promise<void> => {
  apiClient = null; // Reset to reinitialize
  await initApiClient();
};

// ============================================================
//  Register Device (QR Pairing)
// ============================================================

export const registerDevice = async (deviceToken: string): Promise<{ success: boolean; message?: string }> => {
  try {
    const client = await getClient();
    const response = await client.post('/nfc/devices/register', {
      device_token: deviceToken,
      app_version: '2.0.1',
      platform: 'android',
      app_name: 'NFCMasterPro',
    });
    return {
      success: true,
      message: response.data?.message || 'Device registered',
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Device registration failed',
    };
  }
};

// ============================================================
//  Member API Endpoints
// ============================================================

/**
 * Get all members from API
 */
export const getMembers = async (): Promise<Member[]> => {
  try {
    const client = await getClient();
    const response: AxiosResponse<{ data: Member[] }> = await client.get('/members');
    return response.data.data || [];
  } catch (error) {
    console.error('[API] Error fetching members:', error);
    return [];
  }
};

/**
 * Get full member profile by ID from API
 */
export const getMemberProfileById = async (id: string): Promise<Member | null> => {
  try {
    const client = await getClient();
    const response: AxiosResponse<{ data: Member }> = await client.get(
      `/members/${encodeURIComponent(id)}`
    );
    return response.data.data;
  } catch (error) {
    console.error('[API] Error fetching member:', error);
    return null;
  }
};

/**
 * Create new member via API
 */
export const createMember = async (data: MemberFormData): Promise<Member> => {
  try {
    const client = await getClient();
    const response: AxiosResponse<{ data: Member }> = await client.post('/members', {
      name: data.name,
      phone: data.phone,
      email: data.email,
      position: data.position,
      company: data.company,
      photo: data.photo,
    });
    return response.data.data;
  } catch (error: any) {
    console.error('[API] Error creating member:', error);
    throw new Error(
      error.response?.data?.message || 'สร้างสมาชิกไม่สำเร็จ'
    );
  }
};

/**
 * Update member via API
 */
export const updateMember = async (
  id: string,
  data: Partial<Member>
): Promise<Member> => {
  try {
    const client = await getClient();
    const response: AxiosResponse<{ data: Member }> = await client.put(
      `/members/${encodeURIComponent(id)}`,
      data
    );
    return response.data.data;
  } catch (error: any) {
    console.error('[API] Error updating member:', error);
    throw new Error(
      error.response?.data?.message || 'อัพเดตสมาชิกไม่สำเร็จ'
    );
  }
};

/**
 * Get cards for a specific member
 */
export const getCardsByMember = async (memberId: string): Promise<CardInfo[]> => {
  try {
    const client = await getClient();
    const response: AxiosResponse<{ data: CardInfo[] }> = await client.get(
      `/members/${encodeURIComponent(memberId)}/cards`
    );
    return response.data.data || [];
  } catch (error) {
    console.error('[API] Error fetching member cards:', error);
    return [];
  }
};
