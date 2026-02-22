import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useLanguage } from '../utils/i18n';
import { Colors, Spacing, Radius, FontSizes, TextStyles } from '../utils/theme';

const WriteNFCScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { t } = useLanguage();
  const [writing, setWriting] = useState(false);
  const [dataType, setDataType] = useState<'text' | 'url'>('text');
  const [data, setData] = useState('');

  const startWriting = async () => {
    if (!data) {
      Alert.alert(t('common.error'), 'Please enter data to write');
      return;
    }

    setWriting(true);
    // Simulated NFC write
    setTimeout(() => {
      setWriting(false);
      Alert.alert(t('nfc.writeSuccess'), 'Data written to tag successfully');
      setData('');
    }, 2000);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t('nfc.writeCard')}</Text>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.instruction}>
          <Text style={styles.instructionIcon}>✏️</Text>
          <Text style={styles.instructionText}>{t('nfc.tapCard')}</Text>
        </View>

        <View style={styles.typeSelector}>
          <Text style={styles.label}>Data Type</Text>
          <View style={styles.typeButtons}>
            {['text', 'url'].map(type => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.typeButton,
                  dataType === type && styles.typeButtonActive,
                ]}
                onPress={() => setDataType(type as 'text' | 'url')}>
                <Text
                  style={[
                    styles.typeButtonText,
                    dataType === type && styles.typeButtonTextActive,
                  ]}>
                  {type.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputSection}>
          <Text style={styles.label}>Data to Write</Text>
          <TextInput
            style={styles.input}
            placeholder={dataType === 'url' ? 'https://example.com' : 'Enter text...'}
            placeholderTextColor={Colors.textMuted}
            value={data}
            onChangeText={setData}
            multiline={dataType === 'text'}
            numberOfLines={dataType === 'text' ? 4 : 1}
          />
        </View>

        <TouchableOpacity
          style={[styles.writeButton, writing && styles.writeButtonActive]}
          onPress={startWriting}
          disabled={writing}>
          <Text style={styles.writeButtonText}>
            {writing ? t('nfc.writingData') : 'Write to Tag'}
          </Text>
        </TouchableOpacity>
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
  typeSelector: {
    marginBottom: Spacing.xl,
  },
  label: {
    ...TextStyles.labelMedium,
    marginBottom: Spacing.md,
  },
  typeButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  typeButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  typeButtonText: {
    color: Colors.textMuted,
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
  typeButtonTextActive: {
    color: Colors.text,
  },
  inputSection: {
    marginBottom: Spacing.xl,
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    color: Colors.text,
    fontSize: FontSizes.md,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  writeButton: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  writeButtonActive: {
    backgroundColor: Colors.warning,
  },
  writeButtonText: {
    color: Colors.text,
    fontWeight: '700',
    fontSize: FontSizes.lg,
  },
});

export default WriteNFCScreen;
