import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import Toast from 'react-native-toast-message';
import { readSourceForClone, writeCloneToTarget, cancelNFC } from '../services/nfcService';
import { addScanRecord } from '../services/storageService';
import { CloneOperation } from '../types';
import { Colors } from '../utils/theme';

const CloneScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [operation, setOperation] = useState<CloneOperation | null>(null);
  const [isWorking, setIsWorking] = useState(false);

  const readSource = async () => {
    setIsWorking(true);
    const op = await readSourceForClone();
    if (op.status === 'error') {
      Toast.show({ type: 'error', text1: 'อ่านการ์ดต้นทางไม่สำเร็จ' });
    } else {
      ReactNativeHapticFeedback.trigger('notificationSuccess');
      Toast.show({ type: 'success', text1: '✅ อ่านการ์ดต้นทางสำเร็จ' });
    }
    setOperation(op);
    setIsWorking(false);
  };

  const writeTarget = async () => {
    if (!operation) return;
    setIsWorking(true);
    const result = await writeCloneToTarget(operation);
    setOperation(result);
    if (result.status === 'done') {
      ReactNativeHapticFeedback.trigger('notificationSuccess');
      Toast.show({ type: 'success', text1: '✅ โคลนสำเร็จ!', text2: result.targetTag?.id });
      await addScanRecord({
        id: `clone_${Date.now()}`,
        timestamp: Date.now(),
        tag: result.sourceTag,
        ndefRecords: result.sourceRecords,
        operation: 'clone',
        success: true,
      });
    } else {
      Toast.show({ type: 'error', text1: 'โคลนไม่สำเร็จ' });
    }
    setIsWorking(false);
  };

  const reset = () => { setOperation(null); };

  const steps = [
    { label: 'อ่านการ์ดต้นทาง', done: !!operation && operation.status !== 'reading_source' },
    { label: 'แตะการ์ดปลายทาง', done: operation?.status === 'done' },
    { label: 'โคลนสำเร็จ', done: operation?.status === 'done' },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />
      <View style={styles.appBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>โคลนการ์ด NFC</Text>
          <Text style={styles.subtitle}>Clone / Copy NDEF Tag</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Visual */}
        <View style={styles.visual}>
          <View>
            <View style={[styles.card3d, styles.cardSource]}>
              <Text style={styles.cardIcon}>💳</Text>
              {operation?.sourceTag && (
                <Text style={styles.cardUid} numberOfLines={1}>
                  {operation.sourceTag.id}
                </Text>
              )}
            </View>
            <Text style={styles.cardLabel}>ต้นทาง</Text>
          </View>
          <Text style={styles.arrow}>→</Text>
          <View>
            <View style={[styles.card3d, styles.cardTarget]}>
              {operation?.targetTag ? (
                <>
                  <Text style={styles.cardIcon}>💳</Text>
                  <Text style={styles.cardUid} numberOfLines={1}>
                    {operation.targetTag.id}
                  </Text>
                </>
              ) : (
                <Text style={styles.cardPlus}>＋</Text>
              )}
            </View>
            <Text style={styles.cardLabel}>ปลายทาง</Text>
          </View>
        </View>

        {/* Source Info */}
        {operation?.sourceTag && (
          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <View style={styles.infoIcon}><Text>💳</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.infoTitle}>การ์ดต้นทาง</Text>
                <Text style={styles.infoSub}>{operation.sourceTag.type || 'NFC Tag'}</Text>
              </View>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>✓ พร้อม</Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoKey}>UID</Text>
              <Text style={[styles.infoVal, { color: Colors.secondary }]}>{operation.sourceTag.id}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoKey}>NDEF Records</Text>
              <Text style={styles.infoVal}>{operation.sourceRecords.length} records</Text>
            </View>
            {operation.sourceRecords.slice(0, 2).map((r, i) => (
              <View key={i} style={styles.recordPreview}>
                <Text style={styles.recordPreviewType}>{r.recordType.toUpperCase()}</Text>
                <Text style={styles.recordPreviewData} numberOfLines={1}>{r.decodedData}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Steps */}
        <View style={styles.stepsCard}>
          {steps.map((s, i) => (
            <View key={i} style={styles.stepItem}>
              <View style={[styles.stepNum,
                s.done ? styles.stepNumDone :
                (!operation && i === 0) || (operation?.status === 'waiting_target' && i === 1)
                  ? styles.stepNumActive : styles.stepNumPending]}>
                <Text style={styles.stepNumText}>{s.done ? '✓' : i + 1}</Text>
              </View>
              <View>
                <Text style={styles.stepLabel}>{s.label}</Text>
                <Text style={styles.stepSub}>
                  {i === 0 ? 'แตะการ์ดที่ต้องการคัดลอก' :
                   i === 1 ? 'วางการ์ดเปล่าที่ต้องการเขียน' :
                   'ตรวจสอบข้อมูลสำเร็จ'}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.warnBox}>
          <Text style={styles.warnText}>⚠️ รองรับเฉพาะการ์ดที่ writable เท่านั้น (NTAG213/215/216, NFC Type 2/4)</Text>
        </View>

        {/* Done State */}
        {operation?.status === 'done' && (
          <View style={styles.doneCard}>
            <Text style={styles.doneIcon}>🎉</Text>
            <Text style={styles.doneTitle}>โคลนสำเร็จ!</Text>
            <Text style={styles.doneSub}>UID: {operation.targetTag?.id}</Text>
            <TouchableOpacity style={styles.resetBtn} onPress={reset}>
              <Text style={styles.resetBtnText}>🔄 โคลนใหม่</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Action Button */}
        {operation?.status !== 'done' && !isWorking && (
          <TouchableOpacity
            style={styles.mainBtn}
            onPress={!operation ? readSource : writeTarget}>
            <Text style={styles.mainBtnText}>
              {!operation ? '📡 แตะการ์ดต้นทาง' : '🔄 แตะการ์ดปลายทาง'}
            </Text>
          </TouchableOpacity>
        )}

        {isWorking && (
          <View style={styles.workingBox}>
            <ActivityIndicator color={Colors.primary} />
            <Text style={styles.workingText}>
              {!operation || operation.status === 'reading_source' ? 'กำลังอ่าน...' : 'กำลังเขียน...'}
            </Text>
          </View>
        )}

        {operation && operation.status !== 'done' && !isWorking && (
          <TouchableOpacity style={styles.resetBtn2} onPress={reset}>
            <Text style={styles.resetBtn2Text}>↩️ เริ่มใหม่</Text>
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
  visual: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 20, marginBottom: 20 },
  card3d: {
    width: 120, height: 75, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  cardSource: {
    backgroundColor: '#1a2040', borderWidth: 1, borderColor: 'rgba(34,211,238,0.4)',
  },
  cardTarget: {
    backgroundColor: '#201a40', borderWidth: 1, borderStyle: 'dashed',
    borderColor: 'rgba(99,102,241,0.4)',
  },
  cardIcon: { fontSize: 28 },
  cardUid: { fontSize: 8, color: Colors.textMuted, marginTop: 4, fontFamily: 'monospace' },
  cardPlus: { fontSize: 32, color: Colors.textMuted },
  cardLabel: { textAlign: 'center', fontSize: 10, color: Colors.textMuted, marginTop: 6 },
  arrow: { fontSize: 24, color: Colors.primary },
  infoCard: {
    backgroundColor: Colors.card, borderRadius: 20, padding: 18,
    borderWidth: 1, borderColor: 'rgba(34,211,238,0.3)', marginBottom: 16,
  },
  infoHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  infoIcon: {
    width: 40, height: 40, borderRadius: 10, backgroundColor: 'rgba(34,211,238,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  infoTitle: { fontSize: 14, fontWeight: '700', color: Colors.text },
  infoSub: { fontSize: 11, color: Colors.textMuted },
  statusBadge: {
    backgroundColor: 'rgba(16,185,129,0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },
  statusText: { fontSize: 11, color: Colors.success, fontWeight: '600' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  infoKey: { fontSize: 12, color: Colors.textMuted },
  infoVal: { fontSize: 12, fontWeight: '600', color: Colors.text, fontFamily: 'monospace' },
  recordPreview: {
    flexDirection: 'row', gap: 8, marginTop: 6, alignItems: 'center',
  },
  recordPreviewType: {
    fontSize: 10, color: Colors.secondary, fontWeight: '700',
    backgroundColor: 'rgba(34,211,238,0.1)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
  },
  recordPreviewData: { fontSize: 11, color: Colors.textDim, flex: 1 },
  stepsCard: {
    backgroundColor: Colors.card, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 12,
  },
  stepItem: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  stepNum: {
    width: 26, height: 26, borderRadius: 13, justifyContent: 'center', alignItems: 'center',
    backgroundColor: Colors.surface,
  },
  stepNumDone: { backgroundColor: 'rgba(16,185,129,0.2)' },
  stepNumActive: { backgroundColor: 'rgba(99,102,241,0.2)' },
  stepNumPending: { backgroundColor: Colors.surface },
  stepNumText: { fontSize: 11, fontWeight: '700', color: Colors.textMuted },
  stepLabel: { fontSize: 13, fontWeight: '500', color: Colors.text, marginBottom: 2 },
  stepSub: { fontSize: 11, color: Colors.textMuted },
  warnBox: {
    backgroundColor: 'rgba(245,158,11,0.1)', borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)', marginBottom: 16,
  },
  warnText: { fontSize: 12, color: Colors.warning },
  doneCard: {
    backgroundColor: Colors.card, borderRadius: 20, padding: 32,
    alignItems: 'center', borderWidth: 1, borderColor: 'rgba(16,185,129,0.3)', marginBottom: 16,
  },
  doneIcon: { fontSize: 48, marginBottom: 12 },
  doneTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 6 },
  doneSub: { fontSize: 12, color: Colors.textMuted, fontFamily: 'monospace', marginBottom: 20 },
  resetBtn: {
    backgroundColor: Colors.primary, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12,
  },
  resetBtnText: { fontSize: 13, fontWeight: '600', color: 'white' },
  mainBtn: {
    backgroundColor: Colors.primary, borderRadius: 14,
    paddingVertical: 16, alignItems: 'center', marginBottom: 10,
  },
  mainBtnText: { fontSize: 15, fontWeight: '600', color: 'white' },
  workingBox: {
    flexDirection: 'row', gap: 12, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.card, borderRadius: 14, paddingVertical: 16,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 10,
  },
  workingText: { fontSize: 14, color: Colors.textMuted },
  resetBtn2: {
    backgroundColor: Colors.card, borderRadius: 14, paddingVertical: 14,
    alignItems: 'center', borderWidth: 1, borderColor: Colors.border,
  },
  resetBtn2Text: { fontSize: 14, fontWeight: '600', color: Colors.textMuted },
});

export default CloneScreen;
