import React, { useState } from 'react';
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
import { useTheme } from '../context/ThemeContext';
import { createTextStyles, Spacing, Radius, FontSizes, Shadow } from '../utils/theme';
import { APP_VERSION, APP_NAME, STUDIO_NAME, COPYRIGHT_YEAR } from '../utils/constants';

const SettingsScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { t, lang, setLang } = useLanguage();
  const { colors, theme, setTheme, toggleTheme } = useTheme();
  const ts = createTextStyles(colors);

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

  const handleTestConnection = async () => {
    setTesting(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setApiStatus('connected');
    setTesting(false);
    Alert.alert('Success', 'API connection test successful!');
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      Alert.alert('Success', t['success.dataSaved']);
    } catch {
      Alert.alert('Error', 'Failed to save settings');
    } finally { setLoading(false); }
  };

  const handleClearAction = (title: string, message: string) => {
    Alert.alert(title, message, [
      { text: 'Cancel' },
      { text: 'Clear', onPress: () => Alert.alert('Success', `${title} completed`), style: 'destructive' },
    ]);
  };

  // Reusable components
  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>{title}</Text>
      <View style={[styles.sectionContent, { backgroundColor: colors.card, borderColor: colors.border }, Shadow.sm]}>
        {children}
      </View>
    </View>
  );

  const ToggleRow = ({ label, value, onValueChange }: { label: string; value: boolean; onValueChange: (v: boolean) => void }) => (
    <View style={[styles.toggleRow, { borderBottomColor: colors.border }]}>
      <Text style={[ts.bodyMedium, { flex: 1 }]}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.border, true: colors.primaryGlow }}
        thumbColor={value ? colors.primary : colors.textMuted}
      />
    </View>
  );

  const InputRow = ({ label, value, onChangeText, placeholder, keyboardType = 'default', secure = false }: {
    label: string; value: string; onChangeText: (t: string) => void; placeholder?: string; keyboardType?: string; secure?: boolean;
  }) => (
    <View style={[styles.inputRow, { borderBottomColor: colors.border }]}>
      <Text style={[ts.bodyMedium]}>{label}</Text>
      <TextInput
        style={[styles.inputField, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
        value={value} onChangeText={onChangeText} placeholder={placeholder}
        placeholderTextColor={colors.textMuted} keyboardType={keyboardType as any} secureTextEntry={secure}
      />
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.bg }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[ts.headingLarge, { fontWeight: '800' }]}>{t['settings.settings']}</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}>

        {/* APPEARANCE / THEME */}
        <Section title={lang === 'th' ? 'ธีม' : 'Appearance'}>
          <View style={[styles.themeRow, { borderBottomColor: colors.border }]}>
            <Text style={[ts.bodyMedium, { flex: 1 }]}>
              {lang === 'th' ? 'โหมดธีม' : 'Theme Mode'}
            </Text>
            <View style={styles.themeToggle}>
              <TouchableOpacity
                style={[styles.themeBtn, theme === 'light' && { backgroundColor: colors.primary }]}
                onPress={() => setTheme('light')}>
                <Text style={[styles.themeBtnIcon, theme === 'light' && { color: '#fff' }]}>☀</Text>
                <Text style={[styles.themeBtnText, { color: theme === 'light' ? '#fff' : colors.textMuted }]}>
                  {lang === 'th' ? 'สว่าง' : 'Light'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.themeBtn, theme === 'dark' && { backgroundColor: colors.primary }]}
                onPress={() => setTheme('dark')}>
                <Text style={[styles.themeBtnIcon, theme === 'dark' && { color: '#fff' }]}>☾</Text>
                <Text style={[styles.themeBtnText, { color: theme === 'dark' ? '#fff' : colors.textMuted }]}>
                  {lang === 'th' ? 'มืด' : 'Dark'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Section>

        {/* LANGUAGE */}
        <Section title={t['settings.language']}>
          <View style={[styles.languageToggle, { borderBottomColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.langBtn, { backgroundColor: colors.surface, borderColor: colors.border }, lang === 'th' && { backgroundColor: colors.primary, borderColor: colors.primary }]}
              onPress={() => setLang('th')}>
              <Text style={[styles.langBtnText, { color: lang === 'th' ? '#fff' : colors.textMuted }]}>{t['settings.thai']}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.langBtn, { backgroundColor: colors.surface, borderColor: colors.border }, lang === 'en' && { backgroundColor: colors.primary, borderColor: colors.primary }]}
              onPress={() => setLang('en')}>
              <Text style={[styles.langBtnText, { color: lang === 'en' ? '#fff' : colors.textMuted }]}>{t['settings.english']}</Text>
            </TouchableOpacity>
          </View>
        </Section>

        {/* API CONFIGURATION */}
        <Section title={t['settings.apiConfig']}>
          <TouchableOpacity
            style={[styles.qrPairBtn, { backgroundColor: colors.primaryGlow, borderBottomColor: colors.border }]}
            onPress={() => navigation?.navigate?.('QRScanner')}>
            <Text style={{ fontSize: 20, marginRight: Spacing.md }}>{'⬡'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[ts.bodyMedium, { color: colors.primary, fontWeight: '600' }]}>
                {lang === 'th' ? 'สร้าง QR จับคู่ / สแกน QR' : 'Generate Pairing QR / Scan QR'}
              </Text>
              <Text style={ts.bodySmall}>
                {lang === 'th' ? 'จับคู่อุปกรณ์กับระบบ Thaiprompt' : 'Pair device with Thaiprompt system'}
              </Text>
            </View>
            <Text style={{ color: colors.textMuted, fontSize: 16 }}>{'>'}</Text>
          </TouchableOpacity>
          <InputRow label={t['settings.apiBaseUrl']} value={apiBaseUrl} onChangeText={setApiBaseUrl} placeholder="https://api.example.com" />
          <View>
            <InputRow label={t['settings.apiKey']} value={apiKey} onChangeText={setApiKey} placeholder="Your API Key" secure={!showApiKey} />
            <TouchableOpacity style={styles.showKeyBtn} onPress={() => setShowApiKey(!showApiKey)}>
              <Text style={[ts.bodySmall, { color: colors.primary }]}>{showApiKey ? 'Hide' : 'Show'}</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={[styles.testBtn, { backgroundColor: colors.success }, testing && { opacity: 0.6 }]}
            onPress={handleTestConnection} disabled={testing}>
            {testing ? <ActivityIndicator color="#fff" size="small" /> : (
              <View style={styles.testBtnContent}>
                <Text style={[ts.labelMedium, { color: '#fff', fontWeight: '600' }]}>Test Connection</Text>
                {apiStatus && <View style={[styles.statusDot, apiStatus === 'connected' && { backgroundColor: '#fff' }]} />}
              </View>
            )}
          </TouchableOpacity>
        </Section>

        {/* NFC CONFIGURATION */}
        <Section title={t['settings.nfcSettings']}>
          <InputRow label={t['settings.nfcDefaultKey']} value={nfcDefaultKey} onChangeText={setNfcDefaultKey} placeholder="FFFFFFFFFFFF" />
          <ToggleRow label={t['settings.confirmBeforeWrite']} value={confirmBeforeWrite} onValueChange={setConfirmBeforeWrite} />
          <ToggleRow label={t['settings.autoSaveHistory']} value={autoSaveHistory} onValueChange={setAutoSaveHistory} />
        </Section>

        {/* PAYMENT */}
        <Section title={t['payment.testMode']}>
          <InputRow label={t['settings.pvRate']} value={pvRate} onChangeText={setPvRate} placeholder="0.1" keyboardType="decimal-pad" />
          <InputRow label={t['settings.lowBalanceAlert']} value={lowBalanceThreshold} onChangeText={setLowBalanceThreshold} placeholder="100" keyboardType="number-pad" />
        </Section>

        {/* NOTIFICATIONS */}
        <Section title={t['settings.notifications']}>
          <ToggleRow label={t['settings.enableNotifications']} value={notificationsEnabled} onValueChange={setNotificationsEnabled} />
          <ToggleRow label={t['notifications.lowBalance']} value={lowBalanceAlerts} onValueChange={setLowBalanceAlerts} />
        </Section>

        {/* DATA MANAGEMENT */}
        <Section title="Data Management">
          {[
            { label: t['settings.clearHistory'], action: () => handleClearAction('Clear History', 'Clear all scan history?') },
            { label: 'Clear Transactions', action: () => handleClearAction('Clear Transactions', 'Clear all transactions?') },
            { label: t['notifications.clear'], action: () => handleClearAction('Clear Notifications', 'Clear all notifications?') },
            { label: 'Export Data', action: () => Alert.alert('Export', 'Coming soon') },
          ].map((item, idx) => (
            <TouchableOpacity key={idx} style={[styles.dataBtn, { borderBottomColor: colors.border }]} onPress={item.action}>
              <Text style={[ts.bodyMedium]}>{item.label}</Text>
              <Text style={{ color: colors.textMuted }}>{'>'}</Text>
            </TouchableOpacity>
          ))}
        </Section>

        {/* ABOUT */}
        <Section title={t['settings.about']}>
          <View style={styles.aboutContainer}>
            <View style={[styles.aboutLogo, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={{ fontSize: 36 }}>{'📱'}</Text>
            </View>
            <Text style={[ts.headingMedium, { fontWeight: '700', marginTop: Spacing.md }]}>{APP_NAME}</Text>
            <Text style={[ts.bodySmall, { marginTop: 4 }]}>{t['settings.version']}: {APP_VERSION}</Text>
            <View style={[styles.aboutDivider, { borderTopColor: colors.border }]}>
              <Text style={ts.bodySmall}>{t['settings.producedBy']}</Text>
              <Text style={[ts.labelMedium, { color: colors.gold, fontWeight: '700', marginTop: 4 }]}>{STUDIO_NAME}</Text>
              <Text style={[ts.bodySmall, { marginTop: Spacing.sm, textAlign: 'center' }]}>
                {'\u00A9'} {COPYRIGHT_YEAR} {STUDIO_NAME}. All rights reserved.
              </Text>
            </View>
          </View>
        </Section>

        {/* SAVE */}
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: colors.primary }, loading && { opacity: 0.6 }, Shadow.md]}
          onPress={handleSaveSettings} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>{t['common.save']}</Text>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
  },
  content: { flex: 1, paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg },
  section: { marginBottom: Spacing.xxl },
  sectionTitle: {
    fontSize: FontSizes.sm, fontWeight: '700', marginBottom: Spacing.sm,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  sectionContent: {
    borderRadius: Radius.lg, borderWidth: 1, overflow: 'hidden',
  },
  themeRow: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderBottomWidth: 1 },
  themeToggle: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md },
  themeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: Spacing.sm, borderRadius: Radius.md,
  },
  themeBtnIcon: { fontSize: 16 },
  themeBtnText: { fontSize: FontSizes.sm, fontWeight: '600' },
  languageToggle: {
    flexDirection: 'row', gap: Spacing.md, padding: Spacing.lg, borderBottomWidth: 0,
  },
  langBtn: {
    flex: 1, paddingVertical: Spacing.md, borderRadius: Radius.md,
    borderWidth: 1, alignItems: 'center',
  },
  langBtnText: { fontSize: FontSizes.sm, fontWeight: '600' },
  qrPairBtn: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  toggleRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderBottomWidth: 1,
  },
  inputRow: {
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderBottomWidth: 1,
  },
  inputField: {
    borderWidth: 1, borderRadius: Radius.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    fontSize: FontSizes.md, marginTop: Spacing.sm,
  },
  showKeyBtn: { alignSelf: 'flex-end', paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm },
  testBtn: {
    margin: Spacing.lg, paddingVertical: Spacing.md,
    borderRadius: Radius.md, alignItems: 'center',
  },
  testBtnContent: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  statusDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.5)',
  },
  dataBtn: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderBottomWidth: 1,
  },
  aboutContainer: { alignItems: 'center', paddingVertical: Spacing.xl },
  aboutLogo: {
    width: 72, height: 72, borderRadius: 18,
    borderWidth: 1, justifyContent: 'center', alignItems: 'center',
  },
  aboutDivider: {
    marginTop: Spacing.xl, paddingTop: Spacing.lg, borderTopWidth: 1,
    alignItems: 'center', width: '100%',
  },
  saveBtn: {
    paddingVertical: 14, borderRadius: Radius.lg, alignItems: 'center',
    marginHorizontal: Spacing.xl, marginBottom: Spacing.xxl,
  },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: FontSizes.lg },
});

export default SettingsScreen;
