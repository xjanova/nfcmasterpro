// App Information
export const APP_NAME = 'NFC Master Pro';
export const APP_VERSION = '2.0.3';
export const STUDIO_NAME = 'xman studio';
export const STUDIO_LICENSE = `Produced by ${STUDIO_NAME}`;
export const COPYRIGHT_YEAR = new Date().getFullYear();

// Business Rules
export const PV_RATE = 0.1; // 10% PV points per transaction
export const LOW_BALANCE_THRESHOLD = 100;
export const DEFAULT_CURRENCY = '฿';
export const MAX_HISTORY = 500;

// Card Status
export const CARD_STATUS = {
  ACTIVE: 'active',
  DISABLED: 'disabled',
  LOST: 'lost',
} as const;

// Notification Types
export const NOTIFICATION_TYPES = {
  LOW_BALANCE: 'low_balance',
  CARD_REGISTERED: 'card_registered',
  CARD_STATUS_CHANGE: 'card_status_change',
  PAYMENT: 'payment',
  MEMBER_REGISTERED: 'member_registered',
} as const;

// Storage Keys
export const STORAGE_KEYS = {
  SETTINGS: '@nfc_settings',
  CARDS: '@nfc_cards',
  MEMBERS: '@nfc_members',
  TRANSACTIONS: '@nfc_transactions',
  NOTIFICATIONS: '@nfc_notifications',
  LANGUAGE: '@nfc_language',
  API_CONFIG: '@nfc_api_config',
  LAST_SYNC: '@nfc_last_sync',
} as const;

// API Endpoints (relative to baseUrl)
export const API_ENDPOINTS = {
  MEMBERS: '/api/members',
  MEMBER_DETAIL: (id: string) => `/api/members/${id}`,
  MEMBER_REGISTER: '/api/members/register',
  CARD_REGISTER: '/api/cards/register',
  CARD_DETAIL: (uid: string) => `/api/cards/${uid}`,
  TRANSACTION_CREATE: '/api/transactions',
  TRANSACTION_HISTORY: (cardUID: string) => `/api/transactions/card/${cardUID}`,
  BALANCE_UPDATE: (cardUID: string) => `/api/cards/${cardUID}/balance`,
  BUSINESS_CARD_GENERATE: '/api/business-card/generate',
} as const;

// NFC Configuration
export const NFC_CONFIG = {
  DEFAULT_MESSAGE_TYPE: 'ndef',
  TECH_FILTER_A: ['NfcA', 'MifareClassic'],
  TECH_FILTER_B: ['NfcB'],
  TAG_TYPE_MIFARE_CLASSIC: 'MIFARE Classic 1K',
  TAG_TYPE_NFC_TYPE_2: 'NFC Type 2 Tag',
  ISO_DEP_TIMEOUT: 2000,
} as const;

// UI Configuration
export const UI_CONFIG = {
  TOAST_DURATION: 3000,
  ANIMATION_DURATION: 300,
  HAPTIC_FEEDBACK: {
    LIGHT: 'impactLight',
    MEDIUM: 'impactMedium',
    HEAVY: 'impactHeavy',
    SELECTION: 'selection',
  },
} as const;

// Validation Rules
export const VALIDATION_RULES = {
  PHONE_LENGTH_MIN: 9,
  PHONE_LENGTH_MAX: 15,
  NAME_LENGTH_MIN: 2,
  NAME_LENGTH_MAX: 100,
  COMPANY_LENGTH_MAX: 100,
  POSITION_LENGTH_MAX: 50,
  NOTE_LENGTH_MAX: 500,
  AMOUNT_MIN: 1,
  AMOUNT_MAX: 999999,
} as const;

// Member Ranks
export const MEMBER_RANKS = {
  BRONZE: 'BRONZE',
  SILVER: 'SILVER',
  GOLD: 'GOLD',
  PLATINUM: 'PLATINUM',
} as const;

// Transaction Types
export const TRANSACTION_TYPES = {
  PAYMENT: 'payment',
  TOPUP: 'topup',
  REFUND: 'refund',
  ADJUSTMENT: 'adjustment',
} as const;

// Date & Time Formats
export const DATE_FORMATS = {
  DISPLAY: 'DD/MM/YYYY',
  DISPLAY_WITH_TIME: 'DD/MM/YYYY HH:mm',
  ISO: "YYYY-MM-DD'T'HH:mm:ss.SSSZ",
} as const;

// Error Messages (Keys for i18n)
export const ERROR_KEYS = {
  NETWORK_ERROR: 'error.network',
  VALIDATION_ERROR: 'error.validation',
  NFC_NOT_AVAILABLE: 'error.nfcNotAvailable',
  TAG_NOT_WRITABLE: 'error.tagNotWritable',
  WRITE_FAILED: 'error.writeFailed',
  READ_FAILED: 'error.readFailed',
  AUTHENTICATION_FAILED: 'error.authenticationFailed',
  INSUFFICIENT_BALANCE: 'error.insufficientBalance',
  DUPLICATE_CARD: 'error.duplicateCard',
  MEMBER_NOT_FOUND: 'error.memberNotFound',
  INVALID_DATA: 'error.invalidData',
} as const;

// Success Messages (Keys for i18n)
export const SUCCESS_KEYS = {
  OPERATION_SUCCESS: 'success.operationSuccess',
  CARD_REGISTERED: 'success.cardRegistered',
  MEMBER_REGISTERED: 'success.memberRegistered',
  PAYMENT_SUCCESS: 'success.paymentSuccess',
  BALANCE_UPDATED: 'success.balanceUpdated',
  CARD_UPDATED: 'success.cardUpdated',
  DATA_SAVED: 'success.dataSaved',
} as const;
