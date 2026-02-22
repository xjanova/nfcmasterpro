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

const CloneNFCScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { t } = useLanguage();
  const [cloning, setCloning] = useState(false);
  const [step, setStep] = useState<'source' | 'target' | 'done'>('source');
  const [sourceData, setSourceData] = useState<any>(null);

  const handleReadSource = async () => {
    setCloning(true);
    // Simulated source tag read
    setTimeout(() => {
      setCloning(false);
      setSourceData({
        uid: 'A3:B2:C1:D0',
        type: 'MIFARE Classic 1K',
        size: 1024,
        records: [{ type: 'Text', data: 'Sample NFC Data' }],
      });
      setStep('target');
      Alert.alert(t['nfc.readSuccess'], 'Source tag read. Ready to write to target.');
    }, 2000);
  };

  const handleWriteTarget = async () => {
    setCloning(true);
    // Simulated target tag write
    setTimeout(() => {
      setCloning(false);
      setStep('done');
      Alert.alert(t['nfc.cloneSuccess'], 'Tag cloned successfully');
    }, 2000);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t['nfc.cloneCard']}</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.stepsContainer}>
          {/* Step 1: Read Source */}
          <View style={styles.stepCard}>
            <View style={[styles.stepNumber, step === 'source' && styles.stepNumberActive]}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>{t['nfc.sourceTag']}</Text>
              <Text style={styles.stepDescription}>{t['nfc.readingSource']}</Text>
            </View>
          </View>

          {step !== 'source' && (
            <TouchableOpacity
              style={[
                styles.stepButton,
                step === 'source' && styles.stepButtonActive,
              ]}
              onPress={handleReadSource}
              disabled={step !== 'source' || cloning}>
              <Text style={styles.stepButtonText}>
                {cloning ? t['nfc.scanning'] : 'Read Source Tag'}
              </Text>
            </TouchableOpacity>
          )}

          {sourceData && (
            <View style={styles.dataDisplay}>
              <Text style={styles.dataLabel}>Source Data</Text>
              <Text style={styles.dataValue}>{sourceData.uid}</Text>
            </View>
          )}

          {/* Step 2: Write Target */}
          {step !== 'source' && (
            <>
              <View style={styles.stepCard}>
                <View style={[styles.stepNumber, step === 'target' && styles.stepNumberActive]}>
                  <Text style={styles.stepNumberText}>2</Text>
                </View>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>{t['nfc.targetTag']}</Text>
                  <Text style={styles.stepDescription}>{t['nfc.waitingForTarget']}</Text>
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.stepButton,
                  step === 'target' && styles.stepButtonActive,
                ]}
                onPress={handleWriteTarget}
                disabled={step !== 'target' || cloning}>
                <Text style={styles.stepButtonText}>
                  {cloning ? t['nfc.writingData'] : 'Write to Target Tag'}
                </Text>
              </TouchableOpacity>
            </>
          )}

          {/* Complete */}
          {step === 'done' && (
            <View style={styles.completeSection}>
              <Text style={styles.completeIcon}>✓</Text>
              <Text style={styles.completeText}>{t['nfc.cloneSuccess']}</Text>
              <TouchableOpacity
                style={styles.doneButton}
                onPress={() => navigation.goBack()}>
                <Text style={styles.doneButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

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
  stepsContainer: {
    gap: Spacing.lg,
  },
  stepCard: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  stepNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.lg,
  },
  stepNumberActive: {
    backgroundColor: Colors.primary,
  },
  stepNumberText: {
    color: Colors.text,
    fontWeight: 'bold',
    fontSize: FontSizes.lg,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    ...TextStyles.bodyMedium,
    marginBottom: Spacing.xs,
  },
  stepDescription: {
    ...TextStyles.bodySmall,
  },
  stepButton: {
    backgroundColor: Colors.card,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  stepButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  stepButtonText: {
    color: Colors.text,
    fontWeight: '600',
    fontSize: FontSizes.md,
  },
  dataDisplay: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  dataLabel: {
    ...TextStyles.labelSmall,
    marginBottom: Spacing.xs,
  },
  dataValue: {
    ...TextStyles.monoMedium,
  },
  completeSection: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  completeIcon: {
    fontSize: 56,
    color: Colors.success,
    marginBottom: Spacing.lg,
  },
  completeText: {
    ...TextStyles.bodyLarge,
    marginBottom: Spacing.xl,
    textAlign: 'center',
  },
  doneButton: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  doneButtonText: {
    color: Colors.text,
    fontWeight: '600',
    fontSize: FontSizes.md,
  },
});

export default CloneNFCScreen;
