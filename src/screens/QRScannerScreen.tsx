import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { Colors, Spacing, Radius, FontSizes, TextStyles, Shadow } from '../utils/theme';
import { useLanguage } from '../utils/i18n';
import * as qrService from '../services/qrService';
import { BackendPairingData } from '../services/qrService';

type ScreenMode = 'scan' | 'manual' | 'preview' | 'pairing' | 'result';

interface PairingState {
  mode: ScreenMode;
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
  const { t, lang } = useLanguage();
  const [state, setState] = useState<PairingState>({
    mode: 'scan',
    loading: false,
    success: false,
    isPaired: false,
  });
  const [manualInput, setManualInput] = useState('');
  const [scanAnimation] = useState(new Animated.Value(0));

  // Check current pairing status on mount
  useEffect(() => {
    checkPairingStatus();
  }, []);

  // Scan line animation
  useEffect(() => {
    if (state.mode === 'scan') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanAnimation, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: false,
          }),
          Animated.timing(scanAnimation, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: false,
          }),
        ])
      ).start();
    }
  }, [state.mode, scanAnimation]);

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

  const handleDemoScan = () => {
    const demoData = qrService.generateDemoQRData();
    setState(prev => ({ ...prev, mode: 'preview', qrData: demoData }));
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
        lang === 'th'
          ? 'รูปแบบ QR ไม่ถูกต้องหรือหมดอายุ'
          : 'QR format is invalid or expired'
      );
      return;
    }
    setState(prev => ({ ...prev, mode: 'preview', qrData: data }));
    setManualInput('');
  };

  const handleConfirmPairing = async () => {
    if (!state.qrData) return;

    setState(prev => ({ ...prev, mode: 'pairing', loading: true }));

    const result = await qrService.pairWithBackend(state.qrData);

    setState(prev => ({
      ...prev,
      mode: 'result',
      loading: false,
      success: result.success,
      message: result.message,
      orgName: result.orgName,
      isPaired: result.success,
      currentOrg: result.success ? result.orgName : prev.currentOrg,
    }));

    if (result.success) {
      setTimeout(() => handleClose(), 3000);
    }
  };

  const handleUnpair = () => {
    Alert.alert(
      lang === 'th' ? 'ยกเลิกการจับคู่' : 'Unpair Device',
      lang === 'th'
        ? 'ต้องการยกเลิกการเชื่อมต่อกับระบบหลังบ้านหรือไม่?'
        : 'Do you want to disconnect from the backend system?',
      [
        { text: lang === 'th' ? 'ยกเลิก' : 'Cancel', style: 'cancel' },
        {
          text: lang === 'th' ? 'ยืนยัน' : 'Confirm',
          style: 'destructive',
          onPress: async () => {
            await qrService.unpairFromBackend();
            setState(prev => ({
              ...prev,
              isPaired: false,
              currentOrg: undefined,
              currentApiUrl: undefined,
              pairedAt: undefined,
              mode: 'scan',
            }));
          },
        },
      ]
    );
  };

  const handleReset = () => {
    setState(prev => ({
      ...prev,
      mode: 'scan',
      qrData: undefined,
      success: false,
      message: undefined,
    }));
    setManualInput('');
  };

  const scanLinePos = scanAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  // ──────────────────────────────────────────────
  //  HEADER
  // ──────────────────────────────────────────────
  const Header = ({ title, showBack = true }: { title: string; showBack?: boolean }) => (
    <View style={styles.header}>
      {showBack ? (
        <TouchableOpacity
          onPress={state.mode === 'scan' || state.mode === 'result' ? handleClose : handleReset}
          style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
      ) : (
        <View style={{ width: 44 }} />
      )}
      <Text style={styles.headerTitle}>{title}</Text>
      <View style={{ width: 44 }} />
    </View>
  );

  // ──────────────────────────────────────────────
  //  SCAN MODE (Main)
  // ──────────────────────────────────────────────
  if (state.mode === 'scan') {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />
        <Header title={lang === 'th' ? 'จับคู่ระบบ' : 'System Pairing'} />

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          {/* Current Status */}
          {state.isPaired && (
            <View style={styles.statusCard}>
              <View style={styles.statusDot} />
              <View style={styles.statusInfo}>
                <Text style={styles.statusLabel}>
                  {lang === 'th' ? 'เชื่อมต่อแล้ว' : 'Connected'}
                </Text>
                <Text style={styles.statusOrg}>{state.currentOrg || 'Thaiprompt'}</Text>
                <Text style={styles.statusUrl}>{state.currentApiUrl}</Text>
                {state.pairedAt && (
                  <Text style={styles.statusDate}>
                    {lang === 'th' ? 'จับคู่เมื่อ' : 'Paired'}: {new Date(state.pairedAt).toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-US')}
                  </Text>
                )}
              </View>
              <TouchableOpacity style={styles.unpairButton} onPress={handleUnpair}>
                <Text style={styles.unpairButtonText}>
                  {lang === 'th' ? 'ยกเลิก' : 'Unpair'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Scanner Area */}
          <View style={styles.scannerContainer}>
            <View style={styles.scannerFrame}>
              <View style={styles.scanArea}>
                {/* Corner markers */}
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />

                {/* Scan line */}
                <Animated.View style={[styles.scanLine, { top: scanLinePos as any }]} />

                <Text style={styles.scanText}>
                  {lang === 'th'
                    ? 'สแกน QR จากหน้าแอดมิน\nThaiprompt เพื่อจับคู่แอพ'
                    : 'Scan QR from Thaiprompt\nadmin panel to pair app'}
                </Text>
              </View>
            </View>
          </View>

          {/* Instructions */}
          <View style={styles.instructionBox}>
            <Text style={styles.instructionTitle}>
              {lang === 'th' ? '📱 วิธีจับคู่แอพกับระบบ' : '📱 How to Pair App'}
            </Text>
            <Text style={styles.instructionText}>
              {lang === 'th'
                ? '1. เปิดหน้าแอดมิน Thaiprompt\n2. ไปที่ NFC Management → สร้าง QR จับคู่\n3. สแกน QR หรือป้อนรหัสเชื่อมต่อ\n4. แอพจะตั้งค่า API อัตโนมัติ'
                : '1. Open Thaiprompt admin panel\n2. Go to NFC Management → Generate Pairing QR\n3. Scan QR or enter connection code\n4. App will auto-configure API settings'}
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonGroup}>
            <TouchableOpacity style={styles.primaryButton} onPress={handleDemoScan} activeOpacity={0.7}>
              <Text style={styles.primaryButtonText}>
                🎬 {lang === 'th' ? 'ทดสอบจับคู่' : 'Demo Pairing'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => setState(prev => ({ ...prev, mode: 'manual' }))}
              activeOpacity={0.7}>
              <Text style={styles.secondaryButtonText}>
                ⌨️ {lang === 'th' ? 'ป้อนรหัสเชื่อมต่อ' : 'Enter Connection Code'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  // ──────────────────────────────────────────────
  //  MANUAL INPUT MODE
  // ──────────────────────────────────────────────
  if (state.mode === 'manual') {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />
        <Header title={lang === 'th' ? 'ป้อนรหัสเชื่อมต่อ' : 'Enter Code'} />

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>
              {lang === 'th' ? 'รหัส JSON จาก QR' : 'QR JSON Code'}
            </Text>
            <TextInput
              style={styles.textInput}
              value={manualInput}
              onChangeText={setManualInput}
              placeholder={lang === 'th' ? 'วาง JSON ที่นี่...' : 'Paste JSON here...'}
              placeholderTextColor={Colors.textMuted}
              multiline
              numberOfLines={8}
              textAlignVertical="top"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <View style={styles.formatHint}>
              <Text style={styles.formatHintTitle}>
                {lang === 'th' ? 'รูปแบบข้อมูล:' : 'Expected format:'}
              </Text>
              <Text style={styles.formatHintCode}>
                {`{\n  "api_url": "https://...",\n  "api_key": "your-key",\n  "device_token": "token",\n  "org_name": "Org Name"\n}`}
              </Text>
            </View>
          </View>

          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[styles.primaryButton, !manualInput.trim() && styles.buttonDisabled]}
              onPress={handleManualSubmit}
              disabled={!manualInput.trim()}
              activeOpacity={0.7}>
              <Text style={styles.primaryButtonText}>
                ✓ {lang === 'th' ? 'ตรวจสอบ' : 'Verify'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} onPress={handleReset} activeOpacity={0.7}>
              <Text style={styles.secondaryButtonText}>
                {lang === 'th' ? 'ยกเลิก' : 'Cancel'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  // ──────────────────────────────────────────────
  //  PREVIEW MODE (Confirm before pairing)
  // ──────────────────────────────────────────────
  if (state.mode === 'preview' && state.qrData) {
    const data = state.qrData;
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />
        <Header title={lang === 'th' ? 'ยืนยันการจับคู่' : 'Confirm Pairing'} />

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          {/* Backend Info Card */}
          <View style={styles.previewCard}>
            <View style={styles.previewIcon}>
              <Text style={{ fontSize: 36 }}>🔗</Text>
            </View>
            <Text style={styles.previewTitle}>
              {data.org_name || 'Thaiprompt Backend'}
            </Text>
            <Text style={styles.previewSubtitle}>
              {lang === 'th' ? 'ระบบหลังบ้าน' : 'Backend System'}
            </Text>
          </View>

          {/* Connection Details */}
          <View style={styles.detailsCard}>
            <DetailRow
              label={lang === 'th' ? 'เซิร์ฟเวอร์' : 'Server'}
              value={data.api_url}
            />
            <DetailRow
              label={lang === 'th' ? 'องค์กร' : 'Organization'}
              value={data.org_name || '-'}
            />
            <DetailRow
              label="API Key"
              value={`${data.api_key.substring(0, 8)}****`}
            />
            <DetailRow
              label={lang === 'th' ? 'สิทธิ์' : 'Permissions'}
              value={(data.permissions || []).join(', ')}
            />
            <DetailRow
              label={lang === 'th' ? 'หมดอายุ' : 'Expires'}
              value={new Date(data.expires_at).toLocaleString(
                lang === 'th' ? 'th-TH' : 'en-US'
              )}
              isLast
            />
          </View>

          {/* Warning */}
          <View style={styles.warningBox}>
            <Text style={styles.warningText}>
              {lang === 'th'
                ? '⚠️ การจับคู่จะตั้งค่า API ให้อัตโนมัติ หากเชื่อมต่ออยู่แล้วจะถูกแทนที่'
                : '⚠️ Pairing will auto-configure API settings. Existing connection will be replaced.'}
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonGroup}>
            <TouchableOpacity style={styles.successButton} onPress={handleConfirmPairing} activeOpacity={0.7}>
              <Text style={styles.primaryButtonText}>
                🔗 {lang === 'th' ? 'จับคู่เลย' : 'Pair Now'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} onPress={handleReset} activeOpacity={0.7}>
              <Text style={styles.secondaryButtonText}>
                {lang === 'th' ? 'ยกเลิก' : 'Cancel'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  // ──────────────────────────────────────────────
  //  PAIRING IN PROGRESS
  // ──────────────────────────────────────────────
  if (state.mode === 'pairing') {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />
        <View style={styles.centerContent}>
          <View style={styles.pairingAnimation}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
          <Text style={styles.pairingText}>
            {lang === 'th' ? 'กำลังจับคู่กับระบบหลังบ้าน...' : 'Pairing with backend system...'}
          </Text>
          <Text style={styles.pairingSubtext}>
            {lang === 'th' ? 'ตั้งค่า API และลงทะเบียนอุปกรณ์' : 'Configuring API and registering device'}
          </Text>
        </View>
      </View>
    );
  }

  // ──────────────────────────────────────────────
  //  RESULT
  // ──────────────────────────────────────────────
  if (state.mode === 'result') {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />
        <View style={styles.centerContent}>
          <View style={[styles.resultCircle, state.success ? styles.resultSuccess : styles.resultError]}>
            <Text style={styles.resultIcon}>{state.success ? '✓' : '✕'}</Text>
          </View>
          <Text style={[styles.resultTitle, state.success ? { color: Colors.success } : { color: Colors.error }]}>
            {state.success
              ? (lang === 'th' ? 'จับคู่สำเร็จ!' : 'Pairing Successful!')
              : (lang === 'th' ? 'จับคู่ล้มเหลว' : 'Pairing Failed')}
          </Text>
          {state.orgName && state.success && (
            <Text style={styles.resultOrg}>{state.orgName}</Text>
          )}
          <Text style={styles.resultMessage}>{state.message}</Text>

          {!state.success && (
            <View style={[styles.buttonGroup, { width: '100%' }]}>
              <TouchableOpacity style={styles.primaryButton} onPress={handleReset} activeOpacity={0.7}>
                <Text style={styles.primaryButtonText}>
                  🔄 {lang === 'th' ? 'ลองอีกครั้ง' : 'Try Again'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryButton} onPress={handleClose} activeOpacity={0.7}>
                <Text style={styles.secondaryButtonText}>
                  {lang === 'th' ? 'ปิด' : 'Close'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  }

  return null;
};

// ──────────────────────────────────────────────
//  Detail Row Component
// ──────────────────────────────────────────────
const DetailRow = ({ label, value, isLast = false }: { label: string; value: string; isLast?: boolean }) => (
  <View style={[styles.detailRow, !isLast && styles.detailRowBorder]}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue} numberOfLines={2}>{value}</Text>
  </View>
);

// ============================================================
//  Styles
// ============================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 22,
    color: Colors.secondary,
  },
  headerTitle: {
    ...TextStyles.headingMedium,
    color: Colors.text,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },

  // Status Card (connected)
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.success + '40',
    ...Shadow.sm,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.success,
    marginRight: Spacing.md,
  },
  statusInfo: { flex: 1 },
  statusLabel: {
    ...TextStyles.labelSmall,
    color: Colors.success,
    textTransform: 'uppercase',
  },
  statusOrg: {
    ...TextStyles.bodyLarge,
    color: Colors.text,
    fontWeight: '600',
    marginTop: 2,
  },
  statusUrl: {
    ...TextStyles.bodySmall,
    color: Colors.textMuted,
    marginTop: 2,
  },
  statusDate: {
    ...TextStyles.bodySmall,
    color: Colors.textMuted,
    marginTop: 4,
  },
  unpairButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.error + '60',
  },
  unpairButtonText: {
    ...TextStyles.labelSmall,
    color: Colors.error,
  },

  // Scanner
  scannerContainer: {
    marginVertical: Spacing.md,
    alignItems: 'center',
  },
  scannerFrame: {
    width: '100%',
    maxWidth: 300,
    aspectRatio: 1,
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadow.md,
  },
  scanArea: {
    flex: 1,
    backgroundColor: Colors.bg,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  corner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: Colors.primary,
  },
  topLeft: { top: 12, left: 12, borderTopWidth: 3, borderLeftWidth: 3 },
  topRight: { top: 12, right: 12, borderTopWidth: 3, borderRightWidth: 3 },
  bottomLeft: { bottom: 12, left: 12, borderBottomWidth: 3, borderLeftWidth: 3 },
  bottomRight: { bottom: 12, right: 12, borderBottomWidth: 3, borderRightWidth: 3 },
  scanLine: {
    position: 'absolute',
    width: '75%',
    height: 2,
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 5,
  },
  scanText: {
    ...TextStyles.bodySmall,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },

  // Instructions
  instructionBox: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginVertical: Spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  instructionTitle: {
    ...TextStyles.bodyLarge,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  instructionText: {
    ...TextStyles.bodySmall,
    color: Colors.textSecondary,
    lineHeight: 24,
  },

  // Buttons
  buttonGroup: {
    marginTop: Spacing.lg,
    gap: Spacing.md,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md + 2,
    alignItems: 'center',
    ...Shadow.sm,
  },
  successButton: {
    backgroundColor: Colors.success,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md + 2,
    alignItems: 'center',
    ...Shadow.sm,
  },
  secondaryButton: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md + 2,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  buttonDisabled: { opacity: 0.4 },
  primaryButtonText: {
    ...TextStyles.labelLarge,
    color: Colors.text,
    fontWeight: '600',
  },
  secondaryButtonText: {
    ...TextStyles.labelLarge,
    color: Colors.textSecondary,
    fontWeight: '600',
  },

  // Manual Input
  inputSection: { marginVertical: Spacing.md },
  inputLabel: {
    ...TextStyles.labelLarge,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  textInput: {
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    color: Colors.text,
    fontSize: FontSizes.sm,
    fontFamily: 'monospace',
    minHeight: 160,
  },
  formatHint: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginTop: Spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  formatHintTitle: {
    ...TextStyles.labelSmall,
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  formatHintCode: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: Colors.textSecondary,
    lineHeight: 18,
  },

  // Preview Card
  previewCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.primary + '30',
    ...Shadow.md,
  },
  previewIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  previewTitle: {
    ...TextStyles.headingMedium,
    color: Colors.text,
    textAlign: 'center',
  },
  previewSubtitle: {
    ...TextStyles.bodySmall,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },

  // Details Card
  detailsCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    marginTop: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  detailRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  detailLabel: {
    ...TextStyles.bodySmall,
    color: Colors.textMuted,
    flex: 1,
  },
  detailValue: {
    ...TextStyles.bodySmall,
    color: Colors.text,
    flex: 2,
    textAlign: 'right',
  },

  // Warning
  warningBox: {
    backgroundColor: Colors.warning + '12',
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginTop: Spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: Colors.warning,
  },
  warningText: {
    ...TextStyles.bodySmall,
    color: Colors.warning,
    lineHeight: 20,
  },

  // Pairing animation
  pairingAnimation: { marginBottom: Spacing.xl },
  pairingText: {
    ...TextStyles.headingSmall,
    color: Colors.text,
    marginTop: Spacing.lg,
    textAlign: 'center',
  },
  pairingSubtext: {
    ...TextStyles.bodySmall,
    color: Colors.textMuted,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },

  // Result
  resultCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  resultSuccess: { backgroundColor: Colors.success + '20' },
  resultError: { backgroundColor: Colors.error + '20' },
  resultIcon: {
    fontSize: 44,
    fontWeight: 'bold',
    color: Colors.text,
  },
  resultTitle: {
    ...TextStyles.headingMedium,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  resultOrg: {
    ...TextStyles.bodyLarge,
    color: Colors.secondary,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  resultMessage: {
    ...TextStyles.bodyMedium,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
});

export default QRScannerScreen;
