/**
 * MemberRegisterScreen — ลงทะเบียนสมาชิก Thaiprompt ผ่าน NFC
 * Flow: กรอกข้อมูล → แตะการ์ด → ลงทะเบียน API → เขียนการ์ด
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, StatusBar, ActivityIndicator, Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import Toast from 'react-native-toast-message';
import { readNFCTag, writeNFCTag, cancelNFC } from '../services/nfcService';
import { registerMemberViaNFC, linkNFCToMember, searchMembers } from '../services/apiService';
import { addScanRecord } from '../services/storageService';
import { TPMember } from '../types';
import { Colors } from '../utils/theme';

type Step = 'form' | 'scanning' | 'registering' | 'writing' | 'done' | 'error';
type Mode = 'register_new' | 'link_existing';

const MemberRegisterScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const [mode, setMode] = useState<Mode>('register_new');
  const [step, setStep] = useState<Step>('form');
  const [progress, setProgress] = useState(0);

  // New member form
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [referralCode, setReferralCode] = useState('');

  // Link existing
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<TPMember[]>([]);
  const [selectedMember, setSelectedMember] = useState<TPMember | null>(null);

  // Result
  const [registeredMember, setRegisteredMember] = useState<TPMember | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const doSearch = async () => {
    if (!searchQuery.trim()) return;
    const results = await searchMembers(searchQuery);
    setSearchResults(results);
  };

  const startNFCRegister = async () => {
    if (mode === 'register_new' && !name.trim()) {
      Toast.show({ type: 'error', text1: 'กรุณากรอกชื่อ' }); return;
    }
    if (mode === 'register_new' && !phone.trim()) {
      Toast.show({ type: 'error', text1: 'กรุณากรอกเบอร์โทร' }); return;
    }
    if (mode === 'link_existing' && !selectedMember) {
      Toast.show({ type: 'error', text1: 'กรุณาเลือกสมาชิก' }); return;
    }

    setStep('scanning');
    setProgress(25);

    // Step 1: Read NFC tag to get UID
    const scanResult = await readNFCTag();
    if (!scanResult.success) {
      setStep('error');
      setErrorMsg(scanResult.errorMessage || 'อ่านการ์ดไม่สำเร็จ');
      return;
    }

    ReactNativeHapticFeedback.trigger('notificationSuccess');
    setProgress(50);
    setStep('registering');

    let member: TPMember | null = null;

    if (mode === 'register_new') {
      // Step 2: Register via API
      const regResult = await registerMemberViaNFC({
        memberName: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        referralCode: referralCode.trim() || undefined,
        nfcUid: scanResult.tag.id,
        nfcTagType: scanResult.tag.type || 'NFC Tag',
      });

      if (!regResult.success) {
        setStep('error');
        setErrorMsg(regResult.error || 'ลงทะเบียนไม่สำเร็จ');
        return;
      }
      member = regResult.member!;
    } else if (mode === 'link_existing' && selectedMember) {
      // Step 2: Link NFC to existing member
      const linkResult = await linkNFCToMember(
        selectedMember.memberId,
        scanResult.tag.id,
        scanResult.tag.type || 'NFC Tag'
      );
      if (!linkResult.success) {
        setStep('error');
        setErrorMsg(linkResult.error || 'เชื่อมโยงไม่สำเร็จ');
        return;
      }
      member = selectedMember;
    }

    if (!member) { setStep('error'); setErrorMsg('ไม่พบข้อมูลสมาชิก'); return; }

    setRegisteredMember(member);
    setProgress(75);
    setStep('writing');

    // Step 3: Write member data to NFC card
    const affiliateUrl = member.affiliateUrl ||
      `https://thaiprompt.com/affiliate?ref=${member.affiliateCode || member.memberId}`;

    const writeResult = await writeNFCTag({
      type: 'tp_member',
      memberData: { ...member, affiliateUrl },
    });

    if (!writeResult.success) {
      // Writing failed — registration still succeeded
      Toast.show({ type: 'info', text1: '⚠️ ลงทะเบียนสำเร็จ แต่เขียนการ์ดไม่สำเร็จ' });
    } else {
      ReactNativeHapticFeedback.trigger('notificationSuccess');
    }

    // Save to history
    await addScanRecord({
      id: `reg_${Date.now()}`,
      timestamp: Date.now(),
      tag: scanResult.tag,
      ndefRecords: scanResult.ndefRecords,
      operation: 'register',
      memberInfo: member,
      success: true,
    });

    setProgress(100);
    setStep('done');
  };

  const reset = () => {
    setStep('form');
    setProgress(0);
    setRegisteredMember(null);
    setErrorMsg('');
    setName(''); setPhone(''); setEmail(''); setReferralCode('');
    setSelectedMember(null); setSearchQuery(''); setSearchResults([]);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />
      <View style={styles.appBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>ลงทะเบียนสมาชิก NFC</Text>
          <Text style={styles.subtitle}>Thaiprompt Affiliate</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Progress Steps */}
        <View style={styles.stepsRow}>
          {[
            { label: 'กรอกข้อมูล', done: progress >= 25 },
            { label: 'สแกนการ์ด', done: progress >= 50 },
            { label: 'ลงทะเบียน', done: progress >= 75 },
            { label: 'เขียนการ์ด', done: progress >= 100 },
          ].map((s, i) => (
            <View key={i} style={styles.stepItem}>
              <View style={[styles.stepCircle, s.done && styles.stepCircleDone]}>
                <Text style={[styles.stepNum, s.done && styles.stepNumDone]}>
                  {s.done ? '✓' : i + 1}
                </Text>
              </View>
              <Text style={[styles.stepLabel, s.done && { color: Colors.success }]}>{s.label}</Text>
              {i < 3 && <View style={[styles.stepLine, s.done && styles.stepLineDone]} />}
            </View>
          ))}
        </View>

        {/* Form */}
        {step === 'form' && (
          <>
            {/* Mode Selector */}
            <View style={styles.modeRow}>
              <TouchableOpacity
                style={[styles.modeBtn, mode === 'register_new' && styles.modeBtnActive]}
                onPress={() => setMode('register_new')}>
                <Text style={[styles.modeBtnText, mode === 'register_new' && styles.modeBtnTextActive]}>
                  ➕ สมาชิกใหม่
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modeBtn, mode === 'link_existing' && styles.modeBtnActive]}
                onPress={() => setMode('link_existing')}>
                <Text style={[styles.modeBtnText, mode === 'link_existing' && styles.modeBtnTextActive]}>
                  🔗 เชื่อมการ์ดกับสมาชิกเดิม
                </Text>
              </TouchableOpacity>
            </View>

            {/* New Member Form */}
            {mode === 'register_new' && (
              <>
                {[
                  ['👤 ชื่อ-นามสกุล *', name, setName, 'ชื่อ นามสกุล', false],
                  ['📱 เบอร์โทรศัพท์ *', phone, setPhone, '0812345678', true],
                  ['📧 อีเมล (ไม่บังคับ)', email, setEmail, 'user@email.com', false],
                  ['🎁 รหัสผู้แนะนำ', referralCode, setReferralCode, 'REF00000', false],
                ].map(([label, val, setter, placeholder, numeric]) => (
                  <View key={label as string}>
                    <Text style={styles.inputLabel}>{label as string}</Text>
                    <TextInput
                      style={styles.input}
                      value={val as string}
                      onChangeText={setter as any}
                      placeholder={placeholder as string}
                      placeholderTextColor={Colors.textMuted}
                      keyboardType={numeric ? 'phone-pad' : 'default'}
                    />
                  </View>
                ))}
              </>
            )}

            {/* Link Existing Form */}
            {mode === 'link_existing' && (
              <>
                <Text style={styles.inputLabel}>🔍 ค้นหาสมาชิก</Text>
                <View style={styles.searchRow}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="ชื่อ / ID / เบอร์โทร"
                    placeholderTextColor={Colors.textMuted}
                    onSubmitEditing={doSearch}
                  />
                  <TouchableOpacity style={styles.searchBtn} onPress={doSearch}>
                    <Text style={styles.searchBtnText}>ค้นหา</Text>
                  </TouchableOpacity>
                </View>

                {selectedMember && (
                  <View style={styles.selectedMemberCard}>
                    <Text style={styles.selectedLabel}>✅ เลือกแล้ว</Text>
                    <Text style={styles.selectedName}>{selectedMember.name}</Text>
                    <Text style={styles.selectedId}>{selectedMember.memberId} · {selectedMember.rank}</Text>
                  </View>
                )}

                {searchResults.map(member => (
                  <TouchableOpacity
                    key={member.memberId}
                    style={[styles.searchResult, selectedMember?.memberId === member.memberId && styles.searchResultSelected]}
                    onPress={() => setSelectedMember(member)}>
                    <View style={styles.searchResultAvatar}>
                      <Text style={styles.searchResultAvatarText}>{member.name.charAt(0)}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.searchResultName}>{member.name}</Text>
                      <Text style={styles.searchResultId}>{member.memberId}</Text>
                    </View>
                    <Text style={styles.searchResultRank}>{member.rank}</Text>
                  </TouchableOpacity>
                ))}
              </>
            )}

            <TouchableOpacity style={styles.startBtn} onPress={startNFCRegister}>
              <Text style={styles.startBtnText}>📡 สแกนการ์ด NFC เพื่อลงทะเบียน</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Scanning/Processing State */}
        {(step === 'scanning' || step === 'registering' || step === 'writing') && (
          <View style={styles.processingCard}>
            <ActivityIndicator size="large" color={Colors.primary} style={{ marginBottom: 16 }} />
            <Text style={styles.processingTitle}>
              {step === 'scanning' ? 'กำลังอ่านการ์ด...' :
               step === 'registering' ? 'กำลังลงทะเบียน API...' :
               'กำลังเขียนการ์ด...'}
            </Text>
            <Text style={styles.processingHint}>
              {step === 'scanning' ? 'แตะการ์ด NFC กับโทรศัพท์' :
               step === 'registering' ? 'กำลังส่งข้อมูลไปยัง Thaiprompt API' :
               'กรุณาอย่าขยับการ์ด'}
            </Text>
            <View style={styles.progressBarWrap}>
              <View style={[styles.progressFill, { width: `${progress}%` as any }]} />
            </View>
          </View>
        )}

        {/* Success State */}
        {step === 'done' && registeredMember && (
          <View style={styles.successCard}>
            <Text style={styles.successIcon}>🎉</Text>
            <Text style={styles.successTitle}>ลงทะเบียนสำเร็จ!</Text>
            <View style={styles.memberResultCard}>
              <View style={styles.memberResultAvatar}>
                <Text style={styles.memberResultAvatarText}>
                  {registeredMember.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.memberResultName}>{registeredMember.name}</Text>
                <Text style={styles.memberResultId}>ID: {registeredMember.memberId}</Text>
              </View>
              <View style={styles.memberResultRank}>
                <Text style={styles.memberResultRankText}>{registeredMember.rank || 'BRONZE'}</Text>
              </View>
            </View>
            <Text style={styles.memberResultUrl} numberOfLines={1}>
              {registeredMember.affiliateUrl || `thaiprompt.com/affiliate?ref=${registeredMember.memberId}`}
            </Text>
            <View style={styles.successActions}>
              <TouchableOpacity
                style={styles.btnPrimary}
                onPress={() => navigation.navigate('Write', { prefillMember: registeredMember })}>
                <Text style={styles.btnPrimaryText}>✏️ เขียนการ์ดใหม่</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnSecondary} onPress={reset}>
                <Text style={styles.btnSecondaryText}>➕ ลงทะเบียนต่อ</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Error State */}
        {step === 'error' && (
          <View style={styles.errorCard}>
            <Text style={styles.errorIcon}>❌</Text>
            <Text style={styles.errorTitle}>เกิดข้อผิดพลาด</Text>
            <Text style={styles.errorMsg}>{errorMsg}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={reset}>
              <Text style={styles.retryBtnText}>↩️ ลองใหม่</Text>
            </TouchableOpacity>
          </View>
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
  stepsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  stepItem: { alignItems: 'center', flex: 1, position: 'relative' },
  stepCircle: {
    width: 28, height: 28, borderRadius: 14, borderWidth: 2,
    borderColor: Colors.border, backgroundColor: Colors.card,
    justifyContent: 'center', alignItems: 'center', marginBottom: 6,
  },
  stepCircleDone: { borderColor: Colors.success, backgroundColor: 'rgba(16,185,129,0.15)' },
  stepNum: { fontSize: 12, fontWeight: '700', color: Colors.textMuted },
  stepNumDone: { color: Colors.success },
  stepLabel: { fontSize: 9, color: Colors.textMuted, textAlign: 'center' },
  stepLine: {
    position: 'absolute', top: 14, right: -20,
    width: 40, height: 2, backgroundColor: Colors.border,
  },
  stepLineDone: { backgroundColor: Colors.success },
  modeRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  modeBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1,
    borderColor: Colors.border, backgroundColor: Colors.card, alignItems: 'center',
  },
  modeBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  modeBtnText: { fontSize: 12, fontWeight: '600', color: Colors.textMuted, textAlign: 'center' },
  modeBtnTextActive: { color: 'white' },
  inputLabel: { fontSize: 12, fontWeight: '600', color: Colors.textMuted, marginBottom: 6, marginTop: 12 },
  input: {
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 13, color: Colors.text,
  },
  searchRow: { flexDirection: 'row', gap: 10 },
  searchBtn: {
    backgroundColor: Colors.primary, borderRadius: 12, paddingHorizontal: 16,
    justifyContent: 'center',
  },
  searchBtnText: { fontSize: 13, fontWeight: '600', color: 'white' },
  selectedMemberCard: {
    backgroundColor: 'rgba(16,185,129,0.1)', borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: 'rgba(16,185,129,0.3)', marginTop: 12,
  },
  selectedLabel: { fontSize: 11, color: Colors.success, marginBottom: 4 },
  selectedName: { fontSize: 14, fontWeight: '700', color: Colors.text },
  selectedId: { fontSize: 11, color: Colors.textMuted },
  searchResult: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.card, borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: Colors.border, marginTop: 8,
  },
  searchResultSelected: { borderColor: Colors.primary },
  searchResultAvatar: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center',
  },
  searchResultAvatarText: { fontSize: 18, fontWeight: '700', color: 'white' },
  searchResultName: { fontSize: 13, fontWeight: '600', color: Colors.text },
  searchResultId: { fontSize: 11, color: Colors.textMuted },
  searchResultRank: { fontSize: 11, fontWeight: '700', color: Colors.warning },
  startBtn: {
    backgroundColor: Colors.primary, borderRadius: 14,
    paddingVertical: 16, alignItems: 'center', marginTop: 24,
  },
  startBtnText: { fontSize: 15, fontWeight: '600', color: 'white' },
  processingCard: {
    backgroundColor: Colors.card, borderRadius: 20, padding: 32,
    alignItems: 'center', borderWidth: 1, borderColor: Colors.border,
  },
  processingTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginBottom: 6 },
  processingHint: { fontSize: 12, color: Colors.textMuted, marginBottom: 20 },
  progressBarWrap: {
    width: '100%', height: 6, backgroundColor: Colors.surface,
    borderRadius: 20, overflow: 'hidden',
  },
  progressFill: {
    height: '100%', backgroundColor: Colors.primary, borderRadius: 20,
  },
  successCard: {
    backgroundColor: Colors.card, borderRadius: 20, padding: 24,
    borderWidth: 1, borderColor: 'rgba(16,185,129,0.3)', alignItems: 'center',
  },
  successIcon: { fontSize: 48, marginBottom: 12 },
  successTitle: { fontSize: 20, fontWeight: '700', color: Colors.text, marginBottom: 20 },
  memberResultCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.surface, borderRadius: 14, padding: 14, width: '100%', marginBottom: 10,
  },
  memberResultAvatar: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  memberResultAvatarText: { fontSize: 20, fontWeight: '700', color: 'white' },
  memberResultName: { fontSize: 15, fontWeight: '700', color: Colors.text, marginBottom: 2 },
  memberResultId: { fontSize: 11, color: Colors.textMuted },
  memberResultRank: {
    backgroundColor: 'rgba(245,158,11,0.15)', paddingHorizontal: 10,
    paddingVertical: 4, borderRadius: 20,
  },
  memberResultRankText: { fontSize: 11, fontWeight: '700', color: Colors.warning },
  memberResultUrl: { fontSize: 11, color: Colors.primary, marginBottom: 20, width: '100%' },
  successActions: { flexDirection: 'row', gap: 10, width: '100%' },
  btnPrimary: {
    flex: 1, backgroundColor: Colors.primary, borderRadius: 12,
    paddingVertical: 12, alignItems: 'center',
  },
  btnPrimaryText: { fontSize: 13, fontWeight: '600', color: 'white' },
  btnSecondary: {
    flex: 1, backgroundColor: Colors.card, borderRadius: 12,
    paddingVertical: 12, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  btnSecondaryText: { fontSize: 13, fontWeight: '600', color: Colors.text },
  errorCard: {
    backgroundColor: Colors.card, borderRadius: 20, padding: 32,
    alignItems: 'center', borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)',
  },
  errorIcon: { fontSize: 48, marginBottom: 12 },
  errorTitle: { fontSize: 18, fontWeight: '700', color: Colors.danger, marginBottom: 8 },
  errorMsg: { fontSize: 13, color: Colors.textMuted, textAlign: 'center', marginBottom: 24 },
  retryBtn: {
    backgroundColor: Colors.primary, borderRadius: 12, paddingHorizontal: 28, paddingVertical: 14,
  },
  retryBtnText: { fontSize: 14, fontWeight: '600', color: 'white' },
});

export default MemberRegisterScreen;
