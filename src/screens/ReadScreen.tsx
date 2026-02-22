import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, ActivityIndicator, Alert, Clipboard,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import Toast from 'react-native-toast-message';
import { readNFCTag, cancelNFC } from '../services/nfcService';
import { addScanRecord } from '../services/storageService';
import { getMemberByNFCUid } from '../services/apiService';
import { NFCScanResult, NDEFRecord } from '../types';
import { formatTagForClipboard } from '../utils/hexUtils';
import { Colors } from '../utils/theme';

type ReadState = 'idle' | 'scanning' | 'result' | 'error';

const ReadScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [state, setState] = useState<ReadState>('idle');
  const [result, setResult] = useState<NFCScanResult | null>(null);
  const [lookingUpMember, setLookingUpMember] = useState(false);

  useEffect(() => {
    return () => { cancelNFC(); };
  }, []);

  const startScan = async () => {
    setState('scanning');
    try {
      const scanResult = await readNFCTag();
      if (scanResult.success) {
        ReactNativeHapticFeedback.trigger('notificationSuccess');
        setResult(scanResult);
        setState('result');
        await addScanRecord(scanResult);

        // Auto-lookup member from TP API
        setLookingUpMember(true);
        const member = await getMemberByNFCUid(scanResult.tag.id);
        if (member) {
          setResult(prev => prev ? { ...prev, memberInfo: member } : null);
        }
        setLookingUpMember(false);
      } else {
        setState('error');
        Toast.show({ type: 'error', text1: 'อ่านไม่สำเร็จ', text2: scanResult.errorMessage });
      }
    } catch (err) {
      setState('error');
    }
  };

  const copyUID = () => {
    if (!result) return;
    Clipboard.setString(result.tag.id);
    Toast.show({ type: 'success', text1: '📋 คัดลอก UID แล้ว', text2: result.tag.id });
  };

  const copyAll = () => {
    if (!result) return;
    const text = formatTagForClipboard(result.tag, result.ndefRecords);
    Clipboard.setString(text);
    Toast.show({ type: 'success', text1: '📋 คัดลอกข้อมูลทั้งหมดแล้ว' });
  };

  const getRecordIcon = (type: NDEFRecord['recordType']) => {
    switch (type) {
      case 'url': return '🔗';
      case 'text': return '📝';
      case 'vcard': return '👤';
      case 'smartposter': return '🪧';
      default: return '📦';
    }
  };

  const getRecordColor = (type: NDEFRecord['recordType']) => {
    switch (type) {
      case 'url': return Colors.primary;
      case 'text': return Colors.secondary;
      case 'vcard': return Colors.success;
      default: return Colors.textMuted;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />

      {/* App Bar */}
      <View style={styles.appBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>อ่านการ์ด NFC</Text>
          <Text style={styles.subtitle}>Read NFC Tag</Text>
        </View>
        {result && (
          <TouchableOpacity style={styles.iconBtn} onPress={copyAll}>
            <Text>📋</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Scan Zone */}
        <View style={[styles.scanZone, state === 'scanning' && styles.scanZoneActive]}>
          <View style={styles.scanRingContainer}>
            {state === 'scanning' && (
              <>
                <View style={[styles.ring, styles.ring1]} />
                <View style={[styles.ring, styles.ring2]} />
                <View style={[styles.ring, styles.ring3]} />
              </>
            )}
            <View style={styles.scanCenter}>
              {state === 'scanning' ? (
                <ActivityIndicator size="large" color={Colors.secondary} />
              ) : state === 'result' ? (
                <Text style={styles.scanCenterIcon}>✅</Text>
              ) : state === 'error' ? (
                <Text style={styles.scanCenterIcon}>❌</Text>
              ) : (
                <Text style={styles.scanCenterIcon}>📡</Text>
              )}
            </View>
          </View>

          <Text style={styles.scanTitle}>
            {state === 'scanning' ? 'กำลังสแกน...' :
             state === 'result' ? `พบ Tag แล้ว!` :
             state === 'error' ? 'เกิดข้อผิดพลาด' :
             'พร้อมสแกน'}
          </Text>
          <Text style={styles.scanHint}>
            {state === 'scanning' ? 'แตะการ์ดกับด้านหลังโทรศัพท์' :
             state === 'result' ? `${result?.tag.type} · ${result?.ndefRecords.length} records` :
             state === 'error' ? 'แตะอีกครั้งเพื่อลองใหม่' :
             'รองรับ NDEF · MIFARE · ISO-DEP · NFC-A/B/F/V'}
          </Text>
        </View>

        {/* Result Card */}
        {result && state === 'result' && (
          <>
            {/* Member Info (if found) */}
            {lookingUpMember && (
              <View style={styles.memberLookupCard}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={styles.memberLookupText}>กำลังค้นหาสมาชิก Thaiprompt...</Text>
              </View>
            )}
            {result.memberInfo && (
              <View style={styles.memberCard}>
                <View style={styles.memberCardHeader}>
                  <Text style={styles.memberCardLabel}>🏢 สมาชิก Thaiprompt Affiliate</Text>
                </View>
                <View style={styles.memberInfo}>
                  <View style={styles.memberAvatar}>
                    <Text style={styles.memberAvatarText}>
                      {result.memberInfo.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.memberName}>{result.memberInfo.name}</Text>
                    <Text style={styles.memberId}>ID: {result.memberInfo.memberId}</Text>
                  </View>
                  {result.memberInfo.rank && (
                    <View style={styles.rankBadge}>
                      <Text style={styles.rankText}>{result.memberInfo.rank}</Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Tag Info */}
            <View style={styles.tagResult}>
              <View style={styles.tagHeader}>
                <View style={styles.tagIcon}><Text>💳</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.tagTypeName}>{result.tag.type || 'NFC Tag'}</Text>
                  <Text style={styles.tagTypeSub}>
                    {result.tag.techTypes.slice(0, 2).map(t => t.split('.').pop()).join(' · ')}
                  </Text>
                </View>
                <View style={styles.successBadge}>
                  <Text style={styles.successText}>✓ สำเร็จ</Text>
                </View>
              </View>

              {[
                ['UID', result.tag.id],
                result.tag.atqa ? ['ATQA', result.tag.atqa] : null,
                result.tag.sak ? ['SAK', result.tag.sak] : null,
                result.tag.size ? ['ขนาด', `${result.tag.size} bytes`] : null,
                ['NDEF', result.ndefRecords.length > 0 ? `✓ ${result.ndefRecords.length} records` : '✗ ไม่พบ'],
              ].filter(Boolean).map(([key, val]) => (
                <View key={key as string} style={styles.infoRow}>
                  <Text style={styles.infoKey}>{key as string}</Text>
                  <Text style={[styles.infoVal, key === 'UID' && { color: Colors.secondary }]}>
                    {val as string}
                  </Text>
                </View>
              ))}
            </View>

            {/* NDEF Records */}
            {result.ndefRecords.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>NDEF Records ({result.ndefRecords.length})</Text>
                {result.ndefRecords.map((record, i) => (
                  <TouchableOpacity
                    key={i}
                    style={styles.recordCard}
                    onPress={() => {
                      Clipboard.setString(record.decodedData);
                      Toast.show({ type: 'success', text1: '📋 คัดลอกแล้ว' });
                    }}>
                    <View style={styles.recordHeader}>
                      <View style={[styles.recordBadge, { backgroundColor: getRecordColor(record.recordType) + '22' }]}>
                        <Text style={[styles.recordBadgeText, { color: getRecordColor(record.recordType) }]}>
                          {record.recordType.toUpperCase()}
                        </Text>
                      </View>
                      <Text style={styles.recordMeta}>Record {i + 1} of {result.ndefRecords.length}</Text>
                      <Text style={styles.recordSize}>{record.payloadSize} bytes</Text>
                    </View>
                    <Text style={[
                      styles.recordContent,
                      record.recordType === 'url' && { color: Colors.primary },
                    ]}>
                      {record.decodedData}
                    </Text>
                    {record.language && (
                      <Text style={styles.recordLang}>ภาษา: {record.language}</Text>
                    )}
                  </TouchableOpacity>
                ))}
              </>
            )}

            {/* Action Buttons */}
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.btnPrimary} onPress={copyUID}>
                <Text style={styles.btnPrimaryText}>📋 คัดลอก UID</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.btnSecondary}
                onPress={() => navigation.navigate('HexView', { result })}>
                <Text style={styles.btnSecondaryText}>🔢 Hex</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.btnSecondary}
                onPress={() => navigation.navigate('Clone')}>
                <Text style={styles.btnSecondaryText}>🔄</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Scan Button */}
        {state !== 'scanning' && (
          <TouchableOpacity
            style={[styles.scanBtn, state === 'result' && styles.scanBtnSecondary]}
            onPress={() => { setState('idle'); setResult(null); setTimeout(startScan, 100); }}>
            <Text style={styles.scanBtnText}>
              {state === 'result' ? '📡 สแกนใหม่' : '📡 เริ่มสแกน'}
            </Text>
          </TouchableOpacity>
        )}

        {state === 'scanning' && (
          <TouchableOpacity style={styles.cancelBtn} onPress={() => { cancelNFC(); setState('idle'); }}>
            <Text style={styles.cancelBtnText}>❌ ยกเลิก</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  appBar: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
    justifyContent: 'center', alignItems: 'center',
  },
  backBtnText: { fontSize: 18, color: Colors.text },
  title: { fontSize: 18, fontWeight: '700', color: Colors.text },
  subtitle: { fontSize: 11, color: Colors.textMuted },
  iconBtn: {
    marginLeft: 'auto' as any,
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
    justifyContent: 'center', alignItems: 'center',
  },
  scroll: { flex: 1, paddingHorizontal: 20 },
  scanZone: {
    backgroundColor: '#0d1a2a', borderWidth: 2,
    borderColor: 'rgba(34,211,238,0.3)', borderStyle: 'dashed',
    borderRadius: 24, padding: 32, alignItems: 'center', marginBottom: 16,
  },
  scanZoneActive: { borderColor: Colors.secondary },
  scanRingContainer: { width: 100, height: 100, position: 'relative', marginBottom: 20 },
  ring: {
    position: 'absolute', inset: 0, borderRadius: 50,
    borderWidth: 2, borderColor: 'rgba(34,211,238,0.3)',
  },
  ring1: {}, ring2: {}, ring3: {},
  scanCenter: {
    position: 'absolute', inset: 0,
    justifyContent: 'center', alignItems: 'center',
  },
  scanCenterIcon: { fontSize: 44 },
  scanTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 6 },
  scanHint: { fontSize: 12, color: Colors.textMuted, textAlign: 'center' },
  memberLookupCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.card, borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 12,
  },
  memberLookupText: { fontSize: 13, color: Colors.textMuted },
  memberCard: {
    backgroundColor: '#1a0d2e', borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: 'rgba(99,102,241,0.3)', marginBottom: 12,
  },
  memberCardHeader: { marginBottom: 12 },
  memberCardLabel: { fontSize: 11, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 },
  memberInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  memberAvatar: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center',
  },
  memberAvatarText: { fontSize: 20, fontWeight: '700', color: 'white' },
  memberName: { fontSize: 15, fontWeight: '700', color: Colors.text, marginBottom: 2 },
  memberId: { fontSize: 11, color: Colors.textMuted },
  rankBadge: {
    backgroundColor: 'rgba(245,158,11,0.15)', paddingHorizontal: 10,
    paddingVertical: 4, borderRadius: 20,
  },
  rankText: { fontSize: 11, fontWeight: '700', color: Colors.warning },
  tagResult: {
    backgroundColor: Colors.card, borderRadius: 20, padding: 18,
    borderWidth: 1, borderColor: 'rgba(34,211,238,0.3)', marginBottom: 12,
  },
  tagHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginBottom: 14, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  tagIcon: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: 'rgba(34,211,238,0.15)', justifyContent: 'center', alignItems: 'center',
  },
  tagTypeName: { fontSize: 15, fontWeight: '700', color: Colors.text },
  tagTypeSub: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  successBadge: {
    backgroundColor: 'rgba(16,185,129,0.15)', paddingHorizontal: 10,
    paddingVertical: 4, borderRadius: 20,
  },
  successText: { fontSize: 11, fontWeight: '600', color: Colors.success },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  infoKey: { fontSize: 12, color: Colors.textMuted },
  infoVal: { fontSize: 12, fontWeight: '600', color: Colors.text, fontFamily: 'monospace' },
  sectionTitle: {
    fontSize: 12, fontWeight: '600', color: Colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10, marginTop: 4,
  },
  recordCard: {
    backgroundColor: Colors.surface, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 8,
  },
  recordHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  recordBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  recordBadgeText: { fontSize: 10, fontWeight: '700', fontFamily: 'monospace' },
  recordMeta: { fontSize: 11, color: Colors.textMuted, flex: 1 },
  recordSize: { fontSize: 10, color: Colors.textMuted },
  recordContent: { fontSize: 13, color: Colors.text, lineHeight: 18 },
  recordLang: { fontSize: 10, color: Colors.textMuted, marginTop: 6 },
  actionRow: { flexDirection: 'row', gap: 8, marginVertical: 16 },
  btnPrimary: {
    flex: 1, backgroundColor: Colors.primary, borderRadius: 12,
    paddingVertical: 12, alignItems: 'center',
  },
  btnPrimaryText: { fontSize: 13, fontWeight: '600', color: 'white' },
  btnSecondary: {
    backgroundColor: Colors.card, borderRadius: 12, paddingHorizontal: 16,
    paddingVertical: 12, borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center',
  },
  btnSecondaryText: { fontSize: 13, fontWeight: '600', color: Colors.text },
  scanBtn: {
    backgroundColor: Colors.primary, borderRadius: 14,
    paddingVertical: 16, alignItems: 'center', marginBottom: 10,
  },
  scanBtnSecondary: {
    backgroundColor: 'transparent', borderWidth: 1, borderColor: Colors.primary,
  },
  scanBtnText: { fontSize: 15, fontWeight: '600', color: 'white' },
  cancelBtn: {
    backgroundColor: Colors.card, borderRadius: 14,
    paddingVertical: 14, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: Colors.danger },
});

export default ReadScreen;
