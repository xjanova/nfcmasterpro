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

// ========== Card Management Types ==========

export type CardStatus = 'active' | 'disabled' | 'lost';

export interface CardInfo {
  id: string;
  uid: string;
  memberId?: string;
  memberName?: string;
  status: CardStatus;
  balance: number;
  pvPoints: number;
  registeredAt: string;
  lastUsed?: string;
  tagType?: string;
  notes?: string;
}

// ========== Member Management Types ==========

export interface Member {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  position?: string;
  company?: string;
  photo?: string;           // base64 encoded image
  rank?: string;            // BRONZE, SILVER, GOLD, PLATINUM
  affiliateCode?: string;
  affiliateUrl?: string;
  joinDate: string;
  cards: string[];          // array of card UIDs
  totalBalance?: number;
  totalTransactions?: number;
}

export interface BusinessCardData {
  memberId: string;
  name: string;
  position?: string;
  company?: string;
  phone?: string;
  email?: string;
  photo?: string;
  qrData: string;
  style: 'dark' | 'light' | 'gradient';
}

// ========== Payment & Transaction Types ==========

export type TransactionType = 'payment' | 'topup' | 'refund' | 'adjustment';

export interface Transaction {
  id: string;
  cardUID: string;
  memberName?: string;
  memberId?: string;
  type: TransactionType;
  amount: number;
  pvEarned: number;
  balanceBefore: number;
  balanceAfter: number;
  timestamp: string;
  note?: string;
}

// ========== Notification Types ==========

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  data?: any;
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
  language: 'th' | 'en';
  pvRate: number;
  lowBalanceThreshold: number;
  currency: string;
  notificationsEnabled?: boolean;
}

// ========== API Response Types ==========

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  code?: string;
}

export interface PaginatedResponse<T = any> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// ========== Navigation Types ==========

export type RootStackParamList = {
  Splash: undefined;
  MainTabs: undefined;
  CardDetail: { cardUID: string };
  MemberDetail: { memberId: string };
  MemberRegister: { existingMember?: Member };
  DigitalBusinessCard: { member: Member };
  PaymentResult: { transaction: Transaction };
  TransactionHistory: { cardUID?: string };
  ReadNFC: undefined;
  WriteNFC: undefined;
  CloneNFC: undefined;
  HexView: { data?: string };
  Notifications: undefined;
};

export type BottomTabParamList = {
  Dashboard: undefined;
  Cards: undefined;
  Members: undefined;
  Payment: undefined;
  Settings: undefined;
};

// ========== Form Data Types ==========

export interface CardFormData {
  memberId?: string;
  notes?: string;
}

export interface MemberFormData {
  name: string;
  phone?: string;
  email?: string;
  position?: string;
  company?: string;
  photo?: string;
}

export interface PaymentFormData {
  cardUID: string;
  amount: number;
  note?: string;
}

export interface TransactionFilterOptions {
  cardUID?: string;
  type?: TransactionType;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

// ========== UI State Types ==========

export interface LoadingState {
  isLoading: boolean;
  error?: string;
}

export interface ModalState {
  visible: boolean;
  title?: string;
  message?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

// ========== Analytics Types ==========

export interface DashboardStats {
  totalCards: number;
  activeCards: number;
  totalMembers: number;
  totalBalance: number;
  totalTransactions: number;
  pvPointsIssued: number;
  activeMembers: number;
  pendingTransactions: number;
}

// ========== Export all types ==========
export type {
  Language,
  LanguageContextType,
} from '../utils/i18n';
