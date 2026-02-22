import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useLanguage } from '../utils/i18n';
import { useTheme } from '../context/ThemeContext';
import { createTextStyles, Spacing, Radius, FontSizes, Shadow } from '../utils/theme';
import { readSourceForClone, writeCloneToTarget, cancelNFC, isNFCEnabled } from '../services/nfcService';
import { CloneOperation } from '../types';

type CloneStep = 'idle' | 'reading_source' | 'source_ready' | 'writing_target' | 'done' | 'error';

const CloneNFCScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { t } = useLanguage();
  const { colors } = useTheme();
  const ts = createTextStyles(colors);
  const [step, setStep] = useState<CloneStep>('idle');
  const [cloneOp, setCloneOp] = useState<CloneOperation | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [nfcAvailable, setNfcAvailable] = useState<boolean | null>(null);
  const pulseAnim = useState(new Animated.Value(1))[0];

  useEffect(() => {
    isNFCEnabled().then(setNfcAvailable);
    return () => { cancelNFC(); };
  }, []);

  const isScanning = step === 'reading_source' || step === 'writing_target';

  useEffect(() => {
    if (isScanning) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.12, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isScanning]);

  const handleReadSource = async () => {
    setStep('reading_source');
    setErrorMsg('');

    try {
      const result = await readSourceForClone();
      if (result.status === 'waiting_target') {
        setCloneOp(result);
        setStep('source_ready');
      } else {
        setStep('error');
        setErrorMsg(t['error.readFailed']);
      }
    } catch (err: any) {
      setStep('error');
      setErrorMsg(err?.message || t['error.readFailed']);
    }
  };

  const handleWriteTarget = async () => {
    if (!cloneOp) return;
    setStep('writing_target');
    setErrorMsg('');

    try {
      const result = await writeCloneToTarget(cloneOp);
      if (result.status === 'done') {
        setCloneOp(result);
        setStep('done');
      } else {
        setStep('error');
        setErrorMsg(t['error.writeFailed']);
      }
    } catch (err: any) {
      setStep('error');
      setErrorMsg(err?.message || t['error.writeFailed']);
    }
  };

  const handleCancel = async () => {
    await cancelNFC();
    if (step === 'reading_source') setStep('idle');
    else if (step === 'writing_target') setStep('source_ready');
  };

  const handleReset = () => {
    setStep('idle');
    setCloneOp(null);
    setErrorMsg('');
  };

  const getStepNumber = (s: CloneStep): number => {
    if (s === 'idle' || s === 'reading_source') return 1;
    if (s === 'source_ready' || s === 'writing_target') return 2;
    return 3;
  };

  const currentStep = getStepNumber(step);

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={colors.statusBarStyle} backgroundColor={colors.bg} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => navigation.goBack()}>
          <Text style={[styles.backBtnText, { color: colors.text }]}>{'<'}</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={[ts.headingMedium, { fontWeight: '700' }]}>{t['nfc.cloneCard']}</Text>
          <Text style={[ts.bodySmall, { color: colors.textMuted }]}>NDEF Clone</Text>
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {nfcAvailable === false && (
          <View style={[styles.alertBox, { backgroundColor: colors.dangerGlow, borderColor: colors.danger }]}>
            <Text style={[styles.alertText, { color: colors.danger }]}>{t['error.nfcNotAvailable']}</Text>
          </View>
        )}

        {/* Step Progress */}
        <View style={styles.progressBar}>
          {[1, 2, 3].map(s => (
            <React.Fragment key={s}>
              <View style={[
                styles.stepDot,
                { backgroundColor: s <= currentStep ? colors.primary : colors.border },
              ]}>
                <Text style={[styles.stepDotText, { color: s <= currentStep ? '#fff' : colors.textMuted }]}>
                  {s === 3 && step === 'done' ? '✓' : s}
                </Text>
              </View>
              {s < 3 && (
                <View style={[
                  styles.stepLine,
                  { backgroundColor: s < currentStep ? colors.primary : colors.border },
                ]} />
              )}
            </React.Fragment>
          ))}
        </View>

        <View style={styles.progressLabels}>
          <Text style={[ts.labelSmall, { color: currentStep >= 1 ? colors.primary : colors.textMuted }]}>Source</Text>
          <Text style={[ts.labelSmall, { color: currentStep >= 2 ? colors.primary : colors.textMuted }]}>Target</Text>
          <Text style={[ts.labelSmall, { color: currentStep >= 3 ? colors.primary : colors.textMuted }]}>Done</Text>
        </View>

        {/* Step 1: Read Source */}
        <View style={[styles.stepCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.stepCardHeader}>
            <Text style={[ts.bodyLarge, { fontWeight: '700' }]}>{t['nfc.sourceTag']}</Text>
            {cloneOp && step !== 'idle' && (
              <View style={[styles.badge, { backgroundColor: colors.successGlow }]}>
                <Text style={[styles.badgeText, { color: colors.success }]}>Done</Text>
              </View>
            )}
          </View>

          {cloneOp && step !== 'idle' ? (
            <View style={[styles.tagInfo, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={[ts.labelSmall]}>UID</Text>
              <Text style={{ fontFamily: 'monospace', fontSize: FontSizes.md, color: colors.secondary }}>
                {cloneOp.sourceTag.id}
              </Text>
              <Text style={[ts.labelSmall, { marginTop: Spacing.sm }]}>
                {cloneOp.sourceRecords.length} NDEF Record(s)
              </Text>
            </View>
          ) : (
            <Text style={[ts.bodySmall, { marginTop: Spacing.sm }]}>
              {step === 'reading_source' ? 'Hold source card near device...' : 'Tap to read the source NFC tag'}
            </Text>
          )}
        </View>

        {/* Step 2: Write Target */}
        {(step === 'source_ready' || step === 'writing_target' || step === 'done') && (
          <View style={[styles.stepCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.stepCardHeader}>
              <Text style={[ts.bodyLarge, { fontWeight: '700' }]}>{t['nfc.targetTag']}</Text>
              {step === 'done' && cloneOp?.targetTag && (
                <View style={[styles.badge, { backgroundColor: colors.successGlow }]}>
                  <Text style={[styles.badgeText, { color: colors.success }]}>Done</Text>
                </View>
              )}
            </View>

            {step === 'done' && cloneOp?.targetTag ? (
              <View style={[styles.tagInfo, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[ts.labelSmall]}>Target UID</Text>
                <Text style={{ fontFamily: 'monospace', fontSize: FontSizes.md, color: colors.secondary }}>
                  {cloneOp.targetTag.id}
                </Text>
              </View>
            ) : (
              <Text style={[ts.bodySmall, { marginTop: Spacing.sm }]}>
                {step === 'writing_target' ? 'Hold target card near device...' : 'Tap to write data to the target tag'}
              </Text>
            )}
          </View>
        )}

        {/* Scanning Indicator */}
        {isScanning && (
          <View style={[styles.scanningArea, { borderColor: colors.primary }]}>
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <Text style={styles.scanningIcon}>{'📡'}</Text>
            </Animated.View>
            <Text style={[ts.bodyMedium, { fontWeight: '600', marginTop: Spacing.md }]}>
              {step === 'reading_source' ? t['nfc.readingSource'] : t['nfc.writingData']}
            </Text>
          </View>
        )}

        {/* Error */}
        {step === 'error' && (
          <View style={[styles.errorCard, { backgroundColor: colors.dangerGlow, borderColor: colors.danger }]}>
            <Text style={[ts.bodyMedium, { color: colors.danger, fontWeight: '600' }]}>{errorMsg}</Text>
          </View>
        )}

        {/* Success */}
        {step === 'done' && (
          <View style={[styles.successArea, { backgroundColor: colors.successGlow, borderColor: colors.success }]}>
            <Text style={styles.successIcon}>{'✓'}</Text>
            <Text style={[ts.bodyLarge, { color: colors.success, fontWeight: '700' }]}>
              {t['nfc.cloneSuccess']}
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.buttonRow}>
          {step === 'idle' && (
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: colors.primary }, Shadow.md]}
              onPress={handleReadSource}
              disabled={nfcAvailable === false}>
              <Text style={styles.primaryButtonText}>Read Source Tag</Text>
            </TouchableOpacity>
          )}

          {step === 'reading_source' && (
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: colors.danger }, Shadow.md]}
              onPress={handleCancel}>
              <Text style={styles.primaryButtonText}>{t['common.cancel']}</Text>
            </TouchableOpacity>
          )}

          {step === 'source_ready' && (
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: colors.primary }, Shadow.md]}
              onPress={handleWriteTarget}>
              <Text style={styles.primaryButtonText}>Write to Target Tag</Text>
            </TouchableOpacity>
          )}

          {step === 'writing_target' && (
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: colors.danger }, Shadow.md]}
              onPress={handleCancel}>
              <Text style={styles.primaryButtonText}>{t['common.cancel']}</Text>
            </TouchableOpacity>
          )}

          {(step === 'done' || step === 'error') && (
            <View style={styles.doneRow}>
              <TouchableOpacity
                style={[styles.secondaryButton, { borderColor: colors.border, flex: 1 }]}
                onPress={handleReset}>
                <Text style={[ts.labelMedium, { color: colors.primary, fontWeight: '600' }]}>Clone Another</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.secondaryButton, { backgroundColor: colors.primary, borderColor: colors.primary, flex: 1 }]}
                onPress={() => navigation.goBack()}>
                <Text style={[ts.labelMedium, { color: '#fff', fontWeight: '600' }]}>{t['common.close']}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.md,
    gap: Spacing.md,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: Radius.md,
    borderWidth: 1, justifyContent: 'center', alignItems: 'center',
  },
  backBtnText: { fontSize: 18, fontWeight: '600' },
  headerTitleWrap: { flex: 1 },
  content: { flex: 1 },
  contentContainer: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.lg, paddingBottom: Spacing.xxxxl },
  alertBox: {
    borderRadius: Radius.md, padding: Spacing.md,
    borderWidth: 1, marginBottom: Spacing.lg,
  },
  alertText: { fontSize: FontSizes.sm, fontWeight: '600' },
  progressBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.sm, paddingHorizontal: Spacing.xl,
  },
  stepDot: {
    width: 32, height: 32, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center',
  },
  stepDotText: { fontSize: FontSizes.sm, fontWeight: '700' },
  stepLine: { flex: 1, height: 2, marginHorizontal: Spacing.sm },
  progressLabels: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, marginBottom: Spacing.xl,
  },
  stepCard: {
    borderRadius: Radius.lg, padding: Spacing.lg, borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  stepCardHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  badge: {
    paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: Radius.sm,
  },
  badgeText: { fontSize: FontSizes.xs, fontWeight: '700' },
  tagInfo: {
    marginTop: Spacing.md, borderRadius: Radius.md, padding: Spacing.md,
    borderWidth: 1,
  },
  scanningArea: {
    borderRadius: Radius.xl, padding: Spacing.xxl,
    borderWidth: 2, borderStyle: 'dashed',
    alignItems: 'center', marginBottom: Spacing.lg,
  },
  scanningIcon: { fontSize: 48 },
  errorCard: {
    borderRadius: Radius.lg, padding: Spacing.lg,
    borderWidth: 1, marginBottom: Spacing.lg,
  },
  successArea: {
    borderRadius: Radius.lg, padding: Spacing.lg, borderWidth: 1,
    alignItems: 'center', flexDirection: 'row', justifyContent: 'center',
    gap: Spacing.md, marginBottom: Spacing.lg,
  },
  successIcon: { fontSize: 24, color: '#10b981' },
  buttonRow: { marginTop: Spacing.md },
  primaryButton: {
    borderRadius: Radius.lg, paddingVertical: 16, alignItems: 'center',
  },
  primaryButtonText: { color: '#fff', fontWeight: '700', fontSize: FontSizes.lg },
  doneRow: { flexDirection: 'row', gap: Spacing.md },
  secondaryButton: {
    borderRadius: Radius.md, paddingVertical: Spacing.md,
    alignItems: 'center', borderWidth: 1,
  },
});

export default CloneNFCScreen;
