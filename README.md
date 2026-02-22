# 📡 NFC Master Pro

**แอพอ่าน/เขียน NFC Card ครบเครื่อง สำหรับ Android**
Built with React Native · Integrated with Thaiprompt-Affiliate API

---

## ✨ Features

| Feature | Description |
|---|---|
| 📡 **Read NDEF** | อ่าน URL, Text, vCard, Smart Poster จากการ์ด NFC |
| ✏️ **Write NDEF** | เขียนข้อมูล NDEF หลายรูปแบบ รวมถึง TP Member |
| 🔄 **Clone Card** | คัดลอก NDEF จากการ์ดหนึ่งไปยังอีกการ์ด |
| 🔢 **Hex Viewer** | แสดง Raw Hex, UID, ATQA, SAK, ASCII dump |
| 📋 **Scan History** | บันทึกประวัติทุกการอ่าน/เขียน/โคลน |
| 🏢 **TP Integration** | ลงทะเบียนสมาชิก Thaiprompt Affiliate ผ่าน NFC |

---

## 🛠️ Tech Stack

```
React Native 0.73
react-native-nfc-manager     ← NFC core
@react-navigation/native     ← Navigation
@react-native-async-storage  ← History storage
axios                        ← Thaiprompt API
react-native-haptic-feedback ← Vibration feedback
react-native-toast-message   ← Notifications
```

---

## 📁 Project Structure

```
src/
├── screens/
│   ├── HomeScreen.tsx           ← Dashboard + stats
│   ├── ReadScreen.tsx           ← Read NFC + auto member lookup
│   ├── WriteScreen.tsx          ← Write URL/Text/vCard/TP Member
│   ├── CloneScreen.tsx          ← Clone NDEF tag
│   ├── HistoryScreen.tsx        ← Scan history + filter
│   ├── HexViewScreen.tsx        ← Raw hex dump viewer
│   ├── SettingsScreen.tsx       ← API config + preferences
│   └── MemberRegisterScreen.tsx ← Thaiprompt member registration
├── services/
│   ├── nfcService.ts            ← NFC read/write/clone/hex
│   ├── apiService.ts            ← Thaiprompt API calls
│   └── storageService.ts        ← AsyncStorage history & settings
├── navigation/
│   └── AppNavigator.tsx         ← Tab + Stack navigation
├── utils/
│   ├── hexUtils.ts              ← Hex/NDEF parsing utilities
│   └── theme.ts                 ← Colors, typography, spacing
└── types/
    └── index.ts                 ← TypeScript interfaces
```

---

## 🚀 Setup

```bash
# 1. Install dependencies
npm install

# 2. Android: link native modules (auto-link for RN 0.60+)
cd android && ./gradlew clean && cd ..

# 3. Add permissions to android/app/src/main/AndroidManifest.xml:
```

```xml
<uses-permission android:name="android.permission.NFC" />
<uses-feature android:name="android.hardware.nfc" android:required="true" />
```

```bash
# 4. Run on Android device (NFC requires real device, not emulator)
npx react-native run-android
```

---

## 🔗 Thaiprompt API Integration

### การตั้งค่า

ไปที่หน้า **Settings** → กรอก:
- **API URL**: `https://api.thaiprompt.com/v1`
- **API Key**: API key จาก Thaiprompt backend

### API Endpoints ที่ใช้

```
GET  /ping                              ← ทดสอบการเชื่อมต่อ
GET  /members/nfc/:uid                  ← ค้นหาสมาชิกจาก NFC UID
GET  /members/:id                       ← ดึงข้อมูลสมาชิกตาม ID
GET  /members/search?q=...              ← ค้นหาสมาชิก
POST /members/register/nfc              ← ลงทะเบียนสมาชิกใหม่ผ่าน NFC
POST /members/:id/nfc                   ← เชื่อม NFC Card กับสมาชิกเดิม
```

### ขั้นตอนลงทะเบียนสมาชิก

1. กรอกข้อมูล (ชื่อ, เบอร์, อีเมล, รหัสผู้แนะนำ)
2. แตะการ์ด NFC → ระบบอ่าน UID
3. ส่งข้อมูลไปยัง Thaiprompt API
4. รับ Member ID กลับมา
5. เขียนข้อมูล NDEF ลงการ์ดอัตโนมัติ:
   - Record 1: URL `https://thaiprompt.com/affiliate?ref=XXXXX`
   - Record 2: Text ข้อมูลสมาชิก
   - Record 3: MIME JSON สำหรับแอพ

---

## 🎨 Design System

- **Primary**: `#6366F1` (Indigo)
- **Secondary**: `#22D3EE` (Cyan)
- **Success**: `#10B981` (Emerald)
- **Warning**: `#F59E0B` (Amber)
- **Background**: `#0A0A0F` (Dark)
- **Font**: Inter (UI) + JetBrains Mono (Hex/Code)

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

## 📄 License

MIT © Thaiprompt / NFC Master Pro
