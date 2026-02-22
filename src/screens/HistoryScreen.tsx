import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  StatusBar, Alert, ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getScanHistory, deleteScanRecord, clearHistory } from '../services/storageService';
import { NFCScanResult } from '../types';
import { Colors } from '../utils/theme';

type FilterType = 'all' | 'read' | 'write' | 'clone' | 'register';

const HistoryScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [filter, setFilter] = useState<FilterType>('all');
  const [history, setHistory] = useState<NFCScanResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    const data = await getScanHistory();
    setHistory(data);
    setLoading(false);
  }, []);

  useEffect(() => { loadHistory(); }, []);

  const filteredHistory = filter === 'all'
    ? history
    : history.filter(r => r.operation === filter);

  const confirmClearAll = () => {
    Alert.alert('ลบประวัติทั้งหมด', 'ต้องการลบประวัติทั้งหมดหรือไม่?', [
      { text: 'ยกเลิก', style: 'cancel' },
      { text: 'ลบทั้งหมด', style: 'destructive', onPress: async () => {
        await clearHistory(); loadHistory();
      }},
    ]);
  };

  const confirmDelete = (id: string) => {
    Alert.alert('ลบรายการนี้', 'ต้องการลบหรือไม่?', [
      { text: 'ยกเลิก', style: 'cancel' },
      { text: 'ลบ', style: 'destructive', onPress: async () => {
        await deleteScanRecord(id); loadHistory();
      }},
    ]);
  };

  const getOpConfig = (op: string) => {
    switch (op) {
      case 'read': return { label: 'อ่าน', color: Colors.secondary, icon: '📡' };
      case 'write': return { label: 'เขียน', color: Colors.primary, icon: '✏️' };
      case 'clone': return { label: 'โคลน', color: Colors.warning, icon: '🔄' };
      case 'register': return { label: 'ลงทะเบียน', color: Colors.success, icon: '📝' };
      default: return { label: op, color: Colors.textMuted, icon: '📦' };
    }
  };

  const formatDate = (ts: number): string => {
    const d = new Date(ts);
    return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }) +
      ' ' + d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
  };

  const renderItem = ({ item }: { item: NFCScanResult }) => {
    const { label, color, icon } = getOpConfig(item.operation);
    const isExpanded = expandedId === item.id;

    return (
      <TouchableOpacity
        style={styles.historyItem}
        onPress={() => setExpandedId(isExpanded ? null : item.id)}
        onLongPress={() => confirmDelete(item.id)}>
        <View style={styles.itemHeader}>
          <View style={[styles.opIcon, { backgroundColor: color + '22' }]}>
            <Text>{icon}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.itemTitle}>{item.tag.type || 'NFC Tag'}</Text>
            <Text style={styles.itemTime}>{formatDate(item.timestamp)} · {item.tag.id}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={[styles.opLabel, { color }]}>{label}</Text>
            <Text style={styles.recordCount}>
              {item.ndefRecords.length > 0 ? `${item.ndefRecords.length} records` : ''}
            </Text>
          </View>
        </View>

        {isExpanded && (
          <View style={styles.detailBox}>
            {item.ndefRecords.map((r, i) => (
              <View key={i} style={styles.detailRow}>
                <Text style={styles.detailKey}>{r.recordType.toUpperCase()}</Text>
                <Text style={styles.detailVal} numberOfLines={1}>{r.decodedData}</Text>
              </View>
            ))}
            {item.memberInfo && (
              <View style={styles.detailRow}>
                <Text style={styles.detailKey}>สมาชิก</Text>
                <Text style={styles.detailVal}>{item.memberInfo.name} ({item.memberInfo.memberId})</Text>
              </View>
            )}
            <View style={styles.detailActions}>
              {item.operation === 'read' && (
                <TouchableOpacity
                  style={styles.detailBtn}
                  onPress={() => navigation.navigate('ReadResult', { result: item })}>
                  <Text style={styles.detailBtnText}>ดูรายละเอียด →</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.detailBtn, styles.detailBtnDanger]}
                onPress={() => confirmDelete(item.id)}>
                <Text style={[styles.detailBtnText, { color: Colors.danger }]}>🗑️ ลบ</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'ทั้งหมด' },
    { key: 'read', label: '📡 อ่าน' },
    { key: 'write', label: '✏️ เขียน' },
    { key: 'clone', label: '🔄 โคลน' },
    { key: 'register', label: '📝 ลงทะเบียน' },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />
      <View style={styles.appBar}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>ประวัติการสแกน</Text>
          <Text style={styles.subtitle}>{history.length} รายการ</Text>
        </View>
        <TouchableOpacity style={styles.clearBtn} onPress={confirmClearAll}>
          <Text style={styles.clearBtnText}>🗑️ ล้าง</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Pills */}
      <FlatList
        horizontal
        data={filters}
        keyExtractor={f => f.key}
        renderItem={({ item: f }) => (
          <TouchableOpacity
            style={[styles.filterPill, filter === f.key && styles.filterPillActive]}
            onPress={() => setFilter(f.key)}>
            <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        )}
        style={styles.filterList}
        contentContainerStyle={{ paddingHorizontal: 20 }}
        showsHorizontalScrollIndicator={false}
      />

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={Colors.primary} />
        </View>
      ) : filteredHistory.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyTitle}>ยังไม่มีประวัติ</Text>
          <Text style={styles.emptySub}>เริ่มสแกน NFC card เพื่อบันทึกประวัติ</Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={() => navigation.navigate('Read')}>
            <Text style={styles.emptyBtnText}>📡 เริ่มสแกน</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredHistory}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  appBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12,
  },
  title: { fontSize: 20, fontWeight: '700', color: Colors.text },
  subtitle: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  clearBtn: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
  },
  clearBtnText: { fontSize: 12, fontWeight: '600', color: Colors.danger },
  filterList: { marginBottom: 12 },
  filterPill: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: Colors.border, marginRight: 8,
  },
  filterPillActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterText: { fontSize: 12, fontWeight: '600', color: Colors.textMuted },
  filterTextActive: { color: 'white' },
  list: { paddingHorizontal: 20, paddingBottom: 20 },
  historyItem: {
    backgroundColor: Colors.card, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 10,
  },
  itemHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  opIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  itemTitle: { fontSize: 13, fontWeight: '600', color: Colors.text },
  itemTime: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  opLabel: { fontSize: 11, fontWeight: '700' },
  recordCount: { fontSize: 10, color: Colors.textMuted },
  detailBox: {
    backgroundColor: Colors.surface, borderRadius: 10, padding: 12, marginTop: 12,
  },
  detailRow: {
    flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3,
  },
  detailKey: { fontSize: 11, color: Colors.textMuted },
  detailVal: { fontSize: 11, color: Colors.textDim, fontFamily: 'monospace', flex: 1, textAlign: 'right' },
  detailActions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  detailBtn: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
  },
  detailBtnDanger: { borderColor: Colors.danger + '44' },
  detailBtnText: { fontSize: 12, fontWeight: '600', color: Colors.textDim },
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyBox: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 60, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 8 },
  emptySub: { fontSize: 13, color: Colors.textMuted, textAlign: 'center', marginBottom: 24 },
  emptyBtn: {
    backgroundColor: Colors.primary, borderRadius: 12,
    paddingHorizontal: 24, paddingVertical: 12,
  },
  emptyBtnText: { fontSize: 14, fontWeight: '600', color: 'white' },
});

export default HistoryScreen;
