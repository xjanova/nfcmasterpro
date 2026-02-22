import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
  Animated,
  TextInput,
  ActivityIndicator,
  Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { createTextStyles, Spacing, Radius, FontSizes, Shadow } from '../utils/theme';
import { useLanguage } from '../utils/i18n';
import { APP_VERSION } from '../utils/constants';
import * as qrService from '../services/qrService';
import { BackendPairingData, DeviceQRData } from '../services/qrService';

// Conditionally import QRCode (may not be available in all environments)
let QRCode: any = null;
try {
  QRCode = require('react-native-qrcode-svg').default;
} catch {
  // QRCode not available
}

type TabMode = 'scan' | 'generate';
type ScanMode = 'idle' | 'manual' | 'preview' | 'pairing' | 'result';

interface PairingState {
  scanMode: ScanMode;
  qrData?: BackendPairingData;
  loading: boolean;
  success: boolean;
  message?: string;
  orgName?: string;
  isPaired: boolean;
  currentOrg?: string;
  currentApiUrl?: string;
  pairedAt?: string;
}

const QRScannerScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { t, lang } = useLanguage();
  const { colors } = useTheme();
  const ts = createTextStyles(colors);

  const [activeTab, setActiveTab] = useState<TabMode>('generate');

  // === Scan Tab State ===
  const [state, setState] = useState<PairingState>({
    scanMode: 'idle',
    loading: false,
    success: false,
    isPaired: false,
  });
  const [manualInput, setManualInput] = useState('');
  const [scanAnimation] = useState(new Animated.Value(0));

  // === Generate Tab State ===
  const [deviceQR, setDeviceQR] = useState<DeviceQRData | null>(null);
  const [qrString, setQrString] = useState<string>('');
  const [generatingQR, setGeneratingQR] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  // Check pairing status on mount
  useEffect(() => {
    checkPairingStatus();
  }, []);

  // Generate QR on first visit to generate tab
  useEffect(() => {
    if (activeTab === 'generate' && !deviceQR) {
      handleGenerateQR();
    }
  }, [activeTab]);

  // Countdown timer for QR expiration
  useEffect(() => {
    if (!deviceQR) return;
    const expires = new Date(deviceQR.expires_at).getTime();
    const updateTimer = () => {
      const remaining = Math.max(0, Math.floor((expires - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) {
        setDeviceQR(null);
        setQrString('');
      }
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [deviceQR]);

  // Scan animation
  useEffect(() => {
    if (activeTab === 'scan' && state.scanMode === 'idle') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanAnimation, { toValue: 1, duration: 2000, useNativeDriver: false }),
          Animated.timing(scanAnimation, { toValue: 0, duration: 2000, useNativeDriver: false }),
        ])
      ).start();
    }
  }, [activeTab, state.scanMode, scanAnimation]);

  const checkPairingStatus = async () => {
    const status = await qrService.getPairingStatus();
    setState(prev => ({
      ...prev,
      isPaired: status.isPaired,
      currentOrg: status.orgName,
      currentApiUrl: status.apiUrl,
      pairedAt: status.pairedAt,
    }));
  };

  const handleClose = () => navigation?.goBack?.();

  // === Generate QR Functions ===
  const handleGenerateQR = async () => {
    setGeneratingQR(true);
    try {
      const data = await qrService.generateDeviceQRData();
      setDeviceQR(data);
      setQrString(qrService.deviceQRToString(data));
    } catch (err) {
      Alert.alert(
        lang === 'th' ? 'เกิดข้อผิดพลาด' : 'Error',
        lang === 'th' ? 'ไม่สามารถสร้าง QR ได้' : 'Could not generate QR code'
      );
    } finally {
      setGeneratingQR(false);
    }
  };

  const handleShareQR = async () => {
    if (!qrString) return;
    try {
      await Share.share({
        message: qrString,
        title: lang === 'th' ? 'รหัสจับคู่ NFC Master Pro' : 'NFC Master Pro Pairing Code',
      });
    } catch {}
  };

  // === Scan Tab Functions ===
  const handleDemoScan = () => {
    const demoData = qrService.generateDemoQRData();
    setState(prev => ({ ...prev, scanMode: 'preview', qrData: demoData }));
  };

  const handleManualSubmit = () => {
    if (!manualInput.trim()) {
      Alert.alert(
        lang === 'th' ? 'ข้อมูลไม่ถูกต้อง' : 'Invalid Data',
        lang === 'th' ? 'กรุณาป้อนข้อมูล QR' : 'Please enter QR data'
      );
      return;
    }
    const data = qrService.decodeQRPayload(manualInput);
    if (!data) {
      Alert.alert(
        lang === 'th' ? 'QR ไม่ถูกต้อง' : 'Invalid QR',
        lang === 'th' ? 'รูปแบบ QR ไม่ถูกต้องหรือหมดอายุ' : 'QR format is invalid or expired'
      );
      return;
    }
    setState(prev => ({ ...prev, scanMode: 'preview', qrData: data }));
    setManualInput('');
  };

  const handleConfirmPairing = async () => {
    if (!state.qrData) return;
    setState(prev => ({ ...prev, scanMode: 'pairing', loading: true }));
    const result = await qrService.pairWithBackend(state.qrData);
    setState(prev => ({
      ...prev,
      scanMode: 'result',
      loading: false,
      success: result.success,
      message: result.message,
      orgName: result.orgName,
      isPaired: result.success,
      currentOrg: result.success ? result.orgName : prev.currentOrg,
    }));
    if (result.success) setTimeout(() => handleClose(), 3000);
  };

  const handleUnpair = () => {
    Alert.alert(
      lang === 'th' ? 'ยกเลิกการจับคู่' : 'Unpair Device',
      lang === 'th' ? 'ต้องการยกเลิกการเชื่อมต่อกับระบบหลังบ้านหรือไม่?' : 'Disconnect from backend?',
      [
        { text: lang === 'th' ? 'ยกเลิก' : 'Cancel', style: 'cancel' },
        {
          text: lang === 'th' ? 'ยืนยัน' : 'Confirm',
          style: 'destructive',
          onPress: async () => {
            await qrService.unpairFromBackend();
            setState(prev => ({
              ...prev, isPaired: false, currentOrg: undefined,
              currentApiUrl: undefined, pairedAt: undefined, scanMode: 'idle',
            }));
          },
        },
      ]
    );
  };

  const handleResetScan = () => {
    setState(prev => ({
      ...prev, scanMode: 'idle', qrData: undefined, success: false, message: undefined,
    }));
    setManualInput('');
  };

  const scanLinePos = scanAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // ──────────────────────────────────────────────
  //  TAB BAR
  // ──────────────────────────────────────────────
  const TabBar = () => (
    <View style={[s.tabBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
      <TouchableOpacity
        style={[s.tab, activeTab === 'generate' && [s.tabActive, { borderBottomColor: colors.primary }]]}
        onPress={() => setActiveTab('generate')}>
        <Text style={[s.tabIcon, { color: activeTab === 'generate' ? colors.primary : colors.textMuted }]}>{'⬡'}</Text>
        <Text style={[s.tabLabel, { color: activeTab === 'generate' ? colors.primary : colors.textMuted }]}>
          {lang === 'th' ? 'สร้าง QR' : 'Generate QR'}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[s.tab, activeTab === 'scan' && [s.tabActive, { borderBottomColor: colors.primary }]]}
        onPress={() => setActiveTab('scan')}>
        <Text style={[s.tabIcon, { color: activeTab === 'scan' ? colors.primary : colors.textMuted }]}>{'◎'}</Text>
        <Text style={[s.tabLabel, { color: activeTab === 'scan' ? colors.primary : colors.textMuted }]}>
          {lang === 'th' ? 'สแกน QR' : 'Scan QR'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  // ──────────────────────────────────────────────
  //  GENERATE QR TAB
  // ──────────────────────────────────────────────
  const renderGenerateTab = () => (
    <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
      {/* Pairing Status */}
      {state.isPaired && (
        <View style={[s.statusCard, { backgroundColor: colors.card, borderColor: colors.success + '40' }]}>
          <View style={[s.statusDot, { backgroundColor: colors.success }]} />
          <View style={{ flex: 1 }}>
            <Text style={[ts.labelSmall, { color: colors.success, textTransform: 'uppercase' }]}>
              {lang === 'th' ? 'เชื่อมต่อแล้ว' : 'Connected'}
            </Text>
            <Text style={[ts.bodyLarge, { fontWeight: '600' }]}>{state.currentOrg || 'Thaiprompt'}</Text>
          </View>
          <TouchableOpacity
            style={[s.unpairBtn, { borderColor: colors.danger + '60' }]}
            onPress={handleUnpair}>
            <Text style={[ts.labelSmall, { color: colors.danger }]}>
              {lang === 'th' ? 'ยกเลิก' : 'Unpair'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* QR Code Display */}
      <View style={[s.qrContainer, { backgroundColor: colors.card, borderColor: colors.border }, Shadow.md]}>
        <Text style={[ts.headingMedium, { fontWeight: '700', textAlign: 'center', marginBottom: Spacing.sm }]}>
          {lang === 'th' ? 'QR จับคู่อุปกรณ์' : 'Device Pairing QR'}
        </Text>
        <Text style={[ts.bodySmall, { textAlign: 'center', marginBottom: Spacing.lg, color: colors.textMuted }]}>
          {lang === 'th'
            ? 'ให้แอดมิน Thaiprompt สแกน QR นี้\nเพื่อจับคู่อุปกรณ์กับระบบ'
            : 'Let Thaiprompt admin scan this QR\nto pair this device with the system'}
        </Text>

        {generatingQR ? (
          <View style={s.qrPlaceholder}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[ts.bodySmall, { marginTop: Spacing.md, color: colors.textMuted }]}>
              {lang === 'th' ? 'กำลังสร้าง QR...' : 'Generating QR...'}
            </Text>
          </View>
        ) : qrString ? (
          <View style={s.qrCodeWrapper}>
            <View style={[s.qrCodeBox, { backgroundColor: '#ffffff' }]}>
              {QRCode ? (
                <QRCode value={qrString} size={200} backgroundColor="#ffffff" color="#000000" />
              ) : (
                <View style={s.qrFallback}>
                  <Text style={[s.qrFallbackIcon]}>{'⬡'}</Text>
                  <Text style={[s.qrFallbackText]}>QR Code</Text>
                  <Text style={[s.qrFallbackSub]}>v{APP_VERSION}</Text>
                </View>
              )}
            </View>

            {/* Timer */}
            {timeLeft > 0 && (
              <View style={[s.timerBadge, {
                backgroundColor: timeLeft < 300 ? colors.danger + '15' : colors.primary + '15',
              }]}>
                <Text style={[ts.labelSmall, {
                  color: timeLeft < 300 ? colors.danger : colors.primary,
                  fontFamily: 'monospace',
                }]}>
                  {lang === 'th' ? 'หมดอายุใน' : 'Expires in'} {formatTime(timeLeft)}
                </Text>
              </View>
            )}

            {timeLeft <= 0 && !generatingQR && (
              <View style={[s.timerBadge, { backgroundColor: colors.danger + '15' }]}>
                <Text style={[ts.labelSmall, { color: colors.danger }]}>
                  {lang === 'th' ? 'QR หมดอายุแล้ว' : 'QR has expired'}
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View style={s.qrPlaceholder}>
            <Text style={{ fontSize: 48, marginBottom: Spacing.sm }}>{'⬡'}</Text>
            <Text style={[ts.bodySmall, { color: colors.textMuted }]}>
              {lang === 'th' ? 'กดสร้าง QR ด้านล่าง' : 'Tap Generate below'}
            </Text>
          </View>
        )}
      </View>

      {/* Device Info */}
      {deviceQR && (
        <View style={[s.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <InfoRow label={lang === 'th' ? 'อุปกรณ์' : 'Device ID'} value={deviceQR.device_id} mono colors={colors} ts={ts} />
          <InfoRow label={lang === 'th' ? 'แอพ' : 'App'} value={`${deviceQR.app_name} v${deviceQR.app_version}`} colors={colors} ts={ts} />
          <InfoRow label={lang === 'th' ? 'แพลตฟอร์ม' : 'Platform'} value={deviceQR.platform} colors={colors} ts={ts} />
          <InfoRow label={lang === 'th' ? 'สร้างเมื่อ' : 'Generated'}
            value={new Date(deviceQR.generated_at).toLocaleTimeString(lang === 'th' ? 'th-TH' : 'en-US')}
            isLast colors={colors} ts={ts} />
        </View>
      )}

      {/* Action Buttons */}
      <View style={s.btnGroup}>
        <TouchableOpacity
          style={[s.primaryBtn, { backgroundColor: colors.primary }, Shadow.sm]}
          onPress={handleGenerateQR}
          activeOpacity={0.7}>
          <Text style={[s.btnText, { color: '#fff' }]}>
            {deviceQR ? (lang === 'th' ? 'สร้าง QR ใหม่' : 'Regenerate QR') : (lang === 'th' ? 'สร้าง QR Code' : 'Generate QR Code')}
          </Text>
        </TouchableOpacity>

        {qrString ? (
          <TouchableOpacity
            style={[s.secondaryBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={handleShareQR}
            activeOpacity={0.7}>
            <Text style={[s.btnText, { color: colors.text }]}>
              {lang === 'th' ? 'แชร์รหัสเชื่อมต่อ' : 'Share Connection Code'}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Instructions */}
      <View style={[s.instructionBox, { backgroundColor: colors.card, borderLeftColor: colors.primary }]}>
        <Text style={[ts.bodyMedium, { fontWeight: '600', marginBottom: Spacing.sm }]}>
          {lang === 'th' ? 'วิธีจับคู่อุปกรณ์' : 'How to Pair Device'}
        </Text>
        <Text style={[ts.bodySmall, { color: colors.textSecondary, lineHeight: 24 }]}>
          {lang === 'th'
            ? '1. กดปุ่ม "สร้าง QR Code"\n2. แสดง QR ให้แอดมิน Thaiprompt\n3. แอดมินสแกน QR จากหน้าจัดการ NFC\n4. ระบบจะจับคู่อุปกรณ์อัตโนมัติ'
            : '1. Tap "Generate QR Code"\n2. Show QR to Thaiprompt admin\n3. Admin scans from NFC Management page\n4. Device will be paired automatically'}
        </Text>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );

  // ──────────────────────────────────────────────
  //  SCAN QR TAB — Main (idle)
  // ──────────────────────────────────────────────
  const renderScanIdle = () => (
    <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
      {/* Pairing Status */}
      {state.isPaired && (
        <View style={[s.statusCard, { backgroundColor: colors.card, borderColor: colors.success + '40' }]}>
          <View style={[s.statusDot, { backgroundColor: colors.success }]} />
          <View style={{ flex: 1 }}>
            <Text style={[ts.labelSmall, { color: colors.success, textTransform: 'uppercase' }]}>
              {lang === 'th' ? 'เชื่อมต่อแล้ว' : 'Connected'}
            </Text>
            <Text style={[ts.bodyLarge, { fontWeight: '600' }]}>{state.currentOrg || 'Thaiprompt'}</Text>
            <Text style={[ts.bodySmall, { color: colors.textMuted, marginTop: 2 }]}>{state.currentApiUrl}</Text>
          </View>
          <TouchableOpacity
            style={[s.unpairBtn, { borderColor: colors.danger + '60' }]}
            onPress={handleUnpair}>
            <Text style={[ts.labelSmall, { color: colors.danger }]}>
              {lang === 'th' ? 'ยกเลิก' : 'Unpair'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Scanner Area */}
      <View style={s.scannerWrap}>
        <View style={[s.scannerFrame, { backgroundColor: colors.card, borderColor: colors.border }, Shadow.md]}>
          <View style={[s.scanArea, { backgroundColor: colors.bg }]}>
            <View style={[s.corner, s.topLeft, { borderColor: colors.primary }]} />
            <View style={[s.corner, s.topRight, { borderColor: colors.primary }]} />
            <View style={[s.corner, s.bottomLeft, { borderColor: colors.primary }]} />
            <View style={[s.corner, s.bottomRight, { borderColor: colors.primary }]} />
            <Animated.View style={[s.scanLine, { top: scanLinePos as any, backgroundColor: colors.primary }]} />
            <Text style={[ts.bodySmall, { color: colors.textMuted, textAlign: 'center', lineHeight: 22 }]}>
              {lang === 'th'
                ? 'สแกน QR จากหน้าแอดมิน\nThaiprompt เพื่อจับคู่แอพ'
                : 'Scan QR from Thaiprompt\nadmin panel to pair app'}
            </Text>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={s.btnGroup}>
        <TouchableOpacity
          style={[s.primaryBtn, { backgroundColor: colors.primary }, Shadow.sm]}
          onPress={handleDemoScan}
          activeOpacity={0.7}>
          <Text style={[s.btnText, { color: '#fff' }]}>
            {lang === 'th' ? 'ทดสอบจับคู่ (Demo)' : 'Demo Pairing'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.secondaryBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => setState(prev => ({ ...prev, scanMode: 'manual' }))}
          activeOpacity={0.7}>
          <Text style={[s.btnText, { color: colors.text }]}>
            {lang === 'th' ? 'ป้อนรหัสเชื่อมต่อ' : 'Enter Connection Code'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Instructions */}
      <View style={[s.instructionBox, { backgroundColor: colors.card, borderLeftColor: colors.primary }]}>
        <Text style={[ts.bodyMedium, { fontWeight: '600', marginBottom: Spacing.sm }]}>
          {lang === 'th' ? 'วิธีสแกน QR จากแอดมิน' : 'How to Scan Admin QR'}
        </Text>
        <Text style={[ts.bodySmall, { color: colors.textSecondary, lineHeight: 24 }]}>
          {lang === 'th'
            ? '1. เปิดหน้าแอดมิน Thaiprompt\n2. ไปที่ NFC Management → สร้าง QR จับคู่\n3. สแกน QR หรือป้อนรหัสเชื่อมต่อ\n4. แอพจะตั้งค่า API อัตโนมัติ'
            : '1. Open Thaiprompt admin panel\n2. Go to NFC Management → Generate Pairing QR\n3. Scan QR or enter connection code\n4. App will auto-configure API'}
        </Text>
      </View>
      <View style={{ height: 40 }} />
    </ScrollView>
  );

  // ──────────────────────────────────────────────
  //  MANUAL INPUT MODE
  // ──────────────────────────────────────────────
  const renderManualInput = () => (
    <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={{ marginVertical: Spacing.md }}>
        <Text style={[ts.labelLarge, { marginBottom: Spacing.sm }]}>
          {lang === 'th' ? 'รหัส JSON จาก QR' : 'QR JSON Code'}
        </Text>
        <TextInput
          style={[s.textInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]}
          value={manualInput}
          onChangeText={setManualInput}
          placeholder={lang === 'th' ? 'วาง JSON ที่นี่...' : 'Paste JSON here...'}
          placeholderTextColor={colors.textMuted}
          multiline numberOfLines={8} textAlignVertical="top"
          autoCapitalize="none" autoCorrect={false}
        />
        <View style={[s.formatHint, { backgroundColor: colors.surface, borderLeftColor: colors.primary }]}>
          <Text style={[ts.labelSmall, { color: colors.primary, marginBottom: Spacing.xs }]}>
            {lang === 'th' ? 'รูปแบบข้อมูล:' : 'Expected format:'}
          </Text>
          <Text style={{ fontSize: 11, fontFamily: 'monospace', color: colors.textSecondary, lineHeight: 18 }}>
            {`{\n  "api_url": "https://...",\n  "api_key": "your-key",\n  "device_token": "token",\n  "org_name": "Org Name"\n}`}
          </Text>
        </View>
      </View>
      <View style={s.btnGroup}>
        <TouchableOpacity
          style={[s.primaryBtn, { backgroundColor: colors.primary }, !manualInput.trim() && { opacity: 0.4 }, Shadow.sm]}
          onPress={handleManualSubmit} disabled={!manualInput.trim()} activeOpacity={0.7}>
          <Text style={[s.btnText, { color: '#fff' }]}>
            {lang === 'th' ? 'ตรวจสอบ' : 'Verify'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.secondaryBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={handleResetScan} activeOpacity={0.7}>
          <Text style={[s.btnText, { color: colors.text }]}>
            {lang === 'th' ? 'ยกเลิก' : 'Cancel'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  // ──────────────────────────────────────────────
  //  PREVIEW MODE
  // ──────────────────────────────────────────────
  const renderPreview = () => {
    if (!state.qrData) return null;
    const data = state.qrData;
    return (
      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[s.previewCard, { backgroundColor: colors.card, borderColor: colors.primary + '30' }, Shadow.md]}>
          <View style={[s.previewIcon, { backgroundColor: colors.primary + '15' }]}>
            <Text style={{ fontSize: 36 }}>{'🔗'}</Text>
          </View>
          <Text style={[ts.headingMedium, { textAlign: 'center' }]}>
            {data.org_name || 'Thaiprompt Backend'}
          </Text>
          <Text style={[ts.bodySmall, { color: colors.textMuted, marginTop: Spacing.xs }]}>
            {lang === 'th' ? 'ระบบหลังบ้าน' : 'Backend System'}
          </Text>
        </View>

        <View style={[s.infoCard, { backgroundColor: colors.card, borderColor: colors.border, marginTop: Spacing.lg }]}>
          <InfoRow label={lang === 'th' ? 'เซิร์ฟเวอร์' : 'Server'} value={data.api_url} colors={colors} ts={ts} />
          <InfoRow label={lang === 'th' ? 'องค์กร' : 'Organization'} value={data.org_name || '-'} colors={colors} ts={ts} />
          <InfoRow label="API Key" value={`${data.api_key.substring(0, 8)}****`} colors={colors} ts={ts} />
          <InfoRow label={lang === 'th' ? 'สิทธิ์' : 'Permissions'} value={(data.permissions || []).join(', ')} colors={colors} ts={ts} />
          <InfoRow label={lang === 'th' ? 'หมดอายุ' : 'Expires'}
            value={new Date(data.expires_at).toLocaleString(lang === 'th' ? 'th-TH' : 'en-US')}
            isLast colors={colors} ts={ts} />
        </View>

        <View style={[s.warningBox, { backgroundColor: colors.warning + '12', borderLeftColor: colors.warning }]}>
          <Text style={[ts.bodySmall, { color: colors.warning, lineHeight: 20 }]}>
            {lang === 'th'
              ? '⚠️ การจับคู่จะตั้งค่า API ให้อัตโนมัติ หากเชื่อมต่ออยู่แล้วจะถูกแทนที่'
              : '⚠️ Pairing will auto-configure API. Existing connection will be replaced.'}
          </Text>
        </View>

        <View style={s.btnGroup}>
          <TouchableOpacity
            style={[s.primaryBtn, { backgroundColor: colors.success }, Shadow.sm]}
            onPress={handleConfirmPairing} activeOpacity={0.7}>
            <Text style={[s.btnText, { color: '#fff' }]}>
              {lang === 'th' ? 'จับคู่เลย' : 'Pair Now'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.secondaryBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={handleResetScan} activeOpacity={0.7}>
            <Text style={[s.btnText, { color: colors.text }]}>
              {lang === 'th' ? 'ยกเลิก' : 'Cancel'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  };

  // ──────────────────────────────────────────────
  //  PAIRING IN PROGRESS
  // ──────────────────────────────────────────────
  const renderPairing = () => (
    <View style={[s.centerContent, { backgroundColor: colors.bg }]}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={[ts.headingSmall, { marginTop: Spacing.xl, textAlign: 'center' }]}>
        {lang === 'th' ? 'กำลังจับคู่กับระบบหลังบ้าน...' : 'Pairing with backend...'}
      </Text>
      <Text style={[ts.bodySmall, { color: colors.textMuted, marginTop: Spacing.sm, textAlign: 'center' }]}>
        {lang === 'th' ? 'ตั้งค่า API และลงทะเบียนอุปกรณ์' : 'Configuring API and registering device'}
      </Text>
    </View>
  );

  // ──────────────────────────────────────────────
  //  RESULT
  // ──────────────────────────────────────────────
  const renderResult = () => (
    <View style={[s.centerContent, { backgroundColor: colors.bg }]}>
      <View style={[s.resultCircle, {
        backgroundColor: (state.success ? colors.success : colors.danger) + '20',
      }]}>
        <Text style={{ fontSize: 44, fontWeight: 'bold', color: colors.text }}>
          {state.success ? '✓' : '✕'}
        </Text>
      </View>
      <Text style={[ts.headingMedium, {
        textAlign: 'center', marginBottom: Spacing.sm,
        color: state.success ? colors.success : colors.danger,
      }]}>
        {state.success
          ? (lang === 'th' ? 'จับคู่สำเร็จ!' : 'Pairing Successful!')
          : (lang === 'th' ? 'จับคู่ล้มเหลว' : 'Pairing Failed')}
      </Text>
      {state.orgName && state.success && (
        <Text style={[ts.bodyLarge, { color: colors.primary, fontWeight: '600', marginBottom: Spacing.sm }]}>
          {state.orgName}
        </Text>
      )}
      <Text style={[ts.bodyMedium, { color: colors.textSecondary, textAlign: 'center', paddingHorizontal: Spacing.lg, marginBottom: Spacing.xl }]}>
        {state.message}
      </Text>
      {!state.success && (
        <View style={[s.btnGroup, { width: '100%' }]}>
          <TouchableOpacity
            style={[s.primaryBtn, { backgroundColor: colors.primary }, Shadow.sm]}
            onPress={handleResetScan} activeOpacity={0.7}>
            <Text style={[s.btnText, { color: '#fff' }]}>
              {lang === 'th' ? 'ลองอีกครั้ง' : 'Try Again'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.secondaryBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={handleClose} activeOpacity={0.7}>
            <Text style={[s.btnText, { color: colors.text }]}>
              {lang === 'th' ? 'ปิด' : 'Close'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  // ──────────────────────────────────────────────
  //  RENDER SCAN TAB
  // ──────────────────────────────────────────────
  const renderScanTab = () => {
    switch (state.scanMode) {
      case 'manual': return renderManualInput();
      case 'preview': return renderPreview();
      case 'pairing': return renderPairing();
      case 'result': return renderResult();
      default: return renderScanIdle();
    }
  };

  // ──────────────────────────────────────────────
  //  MAIN RENDER
  // ──────────────────────────────────────────────
  const headerTitle = activeTab === 'generate'
    ? (lang === 'th' ? 'สร้าง QR จับคู่' : 'Generate Pairing QR')
    : (state.scanMode === 'manual'
      ? (lang === 'th' ? 'ป้อนรหัสเชื่อมต่อ' : 'Enter Code')
      : state.scanMode === 'preview'
        ? (lang === 'th' ? 'ยืนยันการจับคู่' : 'Confirm Pairing')
        : (lang === 'th' ? 'จับคู่ระบบ' : 'System Pairing'));

  const showBackToScanIdle = activeTab === 'scan' && state.scanMode !== 'idle' && state.scanMode !== 'pairing';

  return (
    <View style={[s.container, { paddingTop: insets.top, backgroundColor: colors.bg }]}>
      <StatusBar barStyle={colors.statusBarStyle} backgroundColor={colors.bg} />

      {/* Header */}
      <View style={[s.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={showBackToScanIdle ? handleResetScan : handleClose}
          style={s.backBtn}>
          <Text style={{ fontSize: 22, color: colors.primary }}>{'←'}</Text>
        </TouchableOpacity>
        <Text style={[ts.headingMedium, { fontWeight: '700' }]}>{headerTitle}</Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Tab Bar (hidden during sub-screens) */}
      {(activeTab === 'generate' || state.scanMode === 'idle') && <TabBar />}

      {/* Content */}
      {activeTab === 'generate' ? renderGenerateTab() : renderScanTab()}
    </View>
  );
};

// ──────────────────────────────────────────────
//  Info Row Component
// ──────────────────────────────────────────────
const InfoRow = ({ label, value, isLast = false, mono = false, colors, ts }: {
  label: string; value: string; isLast?: boolean; mono?: boolean; colors: any; ts: any;
}) => (
  <View style={[s.infoRow, !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
    <Text style={[ts.bodySmall, { color: colors.textMuted, flex: 1 }]}>{label}</Text>
    <Text style={[ts.bodySmall, { flex: 2, textAlign: 'right' }, mono && { fontFamily: 'monospace', fontSize: 11 }]}
      numberOfLines={2}>{value}</Text>
  </View>
);

// ============================================================
//  Styles
// ============================================================
const s = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 44, height: 44, justifyContent: 'center', alignItems: 'center',
  },
  tabBar: {
    flexDirection: 'row', borderBottomWidth: 1,
  },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: Spacing.md, gap: 6, borderBottomWidth: 3, borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomWidth: 3 },
  tabIcon: { fontSize: 16 },
  tabLabel: { fontSize: FontSizes.sm, fontWeight: '600' },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.lg, paddingBottom: Spacing.xxl,
  },
  centerContent: {
    flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.xl,
  },

  // Status Card
  statusCard: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: Radius.lg, padding: Spacing.lg,
    marginBottom: Spacing.lg, borderWidth: 1,
  },
  statusDot: {
    width: 12, height: 12, borderRadius: 6, marginRight: Spacing.md,
  },
  unpairBtn: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: Radius.md, borderWidth: 1,
  },

  // QR Container
  qrContainer: {
    borderRadius: Radius.xl, padding: Spacing.xl, alignItems: 'center',
    borderWidth: 1, marginBottom: Spacing.lg,
  },
  qrCodeWrapper: { alignItems: 'center' },
  qrCodeBox: {
    padding: 16, borderRadius: Radius.lg,
  },
  qrPlaceholder: {
    width: 232, height: 232, justifyContent: 'center', alignItems: 'center',
  },
  qrFallback: {
    width: 200, height: 200, justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#f0f0f0', borderRadius: Radius.md,
  },
  qrFallbackIcon: { fontSize: 64, color: '#6366f1' },
  qrFallbackText: { fontSize: 18, fontWeight: '700', color: '#333', marginTop: 8 },
  qrFallbackSub: { fontSize: 12, color: '#999', marginTop: 4 },
  timerBadge: {
    marginTop: Spacing.md, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm,
    borderRadius: Radius.lg,
  },

  // Info Card
  infoCard: {
    borderRadius: Radius.lg, borderWidth: 1, overflow: 'hidden', marginBottom: Spacing.lg,
  },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
  },

  // Buttons
  btnGroup: { marginTop: Spacing.md, gap: Spacing.md },
  primaryBtn: {
    borderRadius: Radius.lg, paddingVertical: 14, alignItems: 'center',
  },
  secondaryBtn: {
    borderRadius: Radius.lg, paddingVertical: 14, alignItems: 'center', borderWidth: 1,
  },
  btnText: { fontSize: FontSizes.md, fontWeight: '600' },

  // Instruction
  instructionBox: {
    borderRadius: Radius.lg, padding: Spacing.lg,
    marginTop: Spacing.lg, borderLeftWidth: 4,
  },

  // Scanner
  scannerWrap: { marginVertical: Spacing.md, alignItems: 'center' },
  scannerFrame: {
    width: '100%', maxWidth: 300, aspectRatio: 1,
    borderRadius: Radius.lg, padding: Spacing.md, borderWidth: 1,
  },
  scanArea: {
    flex: 1, borderRadius: Radius.md, justifyContent: 'center', alignItems: 'center',
    position: 'relative', overflow: 'hidden',
  },
  corner: { position: 'absolute', width: 28, height: 28 },
  topLeft: { top: 12, left: 12, borderTopWidth: 3, borderLeftWidth: 3 },
  topRight: { top: 12, right: 12, borderTopWidth: 3, borderRightWidth: 3 },
  bottomLeft: { bottom: 12, left: 12, borderBottomWidth: 3, borderLeftWidth: 3 },
  bottomRight: { bottom: 12, right: 12, borderBottomWidth: 3, borderRightWidth: 3 },
  scanLine: {
    position: 'absolute', width: '75%', height: 2,
    shadowOpacity: 0.8, shadowRadius: 8, elevation: 5,
  },

  // Preview
  previewCard: {
    borderRadius: Radius.xl, padding: Spacing.xl, alignItems: 'center', borderWidth: 1,
  },
  previewIcon: {
    width: 80, height: 80, borderRadius: 40,
    justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.md,
  },

  // Warning
  warningBox: {
    borderRadius: Radius.md, padding: Spacing.md, marginTop: Spacing.lg, borderLeftWidth: 4,
  },

  // Result
  resultCircle: {
    width: 96, height: 96, borderRadius: 48,
    justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.lg,
  },

  // Text Input
  textInput: {
    borderRadius: Radius.md, borderWidth: 1,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    fontSize: FontSizes.sm, fontFamily: 'monospace', minHeight: 160,
  },
  formatHint: {
    borderRadius: Radius.md, padding: Spacing.md,
    marginTop: Spacing.md, borderLeftWidth: 4,
  },
});

export default QRScannerScreen;
