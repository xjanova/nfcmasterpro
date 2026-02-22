import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useLanguage } from '../utils/i18n';
import { Colors, Spacing, Radius, FontSizes, TextStyles } from '../utils/theme';

const ReadNFCScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { t } = useLanguage();
  const [scanning, setScanning] = useState(false);
  const [tagData, setTagData] = useState<any>(null);

  const startReading = async () => {
    setScanning(true);
    // Simulated NFC read
    setTimeout(() => {
      setScanning(false);
      setTagData({
        uid: 'A3:B2:C1:D0',
        type: 'MIFARE Classic 1K',
        size: 1024,
        records: [{ type: 'Text', data: 'Sample NFC Data' }],
      });
      Alert.alert(t['nfc.readSuccess'], 'Tag data read successfully');
    }, 2000);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t['nfc.readCard']}</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.instruction}>
          <Text style={styles.instructionIcon}>📱</Text>
          <Text style={styles.instructionText}>{t['nfc.tapCard']}</Text>
        </View>

        <TouchableOpacity
          style={[styles.scanButton, scanning && styles.scanButtonActive]}
          onPress={startReading}
          disabled={scanning}>
          <Text style={styles.scanButtonText}>
            {scanning ? t['nfc.scanning'] : 'Start Reading'}
          </Text>
        </TouchableOpacity>

        {tagData && (
          <View style={styles.dataSection}>
            <Text style={styles.sectionTitle}>{t['nfc.tagInfo']}</Text>
            <DataItem label={t['nfc.tagUID']} value={tagData.uid} mono={true} />
            <DataItem label={t['nfc.tagType']} value={tagData.type} />
            <DataItem label={t['nfc.tagSize']} value={`${tagData.size} bytes`} />

            {tagData.records && tagData.records.length > 0 && (
              <View style={styles.recordsSection}>
                <Text style={styles.recordsTitle}>{t['nfc.ndefRecords']}</Text>
                {tagData.records.map((record: any, idx: number) => (
                  <View key={idx} style={styles.recordItem}>
                    <Text style={styles.recordType}>{record.type}</Text>
                    <Text style={styles.recordData}>{record.data}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const DataItem: React.FC<{ label: string; value: string; mono?: boolean }> = ({
  label,
  value,
  mono,
}) => (
  <View style={styles.dataItem}>
    <Text style={styles.dataLabel}>{label}</Text>
    <Text style={[styles.dataValue, mono && styles.dataValueMono]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  backButton: {
    color: Colors.primary,
    fontSize: FontSizes.md,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  title: {
    ...TextStyles.headingLarge,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  instruction: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  instructionIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  instructionText: {
    ...TextStyles.bodyLarge,
    color: Colors.textSecondary,
  },
  scanButton: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  scanButtonActive: {
    backgroundColor: Colors.warning,
  },
  scanButtonText: {
    color: Colors.text,
    fontWeight: '700',
    fontSize: FontSizes.lg,
  },
  dataSection: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionTitle: {
    ...TextStyles.headingMedium,
    marginBottom: Spacing.md,
  },
  dataItem: {
    marginBottom: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  dataLabel: {
    ...TextStyles.labelSmall,
    marginBottom: Spacing.xs,
  },
  dataValue: {
    ...TextStyles.bodyMedium,
    color: Colors.primary,
  },
  dataValueMono: {
    ...TextStyles.monoMedium,
  },
  recordsSection: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  recordsTitle: {
    ...TextStyles.labelMedium,
    marginBottom: Spacing.md,
  },
  recordItem: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  recordType: {
    ...TextStyles.labelSmall,
    marginBottom: Spacing.xs,
  },
  recordData: {
    ...TextStyles.bodySmall,
  },
});

export default ReadNFCScreen;
