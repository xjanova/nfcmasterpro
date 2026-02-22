// ========== NFC Types ==========

export interface NFCTag {
  id: string;          // UID as hex string, e.g. "A3:B2:C1:D0"
  techTypes: string[]; // e.g. ["NfcA", "MifareClassic", "Ndef"]
  atqa?: string;
  sak?: string;
  maxSize?: number;
  size?: number;
  isWritable?: boolean;
  type?: string;       // "MIFARE Classic 1K", "NFC Type 2 Tag", etc.
}

export interface NDEFRecord {
  tnf: number;         // Type Name Format
  type: string;        // Record type: "U" (URL), "T" (Text), etc.
  id: string;
  payload: number[];   // Raw payload bytes
  // Decoded fields
  recordType: 'url' | 'text' | 'vcard' | 'smartposter' | 'mime' | 'unknown';
  decodedData: string;
  language?: string;   // For text records
  payloadSize: number;
}

export interface NFCScanResult {
  id: string;
  timestamp: number;
  tag: NFCTag;
  ndefRecords: NDEFRecord[];
  rawHex?: string;
  operation: 'read' | 'write' | 'clone' | 'register';
  memberInfo?: TPMember;
  success: boolean;
  errorMessage?: string;
}

export interface WritePayload {
  type: 'url' | 'text' | 'vcard' | 'smartposter' | 'tp_member';
  url?: string;
  text?: string;
  language?: string;
  vcardData?: VCardData;
  memberData?: TPMember;
}

export interface VCardData {
  name: string;
  phone?: string;
  email?: string;
  organization?: string;
  url?: string;
}

export interface CloneOperation {
  sourceTag: NFCTag;
  sourceRecords: NDEFRecord[];
  sourceHex?: string;
  targetTag?: NFCTag;
  status: 'reading_source' | 'waiting_target' | 'writing' | 'done' | 'error';
}

// ========== Thaiprompt API Types ==========

export interface TPMember {
  memberId: string;     // e.g. "TH00123"
  name: string;
  phone?: string;
  email?: string;
  rank?: string;        // "BRONZE", "SILVER", "GOLD", "PLATINUM"
  affiliateCode?: string;
  referralCode?: string;
  affiliateUrl?: string;
  joinDate?: string;
  status?: string;
}

export interface TPApiConfig {
  baseUrl: string;
  apiKey: string;
  timeout?: number;
}

export interface TPRegistrationData {
  memberName: string;
  phone: string;
  email?: string;
  referralCode?: string;
  nfcUid: string;
  nfcTagType: string;
}

export interface TPRegistrationResult {
  success: boolean;
  member?: TPMember;
  error?: string;
  message?: string;
}

// ========== App Settings ==========

export interface AppSettings {
  apiBaseUrl: string;
  apiKey: string;
  nfcDefaultKey: string;
  hapticFeedback: boolean;
  autoSaveHistory: boolean;
  confirmBeforeWrite: boolean;
  historyLimit: number;
}

// ========== Navigation Types ==========

export type RootStackParamList = {
  MainTabs: undefined;
  ReadResult: { result: NFCScanResult };
  WriteSetup: { prefillMember?: TPMember };
  WriteResult: { success: boolean; tag: NFCTag };
  CloneDetail: { operation: CloneOperation };
  HexView: { result: NFCScanResult };
  MemberLookup: undefined;
  MemberRegister: { nfcUid?: string; tagType?: string };
  SettingsApiConfig: undefined;
  SettingsNFCKey: undefined;
};

export type BottomTabParamList = {
  Home: undefined;
  Read: undefined;
  Write: undefined;
  History: undefined;
  Settings: undefined;
};
