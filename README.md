# 📡 NFC Master Pro v2.0

**ระบบจัดการบัตร NFC ระดับ Production สำหรับองค์กร — Produced by xman studio**
Built with React Native · Integrated with Thaiprompt-Affiliate API · Bilingual Thai/English

---

## ✨ Features

### Core NFC
| Feature | Description |
|---|---|
| 📡 **Read NDEF** | อ่าน URL, Text, vCard, Smart Poster จากการ์ด NFC |
| ✏️ **Write NDEF** | เขียนข้อมูล NDEF หลายรูปแบบ รวมถึง TP Member |
| 🔄 **Clone Card** | คัดลอก NDEF จากการ์ดหนึ่งไปยังอีกการ์ด |
| 🔢 **Hex Viewer** | แสดง Raw Hex, UID, ATQA, SAK, ASCII dump |

### Card Management (v2.0)
| Feature | Description |
|---|---|
| 💳 **Card Registry** | ลงทะเบียน/จัดการบัตร NFC ทั้งหมด (active/disabled/lost) |
| 👤 **Member System** | ระบบสมาชิกพร้อมรูปถ่าย, จับคู่บัตร, โปรไฟล์ |
| 💰 **Payment Test** | โหมดทดสอบการชำระ — แตะบัตร, แสดงยอด, แต้ม PV |
| 📇 **Digital Business Card** | นามบัตรดิจิตอลพร้อม QR Code + แชร์ |
| 📱 **QR Scanner** | สแกน QR เพื่อจับคู่บัตร NFC กับ Thaiprompt |
| 🔔 **Notifications** | แจ้งเตือนยอดต่ำ, ลงทะเบียนบัตร, ชำระเงิน |
| 🌐 **Bilingual** | รองรับไทย/English สลับได้ตลอดเวลา |

---

## 🛠️ Tech Stack

```
React Native 0.73.6
react-native-nfc-manager       ← NFC core
@react-navigation/native       ← Stack + Bottom Tab navigation
@react-navigation/bottom-tabs  ← 5-tab main interface
@react-native-async-storage    ← Local data cache
axios                          ← Thaiprompt API client
react-native-image-picker      ← Camera/gallery for member photos
react-native-qrcode-svg        ← QR code generation
react-native-svg               ← SVG support for card visuals
react-native-share             ← Share business cards
react-native-haptic-feedback   ← Vibration feedback
react-native-toast-message     ← Toast notifications
react-native-paper             ← UI components
react-native-vector-icons      ← Icon library
```

---

## 📁 Project Structure

```
src/
├── components/
│   ├── GradientCard.tsx          ← Premium gradient card container
│   ├── NFCCardVisual.tsx         ← Visual NFC card component
│   ├── MemberAvatar.tsx          ← Photo avatar with fallback
│   ├── StatusBadge.tsx           ← Active/Disabled/Lost badges
│   ├── BalanceDisplay.tsx        ← Animated balance counter
│   ├── BusinessCard.tsx          ← Digital business card template
│   ├── NotificationBadge.tsx     ← Bell icon with count
│   ├── EmptyState.tsx            ← Empty state placeholders
│   ├── SplashLogo.tsx            ← xman studio animated logo
│   ├── LanguageToggle.tsx        ← Thai/English switch
│   └── index.ts                  ← Barrel exports
├── screens/
│   ├── SplashScreen.tsx          ← xman studio splash
│   ├── DashboardScreen.tsx       ← Stats + Quick Actions
│   ├── CardsScreen.tsx           ← Card management list
│   ├── CardDetailScreen.tsx      ← Card detail + balance
│   ├── MembersScreen.tsx         ← Member management list
│   ├── MemberDetailScreen.tsx    ← Member profile + cards
│   ├── MemberRegisterScreen.tsx  ← 5-step registration wizard
│   ├── PaymentScreen.tsx         ← Payment test mode
│   ├── PaymentResultScreen.tsx   ← Transaction receipt
│   ├── TransactionHistoryScreen.tsx ← History + filters
│   ├── DigitalBusinessCardScreen.tsx ← Business card + share
│   ├── QRScannerScreen.tsx       ← QR scan + NFC pairing
│   ├── NotificationsScreen.tsx   ← Notification center
│   ├── ReadNFCScreen.tsx         ← Read NFC tags
│   ├── WriteNFCScreen.tsx        ← Write NFC tags
│   ├── CloneNFCScreen.tsx        ← Clone NFC tags
│   ├── HexViewScreen.tsx         ← Raw hex dump
│   └── SettingsScreen.tsx        ← Config + About
├── services/
│   ├── nfcService.ts             ← NFC read/write/clone/hex
│   ├── apiService.ts             ← Thaiprompt API client
│   ├── storageService.ts         ← AsyncStorage cache layer
│   ├── cardService.ts            ← Card CRUD + balance ops
│   ├── paymentService.ts         ← Payment processing + PV
│   ├── businessCardService.ts    ← Business card generation
│   ├── notificationService.ts    ← In-app notifications
│   └── qrService.ts              ← QR decode + card pairing
├── navigation/
│   └── AppNavigator.tsx          ← Tab + Stack + Modal navigation
├── context/
│   └── LanguageContext.tsx        ← Language provider
├── utils/
│   ├── theme.ts                  ← Colors, typography, spacing
│   ├── hexUtils.ts               ← Hex/NDEF parsing
│   ├── i18n.ts                   ← Bilingual Thai/English strings
│   └── constants.ts              ← App constants + branding
└── types/
    └── index.ts                  ← TypeScript interfaces
```

---

## 📱 Navigation Structure

```
AppNavigator (Stack)
├── SplashScreen (xman studio logo)
├── MainTabs (BottomTab)
│   ├── 🏠 Dashboard    — Stats + Quick Actions
│   ├── 💳 Cards        — Card Management
│   ├── 👤 Members      — Member Management
│   ├── 💰 Payment      — Payment Test Mode
│   └── ⚙️ Settings     — Config + About
└── Modal Stacks
    ├── CardDetail, MemberDetail, MemberRegister
    ├── DigitalBusinessCard, PaymentResult, TransactionHistory
    ├── QRScanner, ReadNFC, WriteNFC, CloneNFC
    ├── HexView, Notifications
    └── (all with slide-from-bottom presentation)
```

---

## 🚀 Setup

```bash
# 1. Install dependencies
npm install --legacy-peer-deps

# 2. Android: clean + build
cd android && ./gradlew clean && cd ..

# 3. Required permissions in AndroidManifest.xml:
#    <uses-permission android:name="android.permission.NFC" />
#    <uses-permission android:name="android.permission.CAMERA" />
#    <uses-feature android:name="android.hardware.nfc" android:required="true" />

# 4. Run on Android device (NFC requires real device)
npx react-native run-android
```

---

## 🔗 Thaiprompt API Integration

### การตั้งค่า

ไปที่ **Settings** → กรอก:
- **API URL**: `https://api.thaiprompt.com/v1`
- **API Key**: API key จาก Thaiprompt backend

### NFC Card API Endpoints

```
POST /api/v1/nfc/cards/verify        ← ตรวจสอบบัตร NFC
GET  /api/v1/nfc/cards               ← รายการบัตรทั้งหมด
GET  /api/v1/nfc/cards/{id}/balance  ← ยอดเงินในบัตร
GET  /api/v1/nfc/cards/{id}/transactions ← ประวัติธุรกรรม
POST /api/v1/nfc/cards/payment       ← ชำระเงินผ่านบัตร
```

### QR Pairing API Endpoints (NEW in v2.0)

```
POST /api/v1/nfc/pairing/generate       ← สร้าง QR token สำหรับจับคู่บัตร
POST /api/v1/nfc/pairing/verify         ← ตรวจสอบ QR token
POST /api/v1/nfc/pairing/pair           ← จับคู่บัตรกับสมาชิก
GET  /api/v1/nfc/pairing/available-cards ← บัตรที่ยังไม่จับคู่
```

### Member API Endpoints

```
GET  /members/nfc/:uid              ← ค้นหาสมาชิกจาก NFC UID
GET  /members/:id                   ← ดึงข้อมูลสมาชิก
GET  /members/search?q=...          ← ค้นหาสมาชิก
POST /members/register/nfc          ← ลงทะเบียนสมาชิกผ่าน NFC
```

---

## 🎨 Design System

Premium dark theme with glassmorphism effects:

| Token | Value | Usage |
|---|---|---|
| `bg` | `#0A0A0F` | Main background |
| `surface` | `#12121A` | Elevated surfaces |
| `card` | `#1A1A2E` | Card backgrounds |
| `border` | `#2A2A3E` | Borders |
| `primary` | `#6366F1` | Primary actions (Indigo) |
| `secondary` | `#818CF8` | Secondary elements |
| `success` | `#22C55E` | Success states (Green) |
| `warning` | `#F59E0B` | Warnings (Amber) |
| `error` | `#EF4444` | Error states (Red) |
| `gold` | `#F59E0B` | Premium accents |

---

## 📋 Supported NFC Tag Types

| Type | Read | Write | Clone | Hex |
|---|---|---|---|---|
| MIFARE Classic 1K/4K | ✅ | ✅ | ⚠️* | ✅ |
| MIFARE Ultralight (NTAG213/215/216) | ✅ | ✅ | ✅ | ✅ |
| NFC Type 4 (ISO-DEP) | ✅ | ✅ | ✅ | ✅ |
| NFC-A/B/F/V | ✅ (read only) | ❌ | ❌ | ✅ |

*MIFARE Classic clone ต้องใช้ key ที่ถูกต้อง

---

## 🔨 CI/CD

### Debug Build (Auto)
Triggers on every push to `main`. Produces debug APK.

### Release Build (Manual)
1. Go to **Actions** → **🚀 Auto Release APK**
2. Click **Run workflow** → enter version (e.g., `2.0.1`)
3. Wait ~10-15 min for signed APK at [Releases](https://github.com/xjanova/nfcmasterpro/releases)

### Axios Metro Fix
Release builds include an automatic patch for axios's Node.js entry point:
```bash
node -e "const p=require('./node_modules/axios/package.json'); delete p.exports; p.main='index.js'; require('fs').writeFileSync('./node_modules/axios/package.json', JSON.stringify(p,null,2));"
```

---

## 📝 Changelog

### v2.0.0 — Production Redesign
- Complete UI redesign with premium dark theme
- 5-tab navigation: Dashboard, Cards, Members, Payment, Settings
- Card management system (register, enable/disable, balance)
- Member management with photos and profiles
- Digital business cards with QR code + sharing
- Payment test mode (tap-to-pay, PV points)
- QR scanner for NFC card pairing with Thaiprompt
- In-app notification system
- Bilingual Thai/English support
- xman studio branding + splash screen

### v2.0.1 — Crash Fix
- Fixed app crash on launch (SplashScreen navigation)
- Fixed LanguageProvider loading state
- Fixed useLanguage import paths
- Hardcoded APP_VERSION for reliability

### v1.0.0 — Initial Release
- NFC Read/Write/Clone/Hex Viewer
- Scan history
- Thaiprompt member registration
- Settings with API configuration

---

## 📄 License

Produced by **xman studio** · © 2025-2026
