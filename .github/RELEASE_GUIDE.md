# 🚀 Release Guide — NFC Master Pro

## How to trigger a new release

### Method 1: Push a version tag (Recommended)
```bash
# Tag the current commit with a version
git tag v1.0.0
git push origin v1.0.0
```
GitHub Actions will automatically:
1. Build the signed release APK
2. Create a GitHub Release with the APK attached
3. Add release notes from git commits

### Method 2: Manual trigger from GitHub UI
1. Go to **Actions** tab → **🚀 Auto Release APK**
2. Click **Run workflow**
3. Enter the version (e.g., `v1.1.0`)
4. Click **Run workflow**

---

## Download the APK
After the workflow finishes (~10-15 min):

- **Debug APK** (from main push): Go to Actions → Latest build → Artifacts
- **Release APK** (from tags): Go to [Releases](https://github.com/xjanova/nfcmasterpro/releases) → Download APK

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
