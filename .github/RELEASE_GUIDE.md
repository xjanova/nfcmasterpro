# 🚀 Release Guide — NFC Master Pro v2.0

## How to trigger a new release

### Method: Manual trigger from GitHub UI (Recommended)
1. Go to **Actions** tab → **🚀 Auto Release APK**
2. Click **Run workflow**
3. Enter the version (e.g., `2.0.1`)
4. Click **Run workflow**

GitHub Actions will automatically:
1. Build the signed release APK
2. Patch axios for Metro bundling compatibility
3. Create a GitHub Release with the APK attached
4. Add release notes from git commits

---

## Download the APK

After the workflow finishes (~10-15 min):

- **Debug APK** (auto on push): Go to Actions → Latest build → Artifacts
- **Release APK** (manual trigger): Go to [Releases](https://github.com/xjanova/nfcmasterpro/releases) → Download APK

Latest release: [v2.0.1](https://github.com/xjanova/nfcmasterpro/releases/tag/v2.0.1)

---

## Known Build Notes

### Axios Metro Fix
Release builds require patching axios to prevent it from using Node.js entry points. This is handled automatically in the workflow via:
```bash
node -e "const p=require('./node_modules/axios/package.json'); delete p.exports; p.main='index.js'; require('fs').writeFileSync('./node_modules/axios/package.json', JSON.stringify(p,null,2));"
```

### react-native-svg Version
Pinned to `14.1.0` for compatibility with React Native 0.73.6. Do NOT upgrade to v15+ without upgrading RN first.

### compileSdkVersion
Patched to `35` in the workflow to match dependency requirements.

---

## Setup production keystore (optional)

For a permanent keystore (same APK signature across releases):

1. Generate a keystore locally:
```bash
keytool -genkey -v \
  -keystore release.keystore \
  -alias nfcmasterpro \
  -keyalg RSA -keysize 2048 -validity 10000
```

2. Convert to Base64:
```bash
base64 -w 0 release.keystore > keystore.b64
```

3. Add to GitHub Secrets (**Settings → Secrets and variables → Actions**):
   - `KEYSTORE_BASE64` — content of `keystore.b64`
   - `KEY_ALIAS` — your key alias (e.g., `nfcmasterpro`)
   - `KEYSTORE_PASSWORD` — store password
   - `KEY_PASSWORD` — key password

---

## Install APK on device

1. Enable **Install from unknown sources**:
   - Android 8+: Settings → Apps → Special app access → Install unknown apps
2. Transfer APK to device (or download directly from Releases)
3. Tap the APK file → Install
4. Open app → Allow NFC permissions
