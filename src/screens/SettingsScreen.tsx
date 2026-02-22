import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '../utils/i18n';
import { Colors, Spacing, Radius, FontSizes, TextStyles, Shadow } from '../utils/theme';
import { APP_VERSION, APP_NAME, STUDIO_NAME, COPYRIGHT_YEAR } from '../utils/constants';

const SettingsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { t, lang, setLang } = useLanguage();

  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [apiStatus, setApiStatus] = useState<'connected' | 'disconnected' | null>(null);

  const [apiBaseUrl, setApiBaseUrl] = useState('https://api.thaiprompt.com');
  const [apiKey, setApiKey] = useState('****************************');
  const [nfcDefaultKey, setNfcDefaultKey] = useState('FFFFFFFFFFFF');
  const [pvRate, setPvRate] = useState('0.1');
  const [lowBalanceThreshold, setLowBalanceThreshold] = useState('100');
  const [confirmBeforeWrite, setConfirmBeforeWrite] = useState(true);
  const [autoSaveHistory, setAutoSaveHistory] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [lowBalanceAlerts, setLowBalanceAlerts] = useState(true);

  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    // In a real app, load settings from storage
    // For now, using defaults
  }, []);

  const handleTestConnection = async () => {
    setTesting(true);
    // Simulate API test
    await new Promise(resolve => setTimeout(resolve, 1500));
    setApiStatus('connected');
    setTesting(false);
    Alert.alert('Success', 'API connection test successful!');
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      // Simulate save
      await new Promise(resolve => setTimeout(resolve, 1000));
      Alert.alert('Success', t['success.dataSaved']);
    } catch (error) {
      Alert.alert('Error', 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = () => {
    Alert.alert(
      'Clear History',
      'Are you sure you want to clear all scan history? This action cannot be undone.',
      [
        { text: 'Cancel', onPress: () => {} },
        {
          text: 'Clear',
          onPress: () => {
            Alert.alert('Success', 'Scan history cleared');
          },
          style: 'destructive',
        },
      ]
    );
  };

  const handleClearTransactions = () => {
    Alert.alert(
      'Clear Transactions',
      'Are you sure you want to clear all transactions? This action cannot be undone.',
      [
        { text: 'Cancel', onPress: () => {} },
        {
          text: 'Clear',
          onPress: () => {
            Alert.alert('Success', 'Transactions cleared');
          },
          style: 'destructive',
        },
      ]
    );
  };

  const handleClearNotifications = () => {
    Alert.alert(
      'Clear Notifications',
      'Are you sure you want to clear all notifications?',
      [
        { text: 'Cancel', onPress: () => {} },
        {
          text: 'Clear',
          onPress: () => {
            Alert.alert('Success', 'Notifications cleared');
          },
          style: 'destructive',
        },
      ]
    );
  };

  const handleExportData = () => {
    Alert.alert('Export Data', 'Data export feature would be available soon');
  };

  // Section Component
  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );

  // Settings Row Component
  const SettingRow = ({
    label,
    value,
    onPress,
  }: {
    label: string;
    value?: string;
    onPress?: () => void;
  }) => (
    <TouchableOpacity style={styles.settingRow} onPress={onPress}>
      <Text style={styles.settingLabel}>{label}</Text>
      {value && <Text style={styles.settingValue}>{value}</Text>}
    </TouchableOpacity>
  );

  // Toggle Row Component
  const ToggleRow = ({
    label,
    value,
    onValueChange,
  }: {
    label: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
  }) => (
    <View style={styles.toggleRow}>
      <Text style={styles.settingLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: Colors.border, true: Colors.primaryGlow }}
        thumbColor={value ? Colors.primary : Colors.textMuted}
      />
    </View>
  );

  // Input Row Component
  const InputRow = ({
    label,
    value,
    onChangeText,
    placeholder,
    keyboardType = 'default',
    secure = false,
  }: {
    label: string;
    value: string;
    onChangeText: (text: string) => void;
    placeholder?: string;
    keyboardType?: string;
    secure?: boolean;
  }) => (
    <View style={styles.inputRow}>
      <Text style={styles.settingLabel}>{label}</Text>
      <TextInput
        style={styles.inputField}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textMuted}
        keyboardType={keyboardType as any}
        secureTextEntry={secure}
      />
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t['settings.settings']}</Text>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Spacing.xxl }}
      >
        {/* LANGUAGE SECTION */}
        <Section title={t['settings.language']}>
          <View style={styles.languageToggle}>
            <TouchableOpacity
              style={[
                styles.langButton,
                lang === 'th' && styles.langButtonActive,
              ]}
              onPress={() => setLang('th')}
            >
              <Text
                style={[
                  styles.langButtonText,
                  lang === 'th' && styles.langButtonTextActive,
                ]}
              >
                {t['settings.thai']}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.langButton,
                lang === 'en' && styles.langButtonActive,
              ]}
              onPress={() => setLang('en')}
            >
              <Text
                style={[
                  styles.langButtonText,
                  lang === 'en' && styles.langButtonTextActive,
                ]}
              >
                {t['settings.english']}
              </Text>
            </TouchableOpacity>
          </View>
        </Section>

        {/* API CONFIGURATION */}
        <Section title={t['settings.apiConfig']}>
          <InputRow
            label={t['settings.apiBaseUrl']}
            value={apiBaseUrl}
            onChangeText={setApiBaseUrl}
            placeholder="https://api.example.com"
          />
          <View style={{ marginTop: Spacing.md }}>
            <InputRow
              label={t['settings.apiKey']}
              value={apiKey}
              onChangeText={setApiKey}
              placeholder="Your API Key"
              secure={!showApiKey}
            />
            <TouchableOpacity
              style={styles.showKeyButton}
              onPress={() => setShowApiKey(!showApiKey)}
            >
              <Text style={styles.showKeyText}>
                {showApiKey ? 'Hide' : 'Show'}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.testButton, testing && styles.testButtonDisabled]}
            onPress={handleTestConnection}
            disabled={testing}
          >
            {testing ? (
              <ActivityIndicator color={Colors.text} size="small" />
            ) : (
              <>
                <Text style={styles.testButtonText}>Test Connection</Text>
                {apiStatus && (
                  <View
                    style={[
                      styles.statusIndicator,
                      apiStatus === 'connected' && styles.statusIndicatorConnected,
                    ]}
                  />
                )}
              </>
            )}
          </TouchableOpacity>
        </Section>

        {/* NFC CONFIGURATION */}
        <Section title={t['settings.nfcSettings']}>
          <InputRow
            label={t['settings.nfcDefaultKey']}
            value={nfcDefaultKey}
            onChangeText={setNfcDefaultKey}
            placeholder="FFFFFFFFFFFF"
          />
          <ToggleRow
            label={t['settings.confirmBeforeWrite']}
            value={confirmBeforeWrite}
            onValueChange={setConfirmBeforeWrite}
          />
          <ToggleRow
            label={t['settings.autoSaveHistory']}
            value={autoSaveHistory}
            onValueChange={setAutoSaveHistory}
          />
        </Section>

        {/* PAYMENT TEST MODE */}
        <Section title={t['payment.testMode']}>
          <InputRow
            label={t['settings.pvRate']}
            value={pvRate}
            onChangeText={setPvRate}
            placeholder="0.1"
            keyboardType="decimal-pad"
          />
          <View style={{ marginTop: Spacing.md }}>
            <InputRow
              label={t['settings.lowBalanceAlert']}
              value={lowBalanceThreshold}
              onChangeText={setLowBalanceThreshold}
              placeholder="100"
              keyboardType="number-pad"
            />
          </View>
          <View style={styles.currencyDisplay}>
            <Text style={styles.currencyLabel}>Currency:</Text>
            <Text style={styles.currencyValue}>฿ (Thai Baht)</Text>
          </View>
        </Section>

        {/* NOTIFICATIONS */}
        <Section title={t['settings.notifications']}>
          <ToggleRow
            label={t['settings.enableNotifications']}
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
          />
          <ToggleRow
            label={t['notifications.lowBalance']}
            value={lowBalanceAlerts}
            onValueChange={setLowBalanceAlerts}
          />
        </Section>

        {/* DATA MANAGEMENT */}
        <Section title="Data Management">
          <TouchableOpacity
            style={styles.dataManagementButton}
            onPress={handleClearHistory}
          >
            <Text style={styles.dataManagementButtonText}>
              {t['settings.clearHistory']}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.dataManagementButton, { marginTop: Spacing.md }]}
            onPress={handleClearTransactions}
          >
            <Text style={styles.dataManagementButtonText}>
              Clear Transactions
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.dataManagementButton, { marginTop: Spacing.md }]}
            onPress={handleClearNotifications}
          >
            <Text style={styles.dataManagementButtonText}>
              {t['notifications.clear']}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.dataManagementButton, { marginTop: Spacing.md }]}
            onPress={handleExportData}
          >
            <Text style={styles.dataManagementButtonText}>
              Export Data
            </Text>
          </TouchableOpacity>
        </Section>

        {/* ABOUT */}
        <Section title={t['settings.about']}>
          <View style={styles.aboutContainer}>
            <View style={styles.aboutLogoPlaceholder}>
              <Text style={styles.aboutLogoText}>📱</Text>
            </View>
            <Text style={styles.aboutAppName}>{APP_NAME}</Text>
            <Text style={styles.aboutVersion}>
              {t['settings.version']}: {APP_VERSION}
            </Text>
          </View>

          <View style={styles.aboutInfo}>
            <Text style={styles.aboutInfoText}>
              {t['settings.producedBy']}
            </Text>
            <Text style={styles.aboutStudioName}>{STUDIO_NAME}</Text>
            <Text style={styles.aboutCopyright}>
              © {COPYRIGHT_YEAR} {STUDIO_NAME}. All rights reserved.
            </Text>
          </View>

          <View style={styles.buildInfo}>
            <Text style={styles.buildInfoLabel}>Build:</Text>
            <Text style={styles.buildInfoValue}>v{APP_VERSION}</Text>
          </View>
        </Section>

        {/* SAVE BUTTON */}
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSaveSettings}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={Colors.text} />
          ) : (
            <Text style={styles.saveButtonText}>{t['common.save']}</Text>
          )}
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
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    ...TextStyles.headingLarge,
    color: Colors.text,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.xxl,
  },
  sectionTitle: {
    ...TextStyles.labelLarge,
    color: Colors.textMuted,
    marginBottom: Spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionContent: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    paddingVertical: 0,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...Shadow.sm,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  inputRow: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  settingLabel: {
    ...TextStyles.bodyMedium,
    color: Colors.text,
    flex: 1,
  },
  settingValue: {
    ...TextStyles.bodySmall,
    color: Colors.textMuted,
  },
  inputField: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    color: Colors.text,
    fontSize: FontSizes.md,
    marginTop: Spacing.sm,
  },
  languageToggle: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  langButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  langButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  langButtonText: {
    ...TextStyles.labelMedium,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  langButtonTextActive: {
    color: Colors.text,
  },
  testButton: {
    flexDirection: 'row',
    backgroundColor: Colors.success,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    marginTop: Spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
    ...Shadow.sm,
  },
  testButtonDisabled: {
    opacity: 0.6,
  },
  testButtonText: {
    ...TextStyles.labelMedium,
    color: Colors.text,
    fontWeight: '600',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.danger,
  },
  statusIndicatorConnected: {
    backgroundColor: Colors.success,
  },
  showKeyButton: {
    alignSelf: 'flex-end',
    marginTop: Spacing.sm,
  },
  showKeyText: {
    ...TextStyles.bodySmall,
    color: Colors.primary,
  },
  currencyDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    marginTop: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  currencyLabel: {
    ...TextStyles.bodySmall,
    color: Colors.textMuted,
    marginRight: Spacing.md,
  },
  currencyValue: {
    ...TextStyles.bodyMedium,
    color: Colors.secondary,
    fontWeight: '600',
  },
  dataManagementButton: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
  },
  dataManagementButtonText: {
    ...TextStyles.bodyMedium,
    color: Colors.text,
  },
  aboutContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  aboutLogoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  aboutLogoText: {
    fontSize: 40,
  },
  aboutAppName: {
    ...TextStyles.headingMedium,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  aboutVersion: {
    ...TextStyles.bodySmall,
    color: Colors.textMuted,
  },
  aboutInfo: {
    alignItems: 'center',
    marginVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  aboutInfoText: {
    ...TextStyles.bodySmall,
    color: Colors.textMuted,
    marginBottom: Spacing.xs,
  },
  aboutStudioName: {
    ...TextStyles.labelMedium,
    color: Colors.gold,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },
  aboutCopyright: {
    ...TextStyles.bodySmall,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  buildInfo: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  buildInfoLabel: {
    ...TextStyles.bodySmall,
    color: Colors.textMuted,
  },
  buildInfoValue: {
    ...TextStyles.monoSmall,
    color: Colors.secondary,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.xl,
    marginBottom: Spacing.xxl,
    ...Shadow.md,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    ...TextStyles.labelLarge,
    color: Colors.text,
    fontWeight: '600',
  },
});

export default SettingsScreen;
