import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, StatusBar, Switch, ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { getSettings, saveSettings } from '../services/storageService';
import { testConnection, initApiClient } from '../services/apiService';
import { AppSettings } from '../types';
import { Colors } from '../utils/theme';

const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [testing, setTesting] = useState(false);
  const [apiStatus, setApiStatus] = useState<{ connected: boolean; latency?: number } | null>(null);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    getSettings().then(setSettings);
    testConn();
  }, []);

  const testConn = async () => {
    setTesting(true);
    const result = await testConnection();
    setApiStatus(result);
    setTesting(false);
  };

  const save = async (updates: Partial<AppSettings>) => {
    const updated = { ...settings!, ...updates };
    setSettings(updated);
    await saveSettings(updates);
    await initApiClient();
    Toast.show({ type: 'success', text1: '✅ บันทึกแล้ว' });
  };

  if (!settings) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bg, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />
      <View style={styles.appBar}>
        <Text style={styles.title}>ตั้งค่า</Text>
        <Text style={styles.subtitle}>Settings</Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* API Status */}
        <View style={[styles.statusCard, apiStatus?.connected && styles.statusCardOk]}>
          <View style={[styles.statusDot, apiStatus?.connected && styles.statusDotOk]} />
          <View style={{ flex: 1 }}>
            <Text style={styles.statusLabel}>Thaiprompt API</Text>
            <Text style={styles.statusUrl}>{settings.apiBaseUrl}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            {testing ? (
              <ActivityIndicator size="small" color={Colors.secondary} />
            ) : (
              <Text style={[styles.statusPing, apiStatus?.connected ? styles.pingOk : styles.pingErr]}>
                {apiStatus?.connected ? `${apiStatus.latency}ms` : 'ออฟไลน์'}
              </Text>
            )}
            <TouchableOpacity onPress={testConn}>
              <Text style={styles.reTestText}>ทดสอบใหม่</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* API Configuration */}
        <Text style={styles.sectionTitle}>การเชื่อมต่อ API</Text>

        <View style={styles.settingCard}>
          <View style={styles.settingIcon('rgba(99,102,241,0.15)')}><Text>🔗</Text></View>
          <View style={styles.settingText}>
            <Text style={styles.settingName}>API Server URL</Text>
            {editing ? (
              <TextInput
                style={styles.settingInput}
                value={settings.apiBaseUrl}
                onChangeText={v => setSettings(s => ({ ...s!, apiBaseUrl: v }))}
                onBlur={() => save({ apiBaseUrl: settings.apiBaseUrl })}
                autoCapitalize="none"
              />
            ) : (
              <Text style={styles.settingDesc} numberOfLines={1}>{settings.apiBaseUrl}</Text>
            )}
          </View>
          <TouchableOpacity onPress={() => setEditing(!editing)}>
            <Text style={styles.editBtn}>{editing ? '✓' : '✏️'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.settingCard}>
          <View style={styles.settingIcon('rgba(245,158,11,0.15)')}><Text>🔑</Text></View>
          <View style={styles.settingText}>
            <Text style={styles.settingName}>API Key</Text>
            <TextInput
              style={[styles.settingInput, { color: settings.apiKey ? Colors.text : Colors.textMuted }]}
              value={settings.apiKey}
              onChangeText={v => setSettings(s => ({ ...s!, apiKey: v }))}
              onBlur={() => save({ apiKey: settings.apiKey })}
              placeholder="กรอก API Key"
              placeholderTextColor={Colors.textMuted}
              secureTextEntry
            />
          </View>
        </View>

        <View style={styles.settingCard}>
          <View style={styles.settingIcon('rgba(16,185,129,0.15)')}><Text>🔐</Text></View>
          <View style={styles.settingText}>
            <Text style={styles.settingName}>NFC Default Key (MIFARE)</Text>
            <TextInput
              style={styles.settingInput}
              value={settings.nfcDefaultKey}
              onChangeText={v => setSettings(s => ({ ...s!, nfcDefaultKey: v }))}
              onBlur={() => save({ nfcDefaultKey: settings.nfcDefaultKey })}
              placeholder="FFFFFFFFFFFF"
              placeholderTextColor={Colors.textMuted}
              maxLength={12}
              autoCapitalize="characters"
            />
          </View>
        </View>

        {/* Behavior Settings */}
        <Text style={styles.sectionTitle}>การทำงาน</Text>

        {[
          {
            icon: '📳', bg: 'rgba(34,211,238,0.15)',
            name: 'สั่นเมื่อสแกนสำเร็จ', desc: 'Haptic feedback on scan',
            key: 'hapticFeedback' as keyof AppSettings,
          },
          {
            icon: '💾', bg: 'rgba(99,102,241,0.15)',
            name: 'บันทึกประวัติอัตโนมัติ', desc: 'Auto-save scan history',
            key: 'autoSaveHistory' as keyof AppSettings,
          },
          {
            icon: '⚠️', bg: 'rgba(245,158,11,0.15)',
            name: 'ยืนยันก่อนเขียน', desc: 'Confirm before writing tag',
            key: 'confirmBeforeWrite' as keyof AppSettings,
          },
        ].map(item => (
          <View key={item.key} style={styles.settingCard}>
            <View style={styles.settingIcon(item.bg)}><Text>{item.icon}</Text></View>
            <View style={styles.settingText}>
              <Text style={styles.settingName}>{item.name}</Text>
              <Text style={styles.settingDesc}>{item.desc}</Text>
            </View>
            <Switch
              value={settings[item.key] as boolean}
              onValueChange={v => save({ [item.key]: v })}
              trackColor={{ true: Colors.primary, false: Colors.border }}
              thumbColor="white"
            />
          </View>
        ))}

        {/* About */}
        <Text style={styles.sectionTitle}>เกี่ยวกับ</Text>
        <View style={styles.settingCard}>
          <View style={styles.settingIcon('rgba(99,102,241,0.15)')}><Text>📱</Text></View>
          <View style={styles.settingText}>
            <Text style={styles.settingName}>NFC Master Pro</Text>
            <Text style={styles.settingDesc}>เวอร์ชัน 1.0.0 · Build 100 · React Native</Text>
          </View>
        </View>

        <View style={styles.settingCard}>
          <View style={styles.settingIcon('rgba(34,211,238,0.15)')}><Text>🔗</Text></View>
          <View style={styles.settingText}>
            <Text style={styles.settingName}>Thaiprompt-Affiliate</Text>
            <Text style={styles.settingDesc}>Integration สำหรับลงทะเบียนสมาชิก</Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const settingIconStyle = (bg: string) => ({
  width: 38, height: 38, borderRadius: 10,
  backgroundColor: bg, justifyContent: 'center' as const, alignItems: 'center' as const,
  flexShrink: 0,
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  appBar: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  title: { fontSize: 20, fontWeight: '700', color: Colors.text },
  subtitle: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  scroll: { flex: 1, paddingHorizontal: 20 },
  statusCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.card, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 20,
  },
  statusCardOk: {
    backgroundColor: '#0d1a10', borderColor: 'rgba(16,185,129,0.3)',
  },
  statusDot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: Colors.danger, flexShrink: 0,
  },
  statusDotOk: { backgroundColor: Colors.success },
  statusLabel: { fontSize: 11, color: Colors.textMuted },
  statusUrl: { fontSize: 12, fontWeight: '600', color: Colors.text, fontFamily: 'monospace' },
  statusPing: { fontSize: 13, fontWeight: '700' },
  pingOk: { color: Colors.success },
  pingErr: { color: Colors.danger },
  reTestText: { fontSize: 10, color: Colors.textMuted, marginTop: 2 },
  sectionTitle: {
    fontSize: 12, fontWeight: '600', color: Colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10, marginTop: 4,
  },
  settingCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.card, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 8,
  },
  settingIcon: (bg: string) => ({
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: bg, justifyContent: 'center', alignItems: 'center',
    flexShrink: 0,
  }),
  settingText: { flex: 1 },
  settingName: { fontSize: 14, fontWeight: '600', color: Colors.text, marginBottom: 2 },
  settingDesc: { fontSize: 11, color: Colors.textMuted },
  settingInput: {
    backgroundColor: Colors.surface, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 6,
    fontSize: 12, color: Colors.text, marginTop: 4,
    borderWidth: 1, borderColor: Colors.border,
    fontFamily: 'monospace',
  },
  editBtn: { fontSize: 16, padding: 4 },
});

export default SettingsScreen;
