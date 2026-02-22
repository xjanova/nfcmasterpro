import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  TextInput,
  Alert,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useLanguage } from '../utils/i18n';
import { useTheme } from '../context/ThemeContext';
import { createTextStyles, Spacing, Radius, FontSizes, Shadow } from '../utils/theme';
import { writeNFCTag, cancelNFC, isNFCEnabled } from '../services/nfcService';
import { WritePayload } from '../types';

type DataType = 'text' | 'url' | 'vcard';

const WriteNFCScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { t } = useLanguage();
  const { colors } = useTheme();
  const ts = createTextStyles(colors);
  const [writing, setWriting] = useState(false);
  const [dataType, setDataType] = useState<DataType>('text');
  const [textData, setTextData] = useState('');
  const [urlData, setUrlData] = useState('');
  const [vcardName, setVcardName] = useState('');
  const [vcardPhone, setVcardPhone] = useState('');
  const [vcardEmail, setVcardEmail] = useState('');
  const [nfcAvailable, setNfcAvailable] = useState<boolean | null>(null);
  const [writeSuccess, setWriteSuccess] = useState(false);
  const pulseAnim = useState(new Animated.Value(1))[0];

  useEffect(() => {
    isNFCEnabled().then(setNfcAvailable);
    return () => { cancelNFC(); };
  }, []);

  useEffect(() => {
    if (writing) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.1, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [writing]);

  const getPayload = (): WritePayload | null => {
    switch (dataType) {
      case 'text':
        if (!textData.trim()) return null;
        return { type: 'text', text: textData.trim() };
      case 'url':
        if (!urlData.trim()) return null;
        return { type: 'url', url: urlData.trim() };
      case 'vcard':
        if (!vcardName.trim()) return null;
        return {
          type: 'vcard',
          vcardData: {
            name: vcardName.trim(),
            phone: vcardPhone.trim() || undefined,
            email: vcardEmail.trim() || undefined,
          },
        };
      default:
        return null;
    }
  };

  const startWriting = async () => {
    const payload = getPayload();
    if (!payload) {
      Alert.alert(t['common.error'], t['error.invalidData']);
      return;
    }

    setWriting(true);
    setWriteSuccess(false);

    try {
      const result = await writeNFCTag(payload);
      if (result.success) {
        setWriteSuccess(true);
        Alert.alert(t['nfc.writeSuccess'], `Tag UID: ${result.tag?.id || 'N/A'}`);
      } else {
        Alert.alert(t['common.error'], result.error || t['error.writeFailed']);
      }
    } catch (err: any) {
      Alert.alert(t['common.error'], err?.message || t['error.writeFailed']);
    } finally {
      setWriting(false);
    }
  };

  const handleCancel = async () => {
    await cancelNFC();
    setWriting(false);
  };

  const dataTypes: { key: DataType; label: string; icon: string }[] = [
    { key: 'text', label: 'Text', icon: 'Aa' },
    { key: 'url', label: 'URL', icon: '//' },
    { key: 'vcard', label: 'vCard', icon: 'VC' },
  ];

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
          <Text style={[ts.headingMedium, { fontWeight: '700' }]}>{t['nfc.writeCard']}</Text>
          <Text style={[ts.bodySmall, { color: colors.textMuted }]}>NDEF Write</Text>
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {nfcAvailable === false && (
          <View style={[styles.alertBox, { backgroundColor: colors.dangerGlow, borderColor: colors.danger }]}>
            <Text style={[styles.alertText, { color: colors.danger }]}>{t['error.nfcNotAvailable']}</Text>
          </View>
        )}

        {/* Data Type Selector */}
        <Text style={[ts.labelMedium, { fontWeight: '600', marginBottom: Spacing.sm }]}>
          Data Type
        </Text>
        <View style={styles.typeSelector}>
          {dataTypes.map(dt => (
            <TouchableOpacity
              key={dt.key}
              style={[
                styles.typeButton,
                { backgroundColor: colors.card, borderColor: colors.border },
                dataType === dt.key && { backgroundColor: colors.primary, borderColor: colors.primary },
              ]}
              onPress={() => setDataType(dt.key)}>
              <Text style={[
                styles.typeIcon,
                { color: dataType === dt.key ? '#fff' : colors.textMuted },
              ]}>
                {dt.icon}
              </Text>
              <Text style={[
                styles.typeLabel,
                { color: dataType === dt.key ? '#fff' : colors.textMuted },
              ]}>
                {dt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Input Fields */}
        <View style={[styles.inputCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {dataType === 'text' && (
            <>
              <Text style={[ts.labelMedium, { fontWeight: '600', marginBottom: Spacing.sm }]}>
                Text Content
              </Text>
              <TextInput
                style={[styles.textInput, {
                  backgroundColor: colors.surface, borderColor: colors.border, color: colors.text,
                }]}
                placeholder="Enter text to write..."
                placeholderTextColor={colors.textMuted}
                value={textData}
                onChangeText={setTextData}
                multiline
                numberOfLines={4}
              />
            </>
          )}

          {dataType === 'url' && (
            <>
              <Text style={[ts.labelMedium, { fontWeight: '600', marginBottom: Spacing.sm }]}>
                URL
              </Text>
              <TextInput
                style={[styles.singleInput, {
                  backgroundColor: colors.surface, borderColor: colors.border, color: colors.text,
                }]}
                placeholder="https://example.com"
                placeholderTextColor={colors.textMuted}
                value={urlData}
                onChangeText={setUrlData}
                keyboardType="url"
                autoCapitalize="none"
              />
            </>
          )}

          {dataType === 'vcard' && (
            <>
              <Text style={[ts.labelMedium, { fontWeight: '600', marginBottom: Spacing.sm }]}>
                Contact Info
              </Text>
              <TextInput
                style={[styles.singleInput, {
                  backgroundColor: colors.surface, borderColor: colors.border, color: colors.text,
                  marginBottom: Spacing.sm,
                }]}
                placeholder="Full Name *"
                placeholderTextColor={colors.textMuted}
                value={vcardName}
                onChangeText={setVcardName}
              />
              <TextInput
                style={[styles.singleInput, {
                  backgroundColor: colors.surface, borderColor: colors.border, color: colors.text,
                  marginBottom: Spacing.sm,
                }]}
                placeholder="Phone Number"
                placeholderTextColor={colors.textMuted}
                value={vcardPhone}
                onChangeText={setVcardPhone}
                keyboardType="phone-pad"
              />
              <TextInput
                style={[styles.singleInput, {
                  backgroundColor: colors.surface, borderColor: colors.border, color: colors.text,
                }]}
                placeholder="Email"
                placeholderTextColor={colors.textMuted}
                value={vcardEmail}
                onChangeText={setVcardEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </>
          )}
        </View>

        {/* Write Animation */}
        {writing && (
          <View style={[styles.writingArea, { borderColor: colors.primary }]}>
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <Text style={styles.writingIcon}>{'✏️'}</Text>
            </Animated.View>
            <Text style={[ts.bodyLarge, { fontWeight: '600', marginTop: Spacing.md }]}>
              {t['nfc.writingData']}
            </Text>
            <Text style={[ts.bodySmall, { textAlign: 'center', marginTop: Spacing.xs }]}>
              Hold NFC card near the device...
            </Text>
          </View>
        )}

        {/* Success State */}
        {writeSuccess && !writing && (
          <View style={[styles.successArea, { backgroundColor: colors.successGlow, borderColor: colors.success }]}>
            <Text style={styles.successIcon}>{'✓'}</Text>
            <Text style={[ts.bodyLarge, { color: colors.success, fontWeight: '700' }]}>
              {t['nfc.writeSuccess']}
            </Text>
          </View>
        )}

        {/* Action Button */}
        <View style={styles.buttonRow}>
          {!writing ? (
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: colors.primary }, Shadow.md]}
              onPress={startWriting}
              disabled={nfcAvailable === false}>
              <Text style={styles.primaryButtonText}>{t['nfc.writeCard']}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: colors.danger }, Shadow.md]}
              onPress={handleCancel}>
              <Text style={styles.primaryButtonText}>{t['common.cancel']}</Text>
            </TouchableOpacity>
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
  typeSelector: {
    flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.xl,
  },
  typeButton: {
    flex: 1, paddingVertical: Spacing.md, borderRadius: Radius.md,
    borderWidth: 1, alignItems: 'center', gap: 2,
  },
  typeIcon: { fontSize: FontSizes.lg, fontWeight: '800', fontFamily: 'monospace' },
  typeLabel: { fontSize: FontSizes.xs, fontWeight: '600' },
  inputCard: {
    borderRadius: Radius.lg, padding: Spacing.lg, borderWidth: 1,
    marginBottom: Spacing.xl,
  },
  textInput: {
    borderRadius: Radius.md, borderWidth: 1,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    fontSize: FontSizes.md, minHeight: 120, textAlignVertical: 'top',
  },
  singleInput: {
    borderRadius: Radius.md, borderWidth: 1,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    fontSize: FontSizes.md,
  },
  writingArea: {
    borderRadius: Radius.xl, padding: Spacing.xxl, borderWidth: 2,
    alignItems: 'center', marginBottom: Spacing.xl, borderStyle: 'dashed',
  },
  writingIcon: { fontSize: 48 },
  successArea: {
    borderRadius: Radius.lg, padding: Spacing.lg, borderWidth: 1,
    alignItems: 'center', flexDirection: 'row', justifyContent: 'center',
    gap: Spacing.md, marginBottom: Spacing.xl,
  },
  successIcon: { fontSize: 24, color: '#10b981' },
  buttonRow: { marginBottom: Spacing.xl },
  primaryButton: {
    borderRadius: Radius.lg, paddingVertical: 16, alignItems: 'center',
  },
  primaryButtonText: { color: '#fff', fontWeight: '700', fontSize: FontSizes.lg },
});

export default WriteNFCScreen;
