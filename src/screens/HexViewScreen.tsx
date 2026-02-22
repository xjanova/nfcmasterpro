import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  StatusBar, ActivityIndicator, Clipboard,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { readMifareHex } from '../services/nfcService';
import { formatHexDump, HexDumpLine } from '../utils/hexUtils';
import { NFCScanResult } from '../types';
import { Colors } from '../utils/theme';

type HexView = 'hex_ascii' | 'hex_only' | 'ndef_parse' | 'sector_map';

const HexViewScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const result: NFCScanResult | undefined = route.params?.result;

  const [view, setView] = useState<HexView>('hex_ascii');
  const [loading, setLoading] = useState(false);
  const [hexLines, setHexLines] = useState<HexDumpLine[]>([]);
  const [mifareHex, setMifareHex] = useState<string>('');
  const [mifareError, setMifareError] = useState<string | null>(null);

  useEffect(() => {
    if (result?.rawHex) {
      // Parse existing raw hex from scan result
      const bytes: number[] = [];
      result.rawHex.split('\n').forEach(line => {
        const parts = line.split('  ');
        if (parts.length >= 2) {
          parts[1].split(' ').forEach(h => {
            const b = parseInt(h, 16);
            if (!isNaN(b)) bytes.push(b);
          });
        }
      });
      if (bytes.length > 0) {
        setHexLines(formatHexDump(bytes));
      }
    }
  }, [result]);

  const loadMifareHex = async () => {
    setLoading(true);
    setMifareError(null);
    try {
      const res = await readMifareHex();
      if (res.error) {
        setMifareError(res.error);
      } else {
        setMifareHex(res.hex);
        // Parse for display
        const bytes = res.hex.split('\n').flatMap(line =>
          line.trim().split(' ').map(h => parseInt(h, 16)).filter(b => !isNaN(b))
        );
        setHexLines(formatHexDump(bytes));
      }
    } catch (err: any) {
      setMifareError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyHex = () => {
    const hexText = hexLines.map(l => `${l.offset}  ${l.hexPart}  |${l.asciiPart}|`).join('\n');
    Clipboard.setString(hexText);
    Toast.show({ type: 'success', text1: '📋 คัดลอก Hex แล้ว' });
  };

  const viewOptions: { key: HexView; label: string }[] = [
    { key: 'hex_ascii', label: 'Hex+ASCII' },
    { key: 'hex_only', label: 'Hex Only' },
    { key: 'ndef_parse', label: 'NDEF Parse' },
    { key: 'sector_map', label: 'Sector Map' },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />
      <View style={styles.appBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Hex / Raw Data</Text>
          <Text style={styles.subtitle}>{result?.tag.type || 'NFC Tag'}</Text>
        </View>
        <TouchableOpacity style={styles.iconBtn} onPress={copyHex}>
          <Text>📋</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Tag Technical Info */}
        {result && (
          <View style={styles.techGrid}>
            {[
              ['UID', result.tag.id],
              ['Type', result.tag.type || 'Unknown'],
              result.tag.atqa ? ['ATQA', result.tag.atqa] : ['Tech', result.tag.techTypes[0]?.split('.').pop() || '-'],
              result.tag.sak ? ['SAK', result.tag.sak] : ['Size', result.tag.size ? `${result.tag.size}B` : '-'],
            ].map(([key, val]) => (
              <View key={key as string} style={styles.techCard}>
                <Text style={styles.techKey}>{key as string}</Text>
                <Text style={styles.techVal}>{val as string}</Text>
              </View>
            ))}
          </View>
        )}

        {/* View Mode Selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.viewModeScroll}>
          {viewOptions.map(opt => (
            <TouchableOpacity
              key={opt.key}
              style={[styles.viewBtn, view === opt.key && styles.viewBtnActive]}
              onPress={() => setView(opt.key)}>
              <Text style={[styles.viewBtnText, view === opt.key && styles.viewBtnTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Hex Dump */}
        {(view === 'hex_ascii' || view === 'hex_only') && (
          <>
            {hexLines.length === 0 && !result?.rawHex && (
              <TouchableOpacity style={styles.loadBtn} onPress={loadMifareHex} disabled={loading}>
                {loading ? (
                  <ActivityIndicator color={Colors.secondary} />
                ) : (
                  <Text style={styles.loadBtnText}>📡 โหลด Raw Hex Data</Text>
                )}
              </TouchableOpacity>
            )}
            {mifareError && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>⚠️ {mifareError}</Text>
              </View>
            )}
            {hexLines.length > 0 && (
              <ScrollView horizontal style={styles.hexDump}>
                <View>
                  {hexLines.map((line, i) => (
                    <View key={i} style={styles.hexRow}>
                      <Text style={styles.hexOffset}>{line.offset}</Text>
                      {view === 'hex_ascii' ? (
                        <>
                          <View style={styles.hexBytesRow}>
                            {line.hexBytes.map((b, j) => (
                              <Text
                                key={j}
                                style={[
                                  styles.hexByte,
                                  b.highlight && styles.hexByteHighlight,
                                  b.value === '00' && styles.hexByteZero,
                                ]}>
                                {b.value}{' '}
                              </Text>
                            ))}
                          </View>
                          <Text style={styles.hexAscii}>|{line.asciiPart}|</Text>
                        </>
                      ) : (
                        <View style={styles.hexBytesRow}>
                          {line.hexBytes.map((b, j) => (
                            <Text key={j} style={[styles.hexByte, b.highlight && styles.hexByteHighlight]}>
                              {b.value}{' '}
                            </Text>
                          ))}
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              </ScrollView>
            )}
          </>
        )}

        {/* NDEF Parse View */}
        {view === 'ndef_parse' && result && (
          <View>
            {result.ndefRecords.length === 0 ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>ℹ️ ไม่พบ NDEF records</Text>
              </View>
            ) : (
              result.ndefRecords.map((r, i) => (
                <View key={i} style={styles.ndefCard}>
                  <Text style={styles.ndefTitle}>Record {i + 1}: {r.recordType.toUpperCase()}</Text>
                  <View style={styles.ndefRow}><Text style={styles.ndefKey}>TNF</Text><Text style={styles.ndefVal}>{r.tnf}</Text></View>
                  <View style={styles.ndefRow}><Text style={styles.ndefKey}>Type</Text><Text style={styles.ndefVal}>{r.type}</Text></View>
                  <View style={styles.ndefRow}><Text style={styles.ndefKey}>Payload Size</Text><Text style={styles.ndefVal}>{r.payloadSize} bytes</Text></View>
                  <View style={styles.ndefRow}><Text style={styles.ndefKey}>Decoded</Text><Text style={[styles.ndefVal, { flex: 1, flexWrap: 'wrap' }]}>{r.decodedData}</Text></View>
                  {r.language && <View style={styles.ndefRow}><Text style={styles.ndefKey}>Language</Text><Text style={styles.ndefVal}>{r.language}</Text></View>}
                  {/* Raw payload */}
                  <Text style={styles.ndefRawLabel}>Raw Payload:</Text>
                  <Text style={styles.ndefRaw}>
                    {r.payload.slice(0, 32).map(b => b.toString(16).toUpperCase().padStart(2, '0')).join(' ')}
                    {r.payload.length > 32 ? ` ... +${r.payload.length - 32} more` : ''}
                  </Text>
                </View>
              ))
            )}
          </View>
        )}

        {/* Sector Map */}
        {view === 'sector_map' && (
          <View>
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>
                ℹ️ MIFARE Classic Sector Map{'\n'}
                แตะ "โหลด Raw Hex Data" เพื่อแสดง Sector Map
              </Text>
            </View>
            <TouchableOpacity style={styles.loadBtn} onPress={loadMifareHex} disabled={loading}>
              {loading ? (
                <ActivityIndicator color={Colors.secondary} />
              ) : (
                <Text style={styles.loadBtnText}>📡 โหลด Sector Data</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.btnPrimary} onPress={copyHex}>
            <Text style={styles.btnPrimaryText}>📋 คัดลอก Hex</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.btnSecondary}
            onPress={() => {
              const text = hexLines.map(l => `${l.offset}  ${l.hexPart}  |${l.asciiPart}|`).join('\n');
              Toast.show({ type: 'info', text1: 'Export ยังไม่พร้อม', text2: 'กำลังพัฒนาอยู่' });
            }}>
            <Text style={styles.btnSecondaryText}>💾 Export</Text>
          </TouchableOpacity>
        </View>

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
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
    justifyContent: 'center', alignItems: 'center',
  },
  scroll: { flex: 1, paddingHorizontal: 20 },
  techGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  techCard: {
    width: '47%', backgroundColor: Colors.card, borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: Colors.border,
  },
  techKey: { fontSize: 10, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  techVal: { fontSize: 12, fontWeight: '600', color: Colors.secondary, fontFamily: 'monospace' },
  viewModeScroll: { marginBottom: 14 },
  viewBtn: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
    borderWidth: 1, borderColor: Colors.border, marginRight: 8,
    backgroundColor: Colors.card,
  },
  viewBtnActive: { borderColor: Colors.primary },
  viewBtnText: { fontSize: 11, fontWeight: '600', color: Colors.textMuted },
  viewBtnTextActive: { color: Colors.primary },
  hexDump: {
    backgroundColor: Colors.surface, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: Colors.border,
  },
  hexRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  hexOffset: { color: Colors.textMuted, fontSize: 11, width: 40, fontFamily: 'monospace' },
  hexBytesRow: { flexDirection: 'row' },
  hexByte: { fontSize: 11, color: Colors.secondary, fontFamily: 'monospace' },
  hexByteHighlight: { color: Colors.warning },
  hexByteZero: { color: Colors.textMuted },
  hexAscii: { fontSize: 11, color: Colors.textDim, fontFamily: 'monospace', marginLeft: 8 },
  loadBtn: {
    backgroundColor: Colors.card, borderRadius: 12, padding: 16, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border, marginBottom: 12,
  },
  loadBtnText: { fontSize: 14, fontWeight: '600', color: Colors.secondary },
  errorBox: {
    backgroundColor: Colors.card, borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 12,
  },
  errorText: { fontSize: 12, color: Colors.textMuted, lineHeight: 18 },
  ndefCard: {
    backgroundColor: Colors.card, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: Colors.border, marginBottom: 10,
  },
  ndefTitle: { fontSize: 13, fontWeight: '700', color: Colors.text, marginBottom: 10 },
  ndefRow: { flexDirection: 'row', gap: 10, paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' },
  ndefKey: { fontSize: 11, color: Colors.textMuted, width: 90 },
  ndefVal: { fontSize: 11, color: Colors.textDim, fontFamily: 'monospace' },
  ndefRawLabel: { fontSize: 11, color: Colors.textMuted, marginTop: 10, marginBottom: 4 },
  ndefRaw: { fontSize: 10, color: Colors.secondary, fontFamily: 'monospace', lineHeight: 16 },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 16 },
  btnPrimary: {
    flex: 1, backgroundColor: Colors.primary, borderRadius: 12,
    paddingVertical: 12, alignItems: 'center',
  },
  btnPrimaryText: { fontSize: 13, fontWeight: '600', color: 'white' },
  btnSecondary: {
    backgroundColor: Colors.card, borderRadius: 12, paddingHorizontal: 20,
    paddingVertical: 12, borderWidth: 1, borderColor: Colors.border,
  },
  btnSecondaryText: { fontSize: 13, fontWeight: '600', color: Colors.text },
});

export default HexViewScreen;
