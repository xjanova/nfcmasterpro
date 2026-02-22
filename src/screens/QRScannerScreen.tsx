import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  FlatList,
  Alert,
  Animated,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Spacing, Radius, FontSizes, TextStyles, Shadow, Gradient } from '../utils/theme';
import { useLanguage } from '../utils/i18n';
import { Member, QRPairingData } from '../types';
import * as qrService from '../services/qrService';
import * as storageService from '../services/storageService';
import LinearGradient from 'react-native-linear-gradient';

interface ScanState {
  mode: 'camera' | 'manual' | 'verifying' | 'member_select' | 'result';
  qrData?: QRPairingData;
  members: Member[];
  selectedMember?: Member;
  loading: boolean;
  error?: string;
  success: boolean;
  successMessage?: string;
}

const QRScannerScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const { t, lang } = useLanguage();
  const [state, setState] = useState<ScanState>({
    mode: 'camera',
    members: [],
    loading: false,
    success: false,
  });

  const [manualInput, setManualInput] = useState('');
  const [scanAnimation] = useState(new Animated.Value(0));

  // Load members on screen focus
  useFocusEffect(
    React.useCallback(() => {
      loadMembers();
    }, [])
  );

  const loadMembers = async () => {
    try {
      const members = await storageService.getMembers();
      setState(prev => ({ ...prev, members }));
    } catch (error) {
      console.error('Error loading members:', error);
    }
  };

  // Scan animation loop
  useEffect(() => {
    if (state.mode === 'camera') {
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

  const handleDemoScan = () => {
    const demoData = qrService.generateDemoQRData();
    setState(prev => ({
      ...prev,
      mode: 'member_select',
      qrData: demoData,
    }));
  };

  const handleManualInput = () => {
    if (!manualInput.trim()) {
      Alert.alert(t('error.invalidData'), t('qr.enterQRData'));
      return;
    }

    const qrData = qrService.decodeQRPayload(manualInput);
    if (!qrData) {
      Alert.alert(t('qr.invalidQR'), t('error.invalidData'));
      return;
    }

    setState(prev => ({
      ...prev,
      mode: 'member_select',
      qrData,
    }));
    setManualInput('');
  };

  const handleVerifyAndPair = async () => {
    if (!state.qrData || !state.selectedMember) {
      Alert.alert(t('error.error'), t('qr.selectMemberMessage'));
      return;
    }

    setState(prev => ({ ...prev, mode: 'verifying', loading: true, error: undefined }));

    try {
      const result = await qrService.verifyAndPairCard(
        JSON.stringify(state.qrData),
        state.selectedMember.id
      );

      if (result.success) {
        setState(prev => ({
          ...prev,
          mode: 'result',
          success: true,
          successMessage: result.message,
          loading: false,
        }));

        // Auto-close after 3 seconds
        setTimeout(() => {
          handleClose();
        }, 3000);
      } else {
        setState(prev => ({
          ...prev,
          mode: 'result',
          success: false,
          error: result.message,
          loading: false,
        }));
      }
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        mode: 'result',
        success: false,
        error: error.message || t('error.unknownError'),
        loading: false,
      }));
    }
  };

  const handleClose = () => {
    navigation?.goBack?.();
  };

  const handleReset = () => {
    setState(prev => ({
      ...prev,
      mode: 'camera',
      qrData: undefined,
      selectedMember: undefined,
      error: undefined,
      success: false,
    }));
    setManualInput('');
  };

  const scanLineInterpolation = scanAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  // Render Camera/Scan Mode
  if (state.mode === 'camera') {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.backButton}>
            <Text style={styles.backButtonText}>← {t('common.back')}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('qr.scanner')}</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Camera Simulation Area */}
          <View style={styles.cameraContainer}>
            <LinearGradient
              colors={[Colors.card, Colors.border]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cameraFrame}>
              <View style={styles.scanArea}>
                {/* Corner markers */}
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />

                {/* Animated scan line */}
                <Animated.View
                  style={[
                    styles.scanLine,
                    {
                      top: scanLineInterpolation as any,
                    },
                  ]}
                />

                <Text style={styles.cameraText}>{t('qr.scanCard')}</Text>
              </View>
            </LinearGradient>
          </View>

          {/* Instructions */}
          <View style={styles.instructionContainer}>
            <Text style={styles.instructionTitle}>
              {lang === 'th' ? '📱 วิธีใช้ Scanner' : '📱 How to Use Scanner'}
            </Text>
            <Text style={styles.instructionText}>
              {lang === 'th'
                ? '1. จัดแนวบัตร QR ให้อยู่ในกรอบสแกน\n2. อยู่นิ่งจนกว่าจะสแกนสำเร็จ\n3. เลือกสมาชิกเพื่อจับคู่บัตร'
                : '1. Align QR code in the scan frame\n2. Keep still until scan complete\n3. Select member to pair card'}
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={[styles.button, styles.buttonPrimary]}
              onPress={handleDemoScan}
              activeOpacity={0.7}>
              <LinearGradient
                colors={Gradient.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.buttonGradient}>
                <Text style={styles.buttonTextPrimary}>🎬 {t('qr.demoScan')}</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.buttonSecondary]}
              onPress={() => setState(prev => ({ ...prev, mode: 'manual' }))}
              activeOpacity={0.7}>
              <Text style={styles.buttonTextSecondary}>⌨️ {t('qr.manualInput')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  // Render Manual Input Mode
  if (state.mode === 'manual') {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setState(prev => ({ ...prev, mode: 'camera' }))} style={styles.backButton}>
            <Text style={styles.backButtonText}>← {t('common.back')}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('qr.manualInput')}</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Input Field */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>{t('qr.enterQRData')}</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputIcon}>📋</Text>
              <View style={styles.textInputContainer}>
                <Text style={styles.inputValue}>{manualInput || 'Paste QR data here...'}</Text>
              </View>
            </View>

            {/* Info Box */}
            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>JSON Format:</Text>
              <Text style={styles.infoText}>{`{"card_number":"...",\n"pairing_token":"...",\n"expires_at":"..."}`}</Text>
            </View>

            {/* Paste Area */}
            <TouchableOpacity
              style={styles.pasteArea}
              onPress={() => {
                // In real app, use react-native-clipboard
                Alert.prompt(t('qr.enterQRData'), 'Paste JSON:', [
                  {
                    text: t('common.cancel'),
                    onPress: () => {},
                    style: 'cancel',
                  },
                  {
                    text: t('common.confirm'),
                    onPress: (text) => setManualInput(text || ''),
                  },
                ]);
              }}>
              <Text style={styles.pasteText}>📌 Paste QR Data</Text>
            </TouchableOpacity>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={[styles.button, styles.buttonPrimary]}
              onPress={handleManualInput}
              disabled={!manualInput.trim()}
              activeOpacity={0.7}>
              <LinearGradient
                colors={Gradient.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.buttonGradient}>
                <Text style={styles.buttonTextPrimary}>✓ {t('common.confirm')}</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.buttonSecondary]}
              onPress={() => setState(prev => ({ ...prev, mode: 'camera' }))}
              activeOpacity={0.7}>
              <Text style={styles.buttonTextSecondary}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  // Render Member Selection Mode
  if (state.mode === 'member_select' && state.qrData) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setState(prev => ({ ...prev, mode: 'camera', qrData: undefined }))} style={styles.backButton}>
            <Text style={styles.backButtonText}>← {t('common.back')}</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('qr.selectMember')}</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Card Info */}
          <View style={styles.cardInfoContainer}>
            <LinearGradient
              colors={[Colors.card, Colors.border]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardInfoBox}>
              <View style={styles.cardInfoRow}>
                <Text style={styles.cardInfoLabel}>{t('qr.cardNumber')}</Text>
                <Text style={styles.cardInfoValue}>{qrService.formatCardNumber(state.qrData.card_number)}</Text>
              </View>
              <View style={styles.cardInfoRow}>
                <Text style={styles.cardInfoLabel}>{t('qr.cardType')}</Text>
                <Text style={styles.cardInfoValue}>{state.qrData.card_type || 'NFC Card'}</Text>
              </View>
              <View style={styles.cardInfoRow}>
                <Text style={styles.cardInfoLabel}>{t('qr.expiresAt')}</Text>
                <Text style={styles.cardInfoValue}>{new Date(state.qrData.expires_at).toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-US')}</Text>
              </View>
            </LinearGradient>
          </View>

          {/* Member List */}
          <View style={styles.memberListContainer}>
            <Text style={styles.memberListTitle}>{t('qr.selectMemberMessage')}</Text>

            {state.members.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateIcon}>👤</Text>
                <Text style={styles.emptyStateText}>{t('qr.noMembers')}</Text>
              </View>
            ) : (
              <FlatList
                scrollEnabled={false}
                data={state.members}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.memberItem,
                      state.selectedMember?.id === item.id && styles.memberItemSelected,
                    ]}
                    onPress={() => setState(prev => ({ ...prev, selectedMember: item }))}
                    activeOpacity={0.7}>
                    <View style={styles.memberItemContent}>
                      <Text style={styles.memberName}>{item.name}</Text>
                      {item.position && <Text style={styles.memberPosition}>{item.position}</Text>}
                      {item.phone && <Text style={styles.memberPhone}>📱 {item.phone}</Text>}
                    </View>
                    {state.selectedMember?.id === item.id && (
                      <View style={styles.memberCheckmark}>
                        <Text style={styles.checkmarkIcon}>✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                )}
              />
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={[styles.button, styles.buttonPrimary, !state.selectedMember && styles.buttonDisabled]}
              onPress={handleVerifyAndPair}
              disabled={!state.selectedMember}
              activeOpacity={0.7}>
              <LinearGradient
                colors={Gradient.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.buttonGradient}>
                <Text style={styles.buttonTextPrimary}>🔗 {t('qr.pairCard')}</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.buttonSecondary]}
              onPress={() => setState(prev => ({ ...prev, mode: 'camera', qrData: undefined }))}
              activeOpacity={0.7}>
              <Text style={styles.buttonTextSecondary}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  // Render Verifying/Loading Mode
  if (state.mode === 'verifying' && state.loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />

        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>{t('qr.pairing')}</Text>
        </View>
      </View>
    );
  }

  // Render Result Mode
  if (state.mode === 'result') {
    const isSuccess = state.success;

    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />

        <View style={styles.centerContent}>
          {/* Result Icon */}
          <View style={[styles.resultIcon, isSuccess ? styles.resultIconSuccess : styles.resultIconError]}>
            <Text style={styles.resultIconText}>{isSuccess ? '✓' : '✕'}</Text>
          </View>

          {/* Result Message */}
          <Text style={[styles.resultTitle, isSuccess ? styles.resultTitleSuccess : styles.resultTitleError]}>
            {isSuccess ? t('qr.paired') : t('qr.scanFailed')}
          </Text>

          {/* Result Description */}
          <Text style={styles.resultDescription}>
            {state.successMessage || state.error || t('common.error')}
          </Text>

          {/* Action Buttons */}
          {!isSuccess && (
            <View style={styles.resultButtonsContainer}>
              <TouchableOpacity
                style={[styles.button, styles.buttonPrimary]}
                onPress={handleReset}
                activeOpacity={0.7}>
                <LinearGradient
                  colors={Gradient.primary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.buttonGradient}>
                  <Text style={styles.buttonTextPrimary}>🔄 {t('common.retry')}</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary]}
                onPress={handleClose}
                activeOpacity={0.7}>
                <Text style={styles.buttonTextSecondary}>{t('common.close')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  }

  return null;
};

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
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
  },
  backButtonText: {
    ...TextStyles.bodyMedium,
    color: Colors.secondary,
  },
  headerTitle: {
    ...TextStyles.headingMedium,
    color: Colors.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },

  // Camera Mode Styles
  cameraContainer: {
    marginVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  cameraFrame: {
    borderRadius: Radius.lg,
    padding: Spacing.md,
    ...Shadow.md,
  },
  scanArea: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: Colors.bg,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: Colors.secondary,
    borderDasharray: 5,
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: Colors.secondary,
  },
  topLeft: {
    top: Spacing.md,
    left: Spacing.md,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  topRight: {
    top: Spacing.md,
    right: Spacing.md,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  bottomLeft: {
    bottom: Spacing.md,
    left: Spacing.md,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  bottomRight: {
    bottom: Spacing.md,
    right: Spacing.md,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  scanLine: {
    position: 'absolute',
    width: '80%',
    height: 3,
    backgroundColor: Colors.secondary,
    shadowColor: Colors.secondary,
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 5,
  },
  cameraText: {
    ...TextStyles.bodyMedium,
    color: Colors.textMuted,
    marginTop: Spacing.lg,
  },

  // Instruction Styles
  instructionContainer: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginVertical: Spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: Colors.secondary,
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

  // Manual Input Styles
  inputContainer: {
    marginVertical: Spacing.lg,
  },
  inputLabel: {
    ...TextStyles.labelLarge,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.lg,
    marginBottom: Spacing.md,
  },
  inputIcon: {
    fontSize: 24,
    marginRight: Spacing.md,
  },
  textInputContainer: {
    flex: 1,
  },
  inputValue: {
    ...TextStyles.bodyMedium,
    color: Colors.text,
  },
  infoBox: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginVertical: Spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  infoTitle: {
    ...TextStyles.labelMedium,
    color: Colors.primary,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  infoText: {
    ...TextStyles.monoSmall,
    color: Colors.textSecondary,
  },
  pasteArea: {
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  pasteText: {
    ...TextStyles.labelLarge,
    color: Colors.secondary,
  },

  // Card Info Styles
  cardInfoContainer: {
    marginVertical: Spacing.lg,
  },
  cardInfoBox: {
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    ...Shadow.md,
  },
  cardInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardInfoLabel: {
    ...TextStyles.bodyMedium,
    color: Colors.textSecondary,
  },
  cardInfoValue: {
    ...TextStyles.bodyMedium,
    color: Colors.text,
    fontWeight: '600',
  },

  // Member List Styles
  memberListContainer: {
    marginVertical: Spacing.lg,
  },
  memberListTitle: {
    ...TextStyles.labelLarge,
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  emptyStateText: {
    ...TextStyles.bodyMedium,
    color: Colors.textMuted,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    padding: Spacing.lg,
    marginBottomVertical: Spacing.sm,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  memberItemSelected: {
    borderColor: Colors.primary,
    backgroundColor: `rgba(99, 102, 241, 0.1)`,
  },
  memberItemContent: {
    flex: 1,
  },
  memberName: {
    ...TextStyles.bodyLarge,
    color: Colors.text,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  memberPosition: {
    ...TextStyles.bodySmall,
    color: Colors.textSecondary,
  },
  memberPhone: {
    ...TextStyles.bodySmall,
    color: Colors.textMuted,
    marginTop: Spacing.xs,
  },
  memberCheckmark: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkIcon: {
    fontSize: 18,
    color: Colors.text,
    fontWeight: 'bold',
  },

  // Buttons Styles
  buttonsContainer: {
    marginVertical: Spacing.xl,
    gap: Spacing.md,
  },
  resultButtonsContainer: {
    marginTop: Spacing.xl,
    width: '100%',
    gap: Spacing.md,
  },
  button: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
    minHeight: 56,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadow.sm,
  },
  buttonPrimary: {
    backgroundColor: Colors.primary,
  },
  buttonSecondary: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonTextPrimary: {
    ...TextStyles.labelLarge,
    color: Colors.text,
    fontWeight: '600',
  },
  buttonTextSecondary: {
    ...TextStyles.labelLarge,
    color: Colors.text,
    fontWeight: '600',
  },

  // Result Styles
  resultIcon: {
    width: 100,
    height: 100,
    borderRadius: Radius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  resultIconSuccess: {
    backgroundColor: `rgba(16, 185, 129, 0.2)`,
  },
  resultIconError: {
    backgroundColor: `rgba(239, 68, 68, 0.2)`,
  },
  resultIconText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: Colors.text,
  },
  resultTitle: {
    ...TextStyles.headingMedium,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  resultTitleSuccess: {
    color: Colors.success,
  },
  resultTitleError: {
    color: Colors.danger,
  },
  resultDescription: {
    ...TextStyles.bodyMedium,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },

  // Loading Styles
  loadingText: {
    ...TextStyles.bodyLarge,
    color: Colors.text,
    marginTop: Spacing.lg,
  },
});

export default QRScannerScreen;
