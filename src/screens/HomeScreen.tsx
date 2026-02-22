import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, RefreshControl, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { initNFC, isNFCEnabled } from '../services/nfcService';
import { getStats, getScanHistory } from '../services/storageService';
import { testConnection } from '../services/apiService';
import { NFCScanResult } from '../types';
import { Colors, Typography } from '../utils/theme';

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [nfcReady, setNfcReady] = useState(false);
  const [stats, setStats] = useState({ reads: 0, writes: 0, clones: 0, registers: 0 });
  const [recentHistory, setRecentHistory] = useState<NFCScanResult[]>([]);
  const [apiConnected, setApiConnected] = useState(false);
  const [apiLatency, setApiLatency] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    const [nfcEnabled, statsData, history, apiStatus] = await Promise.all([
      isNFCEnabled(),
      getStats(),
      getScanHistory(),
      testConnection(),
    ]);
    setNfcReady(nfcEnabled);
    setStats(statsData);
    setRecentHistory(history.slice(0, 5));
    setApiConnected(apiStatus.connected);
    setApiLatency(apiStatus.latency || null);
  }, []);

  useEffect(() => {
    initNFC().then(supported => {
      if (!supported) Alert.alert('ไม่รองรับ NFC', 'อุปกรณ์นี้ไม่มี NFC หรือ NFC ถูกปิดอยู่');
    });
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getOperationLabel = (op: string) => {
    switch (op) {
      case 'read': return { label: 'อ่าน', color: Colors.secondary };
      case 'write': return { label: 'เขียน', color: Colors.primary };
      case 'clone': return { label: 'โคลน', color: Colors.warning };
      case 'register': return { label: 'ลงทะเบียน', color: Colors.success };
      default: return { label: op, color: Colors.textMuted };
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />

      {/* App Bar */}
      <View style={styles.appBar}>
        <View>
          <Text style={styles.appTitle}>NFC Master Pro</Text>
          <Text style={styles.appSubtitle}>
            {nfcReady ? '📡 NFC พร้อมใช้งาน' : '⚠️ NFC ถูกปิดอยู่'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => navigation.navigate('Settings')}>
          <Text style={styles.iconBtnText}>⚙️</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        showsVerticalScrollIndicator={false}>

        {/* Hero Banner */}
        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <Text style={styles.heroIconText}>📡</Text>
          </View>
          <Text style={styles.heroTitle}>แตะการ์ดเพื่อเริ่ม</Text>
          <Text style={styles.heroSub}>รองรับ NDEF · MIFARE · ISO-DEP · NFC-A/B/F/V</Text>
        </View>

        {/* Action Grid */}
        <View style={styles.actionGrid}>
          <TouchableOpacity
            style={[styles.actionCard, { borderColor: 'rgba(34,211,238,0.3)' }]}
            onPress={() => navigation.navigate('Read')}>
            <Text style={styles.actionIcon}>📡</Text>
            <Text style={styles.actionName}>อ่านการ์ด</Text>
            <Text style={styles.actionDesc}>Read NFC Tag</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { borderColor: 'rgba(99,102,241,0.3)' }]}
            onPress={() => navigation.navigate('Write')}>
            <View style={styles.newBadge}><Text style={styles.newBadgeText}>NEW</Text></View>
            <Text style={styles.actionIcon}>✏️</Text>
            <Text style={styles.actionName}>เขียนการ์ด</Text>
            <Text style={styles.actionDesc}>Write NDEF Data</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { borderColor: 'rgba(245,158,11,0.3)' }]}
            onPress={() => navigation.navigate('Clone')}>
            <Text style={styles.actionIcon}>🔄</Text>
            <Text style={styles.actionName}>โคลนการ์ด</Text>
            <Text style={styles.actionDesc}>Clone Tag</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, { borderColor: 'rgba(16,185,129,0.3)' }]}
            onPress={() => navigation.navigate('HexView')}>
            <Text style={styles.actionIcon}>🔢</Text>
            <Text style={styles.actionName}>Hex Viewer</Text>
            <Text style={styles.actionDesc}>Raw Data View</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={[styles.statVal, { color: Colors.secondary }]}>{stats.reads}</Text>
            <Text style={styles.statLabel}>สแกนแล้ว</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statVal, { color: Colors.primary }]}>{stats.writes}</Text>
            <Text style={styles.statLabel}>เขียนแล้ว</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statVal, { color: Colors.success }]}>{stats.clones + stats.registers}</Text>
            <Text style={styles.statLabel}>โคลน/Reg</Text>
          </View>
        </View>

        {/* TP Integration Banner */}
        <View style={styles.tpBanner}>
          <View style={styles.tpHeader}>
            <View style={styles.tpLogo}><Text>🔗</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.tpTitle}>Thaiprompt Affiliate</Text>
              <Text style={styles.tpSub}>
                {apiConnected
                  ? `✅ เชื่อมต่อแล้ว${apiLatency ? ` (${apiLatency}ms)` : ''}`
                  : '❌ ไม่ได้เชื่อมต่อ'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.tpSettingsBtn}
              onPress={() => navigation.navigate('Settings')}>
              <Text style={styles.tpSettingsText}>ตั้งค่า</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.regBtn}
            onPress={() => navigation.navigate('MemberRegister')}>
            <Text style={styles.regBtnText}>📝 ลงทะเบียนสมาชิก NFC</Text>
          </TouchableOpacity>
        </View>

        {/* Recent History */}
        {recentHistory.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>ล่าสุด</Text>
              <TouchableOpacity onPress={() => navigation.navigate('History')}>
                <Text style={styles.seeAll}>ดูทั้งหมด →</Text>
              </TouchableOpacity>
            </View>

            {recentHistory.map(item => {
              const { label, color } = getOperationLabel(item.operation);
              return (
                <TouchableOpacity
                  key={item.id}
                  style={styles.recentItem}
                  onPress={() => {
                    if (item.operation === 'read') navigation.navigate('ReadResult', { result: item });
                  }}>
                  <View style={[styles.recentIcon, { backgroundColor: color + '22' }]}>
                    <Text>{item.operation === 'read' ? '📡' : item.operation === 'write' ? '✏️' : '🔄'}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.recentName}>{item.tag.type || 'NFC Tag'}</Text>
                    <Text style={styles.recentMeta}>UID: {item.tag.id}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.recentOp, { color }]}>{label}</Text>
                    <Text style={styles.recentTime}>
                      {formatRelativeTime(item.timestamp)}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
};

const formatRelativeTime = (timestamp: number): string => {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'เมื่อกี้';
  if (minutes < 60) return `${minutes} นาที`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ชั่วโมง`;
  return `${Math.floor(hours / 24)} วัน`;
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  appBar: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12,
  },
  appTitle: { fontSize: 20, fontWeight: '700', color: Colors.text },
  appSubtitle: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  iconBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
    justifyContent: 'center', alignItems: 'center',
  },
  iconBtnText: { fontSize: 18 },
  scroll: { flex: 1, paddingHorizontal: 20 },
  hero: {
    backgroundColor: '#1a1a30', borderRadius: 24, padding: 28, marginBottom: 16,
    alignItems: 'center', borderWidth: 1, borderColor: 'rgba(99,102,241,0.3)',
  },
  heroIcon: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(99,102,241,0.15)', borderWidth: 2,
    borderColor: 'rgba(99,102,241,0.4)', justifyContent: 'center',
    alignItems: 'center', marginBottom: 14,
  },
  heroIconText: { fontSize: 34 },
  heroTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 4 },
  heroSub: { fontSize: 12, color: Colors.textMuted, textAlign: 'center' },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  actionCard: {
    width: '47%', backgroundColor: Colors.card,
    borderRadius: 16, padding: 18, borderWidth: 1,
    borderColor: Colors.border,
  },
  actionIcon: { fontSize: 28, marginBottom: 10 },
  actionName: { fontSize: 14, fontWeight: '600', color: Colors.text, marginBottom: 2 },
  actionDesc: { fontSize: 11, color: Colors.textMuted },
  newBadge: {
    position: 'absolute', top: 12, right: 12,
    backgroundColor: Colors.primary, borderRadius: 20,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  newBadgeText: { fontSize: 10, fontWeight: '700', color: 'white' },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard: {
    flex: 1, backgroundColor: Colors.card, borderRadius: 14,
    padding: 14, borderWidth: 1, borderColor: Colors.border, alignItems: 'center',
  },
  statVal: { fontSize: 24, fontWeight: '800', marginBottom: 2 },
  statLabel: { fontSize: 10, color: Colors.textMuted, fontWeight: '500' },
  tpBanner: {
    backgroundColor: '#1a0d2e', borderRadius: 20, padding: 18, marginBottom: 16,
    borderWidth: 1, borderColor: 'rgba(99,102,241,0.3)',
  },
  tpHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  tpLogo: {
    width: 36, height: 36, borderRadius: 8,
    backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center',
  },
  tpTitle: { fontSize: 14, fontWeight: '700', color: Colors.text },
  tpSub: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  tpSettingsBtn: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    borderWidth: 1, borderColor: Colors.border,
  },
  tpSettingsText: { fontSize: 11, color: Colors.textMuted, fontWeight: '600' },
  regBtn: {
    backgroundColor: Colors.primary, borderRadius: 12,
    paddingVertical: 14, alignItems: 'center',
  },
  regBtnText: { fontSize: 14, fontWeight: '600', color: 'white' },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 12, fontWeight: '600', color: Colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.8,
  },
  seeAll: { fontSize: 12, color: Colors.primary, fontWeight: '600' },
  recentItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.card, borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 8,
  },
  recentIcon: {
    width: 38, height: 38, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
  },
  recentName: { fontSize: 13, fontWeight: '600', color: Colors.text, marginBottom: 2 },
  recentMeta: { fontSize: 11, color: Colors.textMuted },
  recentOp: { fontSize: 11, fontWeight: '700', marginBottom: 2 },
  recentTime: { fontSize: 10, color: Colors.textMuted },
});

export default HomeScreen;
