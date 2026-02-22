import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useLanguage } from '../utils/i18n';
import { useTheme } from '../context/ThemeContext';
import { createTextStyles, Spacing, Radius, FontSizes, Shadow } from '../utils/theme';
import { readNFCTag, cancelNFC, isNFCEnabled } from '../services/nfcService';
import { NFCScanResult } from '../types';

const ReadNFCScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { t } = useLanguage();
  const { colors } = useTheme();
  const ts = createTextStyles(colors);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<NFCScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nfcAvailable, setNfcAvailable] = useState<boolean | null>(null);
  const pulseAnim = useState(new Animated.Value(1))[0];

  useEffect(() => {
    isNFCEnabled().then(setNfcAvailable);
    return () => { cancelNFC(); };
  }, []);

  useEffect(() => {
    if (scanning) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.15, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [scanning]);

  const startReading = async () => {
    setScanning(true);
    setError(null);
    setScanResult(null);

    try {
      const result = await readNFCTag();
      if (result.success) {
        setScanResult(result);
      } else {
        setError(result.errorMessage || t['error.readFailed']);
      }
    } catch (err: any) {
      setError(err?.message || t['error.readFailed']);
    } finally {
      setScanning(false);
    }
  };

  const handleCancel = async () => {
    await cancelNFC();
    setScanning(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={colors.statusBarStyle} backgroundColor={colors.bg} />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => navigation.goBack()}>
          <Text style={[styles.backBtnText, { color: colors.text }]}>{'<'}</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={[ts.headingMedium, { fontWeight: '700' }]}>{t['nfc.readCard']}</Text>
          <Text style={[ts.bodySmall, { color: colors.textMuted }]}>NDEF + Raw Data</Text>
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {/* NFC Status */}
        {nfcAvailable === false && (
          <View style={[styles.alertBox, { backgroundColor: colors.dangerGlow, borderColor: colors.danger }]}>
            <Text style={[styles.alertText, { color: colors.danger }]}>{t['error.nfcNotAvailable']}</Text>
          </View>
        )}

        {/* Scan Area */}
        <View style={[styles.scanArea, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Animated.View style={[
            styles.scanCircle,
            { backgroundColor: scanning ? colors.primaryGlow : colors.surface, borderColor: scanning ? colors.primary : colors.border },
            { transform: [{ scale: pulseAnim }] },
          ]}>
            <Text style={styles.scanIcon}>{scanning ? '📡' : '📱'}</Text>
          </Animated.View>
          <Text style={[ts.bodyLarge, { textAlign: 'center', marginTop: Spacing.lg, fontWeight: '600' }]}>
            {scanning ? t['nfc.scanning'] : t['nfc.tapCard']}
          </Text>
          <Text style={[ts.bodySmall, { textAlign: 'center', marginTop: Spacing.sm }]}>
            {scanning
              ? (t['nfc.readingSource'] || 'Hold your NFC card near the device...')
              : 'Tap the button below to start reading'}
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonRow}>
          {!scanning ? (
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: colors.primary }, Shadow.md]}
              onPress={startReading}
              disabled={nfcAvailable === false}>
              <Text style={styles.primaryButtonText}>{t['nfc.readCard']}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: colors.danger }, Shadow.md]}
              onPress={handleCancel}>
              <Text style={styles.primaryButtonText}>{t['common.cancel']}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Error Display */}
        {error && (
          <View style={[styles.errorCard, { backgroundColor: colors.dangerGlow, borderColor: colors.danger }]}>
            <Text style={[styles.errorTitle, { color: colors.danger }]}>{t['common.error']}</Text>
            <Text style={[ts.bodySmall, { color: colors.danger }]}>{error}</Text>
            <TouchableOpacity
              style={[styles.retryBtn, { borderColor: colors.danger }]}
              onPress={startReading}>
              <Text style={[ts.labelMedium, { color: colors.danger, fontWeight: '600' }]}>{t['common.retry']}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Success Result */}
        {scanResult && (
          <View style={styles.resultSection}>
            {/* Tag Info Card */}
            <View style={[styles.resultCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.resultHeader, { borderBottomColor: colors.border }]}>
                <View style={[styles.successDot, { backgroundColor: colors.success }]} />
                <Text style={[ts.headingMedium, { fontWeight: '700', flex: 1 }]}>{t['nfc.tagInfo']}</Text>
              </View>

              <DataItem label={t['nfc.tagUID']} value={scanResult.tag.id} mono colors={colors} />
              <DataItem label={t['nfc.tagType']} value={scanResult.tag.type || 'Unknown'} colors={colors} />
              {scanResult.tag.size && (
                <DataItem label={t['nfc.tagSize']} value={`${scanResult.tag.size} bytes`} colors={colors} />
              )}
              {scanResult.tag.atqa && (
                <DataItem label="ATQA" value={scanResult.tag.atqa} mono colors={colors} />
              )}
              {scanResult.tag.sak && (
                <DataItem label="SAK" value={scanResult.tag.sak} mono colors={colors} />
              )}
              <DataItem
                label={t['nfc.writable']}
                value={scanResult.tag.isWritable ? 'Yes' : 'No'}
                colors={colors}
              />
            </View>

            {/* NDEF Records */}
            {scanResult.ndefRecords.length > 0 && (
              <View style={[styles.resultCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.resultHeader, { borderBottomColor: colors.border }]}>
                  <Text style={[ts.headingMedium, { fontWeight: '700' }]}>
                    {t['nfc.ndefRecords']} ({scanResult.ndefRecords.length})
                  </Text>
                </View>
                {scanResult.ndefRecords.map((record, idx) => (
                  <View
                    key={idx}
                    style={[styles.recordItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <View style={styles.recordHeader}>
                      <View style={[styles.recordBadge, { backgroundColor: colors.primaryGlow }]}>
                        <Text style={[styles.recordBadgeText, { color: colors.primary }]}>
                          {record.recordType.toUpperCase()}
                        </Text>
                      </View>
                      <Text style={[ts.bodySmall, { color: colors.textMuted }]}>
                        {record.payloadSize} bytes
                      </Text>
                    </View>
                    <Text style={[ts.bodyMedium, { color: colors.text, marginTop: Spacing.sm }]}>
                      {record.decodedData}
                    </Text>
                    {record.language && (
                      <Text style={[ts.labelSmall, { marginTop: Spacing.xs }]}>
                        Language: {record.language}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            )}

            {/* Action Buttons for Result */}
            <View style={styles.resultActions}>
              <TouchableOpacity
                style={[styles.secondaryButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => navigation.navigate('HexView', { result: scanResult })}>
                <Text style={[ts.labelMedium, { color: colors.primary, fontWeight: '600' }]}>
                  View Hex Data
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.secondaryButton, { backgroundColor: colors.primary }]}
                onPress={startReading}>
                <Text style={[ts.labelMedium, { color: '#fff', fontWeight: '600' }]}>
                  Scan Again
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const DataItem: React.FC<{
  label: string;
  value: string;
  mono?: boolean;
  colors: any;
}> = ({ label, value, mono, colors }) => (
  <View style={[styles.dataItem, { borderBottomColor: colors.border }]}>
    <Text style={{ fontSize: FontSizes.xs, color: colors.textMuted, marginBottom: 2 }}>{label}</Text>
    <Text
      style={[
        { fontSize: FontSizes.md, color: colors.text, fontWeight: '500' },
        mono && { fontFamily: 'monospace', color: colors.secondary },
      ]}
      selectable>
      {value}
    </Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
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
  scanArea: {
    borderRadius: Radius.xl, padding: Spacing.xxl,
    borderWidth: 1, alignItems: 'center', marginBottom: Spacing.xl,
  },
  scanCircle: {
    width: 100, height: 100, borderRadius: 50,
    borderWidth: 2, justifyContent: 'center', alignItems: 'center',
  },
  scanIcon: { fontSize: 40 },
  buttonRow: { marginBottom: Spacing.xl },
  primaryButton: {
    borderRadius: Radius.lg, paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: { color: '#fff', fontWeight: '700', fontSize: FontSizes.lg },
  errorCard: {
    borderRadius: Radius.lg, padding: Spacing.lg,
    borderWidth: 1, marginBottom: Spacing.xl,
  },
  errorTitle: { fontSize: FontSizes.md, fontWeight: '700', marginBottom: Spacing.sm },
  retryBtn: {
    borderWidth: 1, borderRadius: Radius.md,
    paddingVertical: Spacing.sm, paddingHorizontal: Spacing.lg,
    alignSelf: 'flex-start', marginTop: Spacing.md,
  },
  resultSection: { gap: Spacing.lg },
  resultCard: {
    borderRadius: Radius.lg, borderWidth: 1, overflow: 'hidden',
  },
  resultHeader: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  successDot: { width: 8, height: 8, borderRadius: 4 },
  dataItem: {
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  recordItem: {
    margin: Spacing.md, borderRadius: Radius.md,
    padding: Spacing.md, borderWidth: 1,
  },
  recordHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  recordBadge: {
    paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: Radius.sm,
  },
  recordBadgeText: { fontSize: FontSizes.xs, fontWeight: '700' },
  resultActions: {
    flexDirection: 'row', gap: Spacing.md,
  },
  secondaryButton: {
    flex: 1, borderRadius: Radius.md, paddingVertical: Spacing.md,
    alignItems: 'center', borderWidth: 1,
  },
});

export default ReadNFCScreen;
