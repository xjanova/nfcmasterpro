import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, StatusBar, ActivityIndicator, Alert, Switch,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import Toast from 'react-native-toast-message';
import { writeNFCTag, cancelNFC } from '../services/nfcService';
import { addScanRecord } from '../services/storageService';
import { WritePayload, TPMember } from '../types';
import { Colors } from '../utils/theme';

type WriteType = 'url' | 'text' | 'vcard' | 'smartposter' | 'tp_member';

const WriteScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const prefillMember: TPMember | undefined = route.params?.prefillMember;

  const [writeType, setWriteType] = useState<WriteType>('url');
  const [isWriting, setIsWriting] = useState(false);

  // URL
  const [url, setUrl] = useState('https://');
  // Text
  const [text, setText] = useState('');
  const [language, setLanguage] = useState('th');
  // vCard
  const [vcName, setVcName] = useState('');
  const [vcPhone, setVcPhone] = useState('');
  const [vcEmail, setVcEmail] = useState('');
  const [vcOrg, setVcOrg] = useState('');
  // Smart Poster
  const [spUrl, setSpUrl] = useState('');
  const [spTitle, setSpTitle] = useState('');
  // TP Member
  const [memberId, setMemberId] = useState(prefillMember?.memberId || '');
  const [memberName, setMemberName] = useState(prefillMember?.name || '');
  const [memberRank, setMemberRank] = useState(prefillMember?.rank || 'BRONZE');
  const [memberAffUrl, setMemberAffUrl] = useState(prefillMember?.affiliateUrl || '');

  const getPayloadSize = (): number => {
    switch (writeType) {
      case 'url': return Math.max(0, url.length - 4) + 3;
      case 'text': return text.length + language.length + 3;
      case 'vcard': return vcName.length + vcPhone.length + vcEmail.length + vcOrg.length + 30;
      case 'smartposter': return spUrl.length + spTitle.length + 6;
      case 'tp_member': return memberId.length + memberName.length + memberAffUrl.length + 50;
      default: return 0;
    }
  };

  const buildPayload = (): WritePayload | null => {
    switch (writeType) {
      case 'url':
        if (!url.startsWith('http')) { Toast.show({ type: 'error', text1: 'URL ไม่ถูกต้อง' }); return null; }
        return { type: 'url', url };
      case 'text':
        if (!text.trim()) { Toast.show({ type: 'error', text1: 'กรุณากรอกข้อความ' }); return null; }
        return { type: 'text', text: text.trim(), language };
      case 'vcard':
        if (!vcName.trim()) { Toast.show({ type: 'error', text1: 'กรุณากรอกชื่อ' }); return null; }
        return { type: 'vcard', vcardData: { name: vcName, phone: vcPhone, email: vcEmail, organization: vcOrg } };
      case 'smartposter':
        if (!spUrl) { Toast.show({ type: 'error', text1: 'กรุณากรอก URL' }); return null; }
        return { type: 'smartposter', url: spUrl, text: spTitle, language };
      case 'tp_member':
        if (!memberId.trim()) { Toast.show({ type: 'error', text1: 'กรุณากรอก Member ID' }); return null; }
        const member: TPMember = {
          memberId, name: memberName, rank: memberRank,
          affiliateUrl: memberAffUrl || `https://thaiprompt.com/affiliate?ref=${memberId}`,
        };
        return { type: 'tp_member', memberData: member };
      default: return null;
    }
  };

  const startWrite = async () => {
    const payload = buildPayload();
    if (!payload) return;

    setIsWriting(true);
    try {
      const res = await writeNFCTag(payload);
      if (res.success && res.tag) {
        ReactNativeHapticFeedback.trigger('notificationSuccess');
        Toast.show({ type: 'success', text1: '✅ เขียนสำเร็จ!', text2: res.tag.id });
        await addScanRecord({
          id: `write_${Date.now()}`,
          timestamp: Date.now(),
          tag: res.tag,
          ndefRecords: [],
          operation: 'write',
          success: true,
        });
        navigation.navigate('WriteResult', { success: true, tag: res.tag });
      } else {
        Toast.show({ type: 'error', text1: 'เขียนไม่สำเร็จ', text2: res.error });
      }
    } catch (err) {
      Toast.show({ type: 'error', text1: 'เกิดข้อผิดพลาด' });
    } finally {
      setIsWriting(false);
    }
  };

  const typeOptions: { key: WriteType; label: string; icon: string }[] = [
    { key: 'url', label: 'URL', icon: '🔗' },
    { key: 'text', label: 'Text', icon: '📝' },
    { key: 'vcard', label: 'vCard', icon: '👤' },
    { key: 'smartposter', label: 'Smart Poster', icon: '🪧' },
    { key: 'tp_member', label: 'TP Member', icon: '🏢' },
  ];

  const payloadSize = getPayloadSize();
  const maxSize = 300;
  const fillPercent = Math.min(100, (payloadSize / maxSize) * 100);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />
      <View style={styles.appBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>เขียนการ์ด NFC</Text>
          <Text style={styles.subtitle}>Write NDEF Data</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Type Selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScroll}>
          {typeOptions.map(opt => (
            <TouchableOpacity
              key={opt.key}
              style={[styles.typePill, writeType === opt.key && styles.typePillActive]}
              onPress={() => setWriteType(opt.key)}>
              <Text style={styles.typePillIcon}>{opt.icon}</Text>
              <Text style={[styles.typePillText, writeType === opt.key && styles.typePillTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* URL Form */}
        {writeType === 'url' && (
          <View>
            <Text style={styles.inputLabel}>🔗 URL</Text>
            <TextInput
              style={[styles.input, { color: Colors.primary }]}
              value={url} onChangeText={setUrl}
              placeholder="https://example.com" placeholderTextColor={Colors.textMuted}
              autoCapitalize="none" keyboardType="url"
            />
          </View>
        )}

        {/* Text Form */}
        {writeType === 'text' && (
          <View>
            <Text style={styles.inputLabel}>📝 ข้อความ</Text>
            <TextInput
              style={[styles.input, styles.inputMulti]}
              value={text} onChangeText={setText}
              placeholder="พิมพ์ข้อความที่ต้องการเขียน" placeholderTextColor={Colors.textMuted}
              multiline numberOfLines={4}
            />
            <Text style={styles.inputLabel}>🌐 ภาษา (language code)</Text>
            <TextInput
              style={styles.input} value={language} onChangeText={setLanguage}
              placeholder="th, en, ja..." placeholderTextColor={Colors.textMuted}
            />
          </View>
        )}

        {/* vCard Form */}
        {writeType === 'vcard' && (
          <View>
            {[
              ['📛 ชื่อ *', vcName, setVcName, 'ชื่อ-นามสกุล', false],
              ['📱 โทรศัพท์', vcPhone, setVcPhone, '+66812345678', false],
              ['📧 อีเมล', vcEmail, setVcEmail, 'user@email.com', false],
              ['🏢 องค์กร', vcOrg, setVcOrg, 'บริษัท / องค์กร', false],
            ].map(([label, val, setter, placeholder]) => (
              <View key={label as string}>
                <Text style={styles.inputLabel}>{label as string}</Text>
                <TextInput
                  style={styles.input}
                  value={val as string}
                  onChangeText={setter as any}
                  placeholder={placeholder as string}
                  placeholderTextColor={Colors.textMuted}
                />
              </View>
            ))}
          </View>
        )}

        {/* Smart Poster Form */}
        {writeType === 'smartposter' && (
          <View>
            <Text style={styles.inputLabel}>🔗 URL</Text>
            <TextInput
              style={[styles.input, { color: Colors.primary }]}
              value={spUrl} onChangeText={setSpUrl}
              placeholder="https://example.com" placeholderTextColor={Colors.textMuted}
              autoCapitalize="none"
            />
            <Text style={styles.inputLabel}>📝 ชื่อ / คำอธิบาย</Text>
            <TextInput
              style={styles.input} value={spTitle} onChangeText={setSpTitle}
              placeholder="คำอธิบาย Smart Poster" placeholderTextColor={Colors.textMuted}
            />
          </View>
        )}

        {/* TP Member Form */}
        {writeType === 'tp_member' && (
          <View>
            {prefillMember && (
              <View style={styles.prefillBanner}>
                <Text style={styles.prefillText}>✅ ข้อมูลจาก Thaiprompt API</Text>
              </View>
            )}
            <Text style={styles.inputLabel}>🆔 Member ID *</Text>
            <TextInput
              style={styles.input} value={memberId} onChangeText={setMemberId}
              placeholder="TH00123" placeholderTextColor={Colors.textMuted}
            />
            <Text style={styles.inputLabel}>👤 ชื่อสมาชิก</Text>
            <TextInput
              style={styles.input} value={memberName} onChangeText={setMemberName}
              placeholder="ชื่อ-นามสกุล" placeholderTextColor={Colors.textMuted}
            />
            <Text style={styles.inputLabel}>⭐ ระดับ (Rank)</Text>
            <View style={styles.rankRow}>
              {['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'].map(rank => (
                <TouchableOpacity
                  key={rank}
                  style={[styles.rankBtn, memberRank === rank && styles.rankBtnActive]}
                  onPress={() => setMemberRank(rank)}>
                  <Text style={[styles.rankBtnText, memberRank === rank && { color: Colors.warning }]}>
                    {rank}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.inputLabel}>🔗 Affiliate URL</Text>
            <TextInput
              style={[styles.input, { color: Colors.primary }]}
              value={memberAffUrl}
              onChangeText={setMemberAffUrl}
              placeholder={`https://thaiprompt.com/affiliate?ref=${memberId || 'XXXXXX'}`}
              placeholderTextColor={Colors.textMuted}
            />
          </View>
        )}

        {/* Payload Size Indicator */}
        <View style={styles.sizeRow}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${fillPercent}%` as any }]} />
          </View>
          <Text style={styles.sizeText}>{payloadSize} / {maxSize} bytes</Text>
        </View>

        <View style={styles.hintBox}>
          <Text style={styles.hintText}>💡 แตะการ์ด NFC กับด้านหลังโทรศัพท์เพื่อเริ่มเขียนข้อมูล</Text>
        </View>

        {/* Scan Zone Indicator */}
        {isWriting && (
          <View style={styles.writingZone}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.writingTitle}>กำลังเขียน...</Text>
            <Text style={styles.writingHint}>อย่าขยับการ์ดออกจากโทรศัพท์</Text>
          </View>
        )}

        {/* Write Button */}
        {!isWriting && (
          <TouchableOpacity style={styles.writeBtn} onPress={startWrite}>
            <Text style={styles.writeBtnText}>✏️ เริ่มเขียนการ์ด</Text>
          </TouchableOpacity>
        )}

        {isWriting && (
          <TouchableOpacity style={styles.cancelBtn} onPress={() => { cancelNFC(); setIsWriting(false); }}>
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
  scroll: { flex: 1, paddingHorizontal: 20 },
  typeScroll: { marginBottom: 20 },
  typePill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: Colors.border, marginRight: 8,
    backgroundColor: 'transparent',
  },
  typePillActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  typePillIcon: { fontSize: 14 },
  typePillText: { fontSize: 12, fontWeight: '600', color: Colors.textMuted },
  typePillTextActive: { color: 'white' },
  inputLabel: {
    fontSize: 12, fontWeight: '600', color: Colors.textMuted,
    marginBottom: 6, marginTop: 12,
  },
  input: {
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 13, color: Colors.text,
  },
  inputMulti: { height: 100, textAlignVertical: 'top' },
  rankRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  rankBtn: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.card,
  },
  rankBtnActive: { borderColor: Colors.warning, backgroundColor: 'rgba(245,158,11,0.15)' },
  rankBtnText: { fontSize: 12, fontWeight: '600', color: Colors.textMuted },
  prefillBanner: {
    backgroundColor: 'rgba(16,185,129,0.1)', borderRadius: 10, padding: 10,
    borderWidth: 1, borderColor: 'rgba(16,185,129,0.3)', marginBottom: 10,
  },
  prefillText: { fontSize: 12, color: Colors.success, fontWeight: '600' },
  sizeRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16 },
  progressBar: {
    flex: 1, height: 6, borderRadius: 20,
    backgroundColor: Colors.surface, overflow: 'hidden',
  },
  progressFill: {
    height: '100%', borderRadius: 20,
    backgroundColor: Colors.primary,
  },
  sizeText: { fontSize: 11, fontWeight: '600', color: Colors.secondary },
  hintBox: {
    backgroundColor: 'rgba(245,158,11,0.1)', borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)', marginTop: 12,
  },
  hintText: { fontSize: 12, color: Colors.warning },
  writingZone: {
    backgroundColor: Colors.card, borderRadius: 20, padding: 32,
    alignItems: 'center', marginTop: 16, borderWidth: 1, borderColor: Colors.border,
  },
  writingTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginTop: 12 },
  writingHint: { fontSize: 12, color: Colors.textMuted, marginTop: 4 },
  writeBtn: {
    backgroundColor: Colors.primary, borderRadius: 14,
    paddingVertical: 16, alignItems: 'center', marginTop: 20,
  },
  writeBtnText: { fontSize: 15, fontWeight: '600', color: 'white' },
  cancelBtn: {
    backgroundColor: Colors.card, borderRadius: 14,
    paddingVertical: 14, alignItems: 'center', marginTop: 10,
    borderWidth: 1, borderColor: Colors.border,
  },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: Colors.danger },
});

export default WriteScreen;
